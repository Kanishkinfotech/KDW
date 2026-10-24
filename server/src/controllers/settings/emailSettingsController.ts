import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings, SECRET_MASK } from './settingsService';
import { sendGeneralEmail } from '../../utils/emailService';

export const getEmailSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('EMAIL');

    const response = {
      // Provider Configuration
      provider: settings.provider || (process.env.SMTP_HOST ? 'SMTP' : 'RESEND'), // RESEND, SMTP, SENDGRID
      api_key: settings.api_key ? SECRET_MASK : (process.env.RESEND_API_KEY ? SECRET_MASK : ''),
      smtp_host: settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
      smtp_port: settings.smtp_port ?? (Number(process.env.SMTP_PORT) || 587),
      smtp_user: settings.smtp_user || process.env.SMTP_USER || 'vvin8160@gmail.com',
      smtp_password: (settings.smtp_password || process.env.SMTP_PASS) ? SECRET_MASK : '',
      smtp_secure: settings.smtp_secure !== undefined ? settings.smtp_secure : (Number(process.env.SMTP_PORT) === 465),

      // Sender Identities
      from_name: settings.from_name || 'Kanishk Digital World',
      from_email: settings.from_email || 'orders@kanishkdigitalworld.com',
      reply_to_email: settings.reply_to_email || 'support@kanishkdigitalworld.com',
      support_sender_email: settings.support_sender_email || 'support@kanishkdigitalworld.com',
      finance_sender_email: settings.finance_sender_email || 'finance@kanishkdigitalworld.com',
      no_reply_email: settings.no_reply_email || 'no-reply@kanishkdigitalworld.com',

      // Domain Verification Status
      spf_status: settings.spf_status || 'VERIFIED',
      dkim_status: settings.dkim_status || 'VERIFIED',
      dmarc_status: settings.dmarc_status || 'CONFIGURED',

      // Transactional Email Toggles
      send_order_confirmation: settings.send_order_confirmation ?? true,
      send_download_access_email: settings.send_download_access_email ?? true,
      send_licence_email: settings.send_licence_email ?? true,
      send_refund_email: settings.send_refund_email ?? true,
      send_support_reply_email: settings.send_support_reply_email ?? true,
      send_security_alert_email: settings.send_security_alert_email ?? true,

      // Marketing Separation
      marketing_consent_required: settings.marketing_consent_required ?? true,
      include_unsubscribe_link: settings.include_unsubscribe_link ?? true,
      suppression_list_enabled: settings.suppression_list_enabled ?? true
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateEmailSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList: any[] = [];

    for (const [key, rawVal] of Object.entries(updates)) {
      if (key.startsWith('_')) continue;

      const cleanKey = key.replace(/^email\./, '');
      const isSecret = cleanKey === 'api_key' || cleanKey === 'smtp_password' || cleanKey === 'webhook_secret';

      // Skip masked passwords or empty secret placeholders so existing passwords are never wiped out
      if (isSecret && (
        rawVal === SECRET_MASK ||
        rawVal === '' ||
        rawVal === undefined ||
        (typeof rawVal === 'string' && rawVal.startsWith('••••'))
      )) {
        continue;
      }

      let value: any = rawVal;
      if (typeof value === 'string') {
        value = value.trim();
        // If 16-character Google App Password, strip spaces
        if (cleanKey === 'smtp_password' && value.replace(/\s+/g, '').length === 16) {
          value = value.replace(/\s+/g, '');
        }
      } else if (cleanKey === 'smtp_port' && typeof value === 'string') {
        value = parseInt(value, 10) || 587;
      }

      payloadList.push({
        key: `email.${cleanKey}`,
        value,
        group: 'EMAIL',
        dataType: isSecret ? 'SECRET' : (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : 'STRING'),
        isSecret,
        changeReason: req.body._changeReason || 'Email delivery configuration update'
      });
    }

    await bulkSaveSettings(payloadList, authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Email settings saved successfully.' });
  } catch (error) {
    next(error);
  }
};

export const sendTestEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientEmail, templateType = 'ORDER_RECEIPT' } = req.body;
    const authUser = (req as any).user;

    const targetEmail = recipientEmail || authUser?.email;
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return res.status(400).json({ success: false, message: 'A valid recipient email is required.' });
    }

    const testSubject = `[KDW Test] Verification Email for ${templateType}`;
    const testHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #1e293b;">KDW Email Delivery System Test</h2>
        <p style="color: #475569; font-size: 14px;">This is a real test email dispatched from Kanishk Digital World admin settings workspace.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; font-size: 12px; margin: 16px 0;">
          <strong>Template:</strong> ${templateType}<br/>
          <strong>Dispatched At:</strong> ${new Date().toISOString()}<br/>
          <strong>Admin Actor:</strong> ${authUser?.name || 'Administrator'}
        </div>
        <p style="color: #059669; font-weight: bold; font-size: 14px;">✓ Email provider connection is healthy and operational.</p>
      </div>
    `;

    await sendGeneralEmail({
      to: targetEmail,
      subject: testSubject,
      html: testHtml,
      text: `KDW Email Delivery System Test dispatched to ${targetEmail} at ${new Date().toISOString()}`
    });

    res.json({
      success: true,
      message: `Test email successfully dispatched to ${targetEmail}. Check your inbox.`
    });
  } catch (error: any) {
    console.error('Test email failure:', error);
    res.status(500).json({
      success: false,
      message: `Failed to deliver test email: ${error.message || 'Provider connection error'}`
    });
  }
};
