import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { saveSetting, SECRET_MASK } from './settingsService';

const prisma = new PrismaClient();

// 1. Query Settings Audit Logs with Filtering & Pagination
export const getSettingsAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { group, action, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (group && group !== 'ALL') where.group = String(group);
    if (action && action !== 'ALL') where.action = String(action);
    if (search) {
      where.OR = [
        { settingKey: { contains: String(search), mode: 'insensitive' } },
        { details: { contains: String(search), mode: 'insensitive' } },
        { actorName: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.settingAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.settingAuditLog.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Version History for a specific setting key
export const getSettingVersionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.params.key as string;

    const versions = await prisma.settingVersion.findMany({
      where: { settingKey: key },
      orderBy: { versionNumber: 'desc' }
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

// 3. Rollback Setting to a Historical Version
export const rollbackSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, targetVersionNumber, reason } = req.body;
    const authUser = (req as any).user;

    if (!key || !targetVersionNumber) {
      return res.status(400).json({ success: false, message: 'Setting key and target version number are required.' });
    }

    const targetVersion = await prisma.settingVersion.findFirst({
      where: { settingKey: key, versionNumber: parseInt(String(targetVersionNumber), 10) }
    });

    if (!targetVersion) {
      return res.status(404).json({ success: false, message: `Version ${targetVersionNumber} not found for setting '${key}'` });
    }

    if (targetVersion.newValue === SECRET_MASK) {
      return res.status(400).json({
        success: false,
        message: 'Direct rollback of masked secret values is not permitted. Please re-enter the authorized credential directly.'
      });
    }

    // Save as a new version
    await saveSetting(
      {
        key,
        value: targetVersion.newValue,
        group: targetVersion.group,
        changeReason: reason || `Rollback to Version ${targetVersionNumber}.0.0`
      },
      authUser || { name: 'Admin' }
    );

    // Audit Log for Rollback
    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'ROLLED_BACK',
        settingKey: key,
        group: targetVersion.group,
        details: `Rolled back setting '${key}' to configuration from Version ${targetVersionNumber}`
      }
    });

    res.json({
      success: true,
      message: `Setting '${key}' successfully rolled back to Version ${targetVersionNumber}.`
    });
  } catch (error) {
    next(error);
  }
};
