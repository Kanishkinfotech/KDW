import { getSettingsByGroup } from '../controllers/settings/settingsService';

export type EmailTriggerType = 
  | 'ORDER_CONFIRMATION'
  | 'DOWNLOAD_ACCESS'
  | 'LICENCE_ISSUANCE'
  | 'REFUND_NOTIFICATION'
  | 'SUPPORT_REPLY'
  | 'SECURITY_ALERT'
  | 'MARKETING_CAMPAIGN';

export class EmailPolicyService {
  /**
   * Evaluates if a given email trigger type is permitted by Admin Settings
   */
  public static async isEmailAllowed(trigger: EmailTriggerType): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const settings = await getSettingsByGroup('EMAIL');

      switch (trigger) {
        case 'ORDER_CONFIRMATION':
          if (settings.send_order_confirmation === false) {
            return { allowed: false, reason: 'Order confirmation emails disabled in Admin Settings' };
          }
          break;
        case 'DOWNLOAD_ACCESS':
          if (settings.send_download_access_email === false) {
            return { allowed: false, reason: 'Download access delivery emails disabled in Admin Settings' };
          }
          break;
        case 'LICENCE_ISSUANCE':
          if (settings.send_licence_email === false) {
            return { allowed: false, reason: 'Licence issuance emails disabled in Admin Settings' };
          }
          break;
        case 'REFUND_NOTIFICATION':
          if (settings.send_refund_email === false) {
            return { allowed: false, reason: 'Refund notification emails disabled in Admin Settings' };
          }
          break;
        case 'SUPPORT_REPLY':
          if (settings.send_support_reply_email === false) {
            return { allowed: false, reason: 'Support ticket reply emails disabled in Admin Settings' };
          }
          break;
        case 'SECURITY_ALERT':
          if (settings.send_security_alert_email === false) {
            return { allowed: false, reason: 'Security alert emails disabled in Admin Settings' };
          }
          break;
        case 'MARKETING_CAMPAIGN':
          break;
      }

      return { allowed: true };
    } catch (err: any) {
      console.warn('[EmailPolicyService] Error reading email policies, defaulting to allowed:', err.message);
      return { allowed: true };
    }
  }
}
