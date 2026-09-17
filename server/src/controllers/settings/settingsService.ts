import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory cache for fast read performance with TTL
const settingsCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export const SECRET_MASK = '__SET__';

export interface SettingUpdatePayload {
  key: string;
  value: any;
  group?: string;
  dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SECRET';
  isSecret?: boolean;
  scope?: 'GLOBAL' | 'STOREFRONT' | 'ADMIN';
  changeReason?: string;
}

export async function getSettingValue<T = any>(key: string, defaultValue?: T, unmaskSecret: boolean = false): Promise<T> {
  const cached = settingsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) {
    return defaultValue as T;
  }

  let parsedValue: any = setting.value;

  if (setting.dataType === 'NUMBER') {
    parsedValue = parseFloat(setting.value);
  } else if (setting.dataType === 'BOOLEAN') {
    parsedValue = setting.value === 'true' || setting.value === '1';
  } else if (setting.dataType === 'JSON') {
    try {
      parsedValue = JSON.parse(setting.value);
    } catch {
      parsedValue = setting.value;
    }
  } else if (setting.dataType === 'SECRET' && !unmaskSecret) {
    parsedValue = SECRET_MASK;
  }

  // Cache non-secret or safe values
  if (!setting.isSecret) {
    settingsCache.set(key, { value: parsedValue, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return parsedValue as T;
}

export async function getSettingsByGroup(group: string, unmaskSecrets: boolean = false): Promise<Record<string, any>> {
  const settings = await prisma.systemSetting.findMany({ where: { group } });
  const result: Record<string, any> = {};

  for (const s of settings) {
    let val: any = s.value;
    if (s.dataType === 'NUMBER') val = parseFloat(s.value);
    else if (s.dataType === 'BOOLEAN') val = s.value === 'true' || s.value === '1';
    else if (s.dataType === 'JSON') {
      try { val = JSON.parse(s.value); } catch { val = s.value; }
    } else if (s.isSecret && !unmaskSecrets) {
      val = SECRET_MASK;
    }
    // Remove group prefix from key if present for clean object mapping
    const cleanKey = s.key.startsWith(`${group.toLowerCase()}.`) ? s.key.replace(`${group.toLowerCase()}.`, '') : s.key;
    result[cleanKey] = val;
    result[s.key] = val; // Also keep full key
  }

  return result;
}

export async function saveSetting(
  payload: SettingUpdatePayload,
  actor: { id?: string; name?: string; role?: string } = {},
  environment: string = 'PRODUCTION'
) {
  const { key, value, group = 'GENERAL', dataType = 'STRING', isSecret = false, scope = 'GLOBAL', changeReason } = payload;

  // Format value to string for storage
  let stringValue: string;
  if (dataType === 'JSON' || typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value ?? '');
  }

  const existing = await prisma.systemSetting.findUnique({ where: { key } });

  // If secret and value is the mask or blank, don't overwrite with mask
  if (isSecret && (value === SECRET_MASK || value === '••••••••••••••••' || value === '' || value === undefined) && existing) {
    return existing;
  }

  const updated = await prisma.$transaction(async (tx) => {
    let settingRecord;

    if (existing) {
      settingRecord = await tx.systemSetting.update({
        where: { key },
        data: {
          value: stringValue,
          group,
          dataType,
          isSecret,
          scope,
          version: existing.version + 1,
          updatedById: actor.id || null,
          updatedByName: actor.name || 'Administrator',
          changeReason: changeReason || null
        }
      });

      // Record immutable setting version
      await tx.settingVersion.create({
        data: {
          settingKey: key,
          group,
          oldValue: existing.isSecret ? SECRET_MASK : existing.value,
          newValue: isSecret ? SECRET_MASK : stringValue,
          versionNumber: existing.version + 1,
          changedById: actor.id || null,
          changedByName: actor.name || 'Administrator',
          changeReason: changeReason || null,
          environment
        }
      });
    } else {
      settingRecord = await tx.systemSetting.create({
        data: {
          key,
          value: stringValue,
          group,
          dataType,
          isSecret,
          scope,
          version: 1,
          updatedById: actor.id || null,
          updatedByName: actor.name || 'System',
          changeReason: changeReason || 'Initial setup'
        }
      });

      await tx.settingVersion.create({
        data: {
          settingKey: key,
          group,
          oldValue: null,
          newValue: isSecret ? SECRET_MASK : stringValue,
          versionNumber: 1,
          changedById: actor.id || null,
          changedByName: actor.name || 'System',
          changeReason: changeReason || 'Initial setup',
          environment
        }
      });
    }

    // Create Audit Log
    await tx.settingAuditLog.create({
      data: {
        actorId: actor.id || null,
        actorName: actor.name || 'Administrator',
        actorRole: actor.role || 'ADMIN',
        action: existing ? 'UPDATED' : 'CREATED',
        settingKey: key,
        group,
        details: isSecret ? `Updated secret setting ${key}` : `Updated setting ${key} to ${stringValue.slice(0, 100)}`,
        environment
      }
    });

    return settingRecord;
  });

  // Invalidate cache
  settingsCache.delete(key);

  return updated;
}

export async function bulkSaveSettings(
  settings: SettingUpdatePayload[],
  actor: { id?: string; name?: string; role?: string } = {},
  environment: string = 'PRODUCTION'
) {
  for (const s of settings) {
    await saveSetting(s, actor, environment);
  }
}
