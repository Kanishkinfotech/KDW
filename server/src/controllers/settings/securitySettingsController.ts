import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings } from './settingsService';

export const getSecuritySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('SECURITY');

    const response = {
      // MFA & High-Risk Verification
      mfa_required: settings.mfa_required ?? false,
      mfa_for_refund_approval: settings.mfa_for_refund_approval ?? true,
      mfa_for_secret_rotation: settings.mfa_for_secret_rotation ?? true,
      mfa_for_data_export: settings.mfa_for_data_export ?? true,
      mfa_for_licence_revocation: settings.mfa_for_licence_revocation ?? true,

      // Password Policy
      password_min_length: settings.password_min_length ?? 8,
      require_uppercase_and_numbers: settings.require_uppercase_and_numbers ?? true,
      require_special_characters: settings.require_special_characters ?? true,
      max_failed_login_attempts: settings.max_failed_login_attempts ?? 5,
      lockout_duration_minutes: settings.lockout_duration_minutes ?? 15,

      // Session & Cookie Policies
      admin_session_duration_hours: settings.admin_session_duration_hours ?? 24,
      admin_idle_timeout_minutes: settings.admin_idle_timeout_minutes ?? 60,
      enforce_single_session: settings.enforce_single_session ?? false,
      use_secure_http_only_cookies: settings.use_secure_http_only_cookies ?? true,
      cookie_same_site_policy: settings.cookie_same_site_policy || 'Lax',

      // Login Protection & Throttling
      rate_limiting_enabled: settings.rate_limiting_enabled ?? true,
      rate_limit_max_requests_per_minute: settings.rate_limit_max_requests_per_minute ?? 100,
      enable_suspicious_login_alerts: settings.enable_suspicious_login_alerts ?? true,
      notify_on_new_device_login: settings.notify_on_new_device_login ?? true,

      // RBAC Permissions List
      supported_permissions: [
        'product.publish', 'product.delete',
        'order.read', 'order.refund',
        'payment.read', 'payment.review',
        'download.reset', 'download.override',
        'license.issue', 'license.revoke',
        'customer.export', 'customer.delete',
        'settings.update', 'integration.update',
        'audit_log.read'
      ]
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateSecuritySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList = Object.entries(updates).map(([key, value]) => {
      if (key.startsWith('_')) return null;
      const cleanKey = key.replace(/^security\./, '');
      return {
        key: `security.${cleanKey}`,
        value,
        group: 'SECURITY',
        dataType: (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING') as any,
        changeReason: req.body._changeReason || 'Security policy & access control update'
      };
    }).filter(Boolean);

    await bulkSaveSettings(payloadList as any[], authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Security policies and access control settings saved.' });
  } catch (error) {
    next(error);
  }
};
