import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings } from './settingsService';

export const getDownloadSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('DOWNLOAD');

    const response = {
      // Default Access Policy
      default_download_limit: settings.default_download_limit ?? 5,
      default_access_duration_days: settings.default_access_duration_days ?? 365,
      require_login_for_download: settings.require_login_for_download ?? true,
      allow_guest_download_access: settings.allow_guest_download_access ?? true,

      // Secure Token Parameters
      token_lifetime_minutes: settings.token_lifetime_minutes ?? 15,
      max_active_tokens_per_user: settings.max_active_tokens_per_user ?? 3,
      token_rate_limit_attempts: settings.token_rate_limit_attempts ?? 10,
      hash_tokens_in_database: settings.hash_tokens_in_database ?? true,

      // File Rules & Google Drive Delivery
      allowed_mime_types: settings.allowed_mime_types || [
        'application/zip', 'application/x-zip-compressed', 'application/json',
        'application/pdf', 'video/mp4', 'image/jpeg', 'image/png', 'application/octet-stream'
      ],
      max_file_size_mb: settings.max_file_size_mb ?? 5120, // 5GB
      require_google_drive_verification: settings.require_google_drive_verification ?? true,
      google_drive_parent_folder_id: settings.google_drive_parent_folder_id || 'root',

      // Refund Revocation & Logging
      refund_access_revocation: settings.refund_access_revocation || 'REVOKE_IMMEDIATELY', // REVOKE_IMMEDIATELY, REVOKE_ON_REVIEW, KEEP_ACCESS
      log_download_telemetry: settings.log_download_telemetry ?? true,
      auto_expire_inactive_tokens: settings.auto_expire_inactive_tokens ?? true
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateDownloadSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList = Object.entries(updates).map(([key, value]) => {
      if (key.startsWith('_')) return null;
      const cleanKey = key.replace(/^download\./, '');
      return {
        key: `download.${cleanKey}`,
        value,
        group: 'DOWNLOAD',
        dataType: (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING') as any,
        changeReason: req.body._changeReason || 'Download and digital delivery policy update'
      };
    }).filter(Boolean);

    await bulkSaveSettings(payloadList as any[], authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Download delivery and token security policies saved.' });
  } catch (error) {
    next(error);
  }
};
