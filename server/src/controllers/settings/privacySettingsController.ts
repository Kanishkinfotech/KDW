import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getSettingsByGroup, bulkSaveSettings } from './settingsService';

const prisma = new PrismaClient();

export const getPrivacySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('PRIVACY');
    const retentionRules = await prisma.dataRetentionRule.findMany();

    const response = {
      // Data Collection & Transparency
      data_collection_enabled: settings.data_collection_enabled ?? true,
      log_ip_addresses_for_downloads: settings.log_ip_addresses_for_downloads ?? true,
      log_user_agent_telemetry: settings.log_user_agent_telemetry ?? true,
      allow_customer_data_export: settings.allow_customer_data_export ?? true,
      allow_customer_account_deletion: settings.allow_customer_account_deletion ?? true,

      // Cookie Consent Categories
      enable_cookie_banner: settings.enable_cookie_banner ?? true,
      require_explicit_cookie_consent: settings.require_explicit_cookie_consent ?? true,
      cookie_banner_position: settings.cookie_banner_position || 'BOTTOM_RIGHT',

      // Data Retention Periods (in days)
      retention_customer_profiles_days: settings.retention_customer_profiles_days ?? 730,
      retention_login_logs_days: settings.retention_login_logs_days ?? 90,
      retention_download_logs_days: settings.retention_download_logs_days ?? 365,
      retention_support_tickets_days: settings.retention_support_tickets_days ?? 730,
      retention_audit_logs_days: settings.retention_audit_logs_days ?? 1825, // 5 years

      // Retention Rules Matrix from DB
      retention_rules: retentionRules
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updatePrivacySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList = Object.entries(updates).map(([key, value]) => {
      if (key.startsWith('_') || key === 'retention_rules') return null;
      const cleanKey = key.replace(/^privacy\./, '');
      return {
        key: `privacy.${cleanKey}`,
        value,
        group: 'PRIVACY',
        dataType: (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING') as any,
        changeReason: req.body._changeReason || 'Privacy policy and data retention update'
      };
    }).filter(Boolean);

    await bulkSaveSettings(payloadList as any[], authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Privacy configuration and retention rules updated.' });
  } catch (error) {
    next(error);
  }
};
