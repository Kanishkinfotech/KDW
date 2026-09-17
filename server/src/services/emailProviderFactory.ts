import nodemailer from 'nodemailer';
import { getSettingsByGroup } from '../controllers/settings/settingsService';

export type EmailSenderIntent = 'ORDERS' | 'SUPPORT' | 'FINANCE' | 'MARKETING' | 'SECURITY' | 'NO_REPLY' | 'DEFAULT';

export interface ResolvedEmailConfig {
  provider: 'SMTP' | 'RESEND' | 'SENDGRID';
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  transporter: nodemailer.Transporter;
}

export class EmailProviderFactory {
  /**
   * Resolves the active email transporter and sender identity based on DB settings and intent
   */
  public static async getProvider(intent: EmailSenderIntent = 'DEFAULT'): Promise<ResolvedEmailConfig> {
    // Read dynamic settings from database (unmasking secrets)
    const settings = await getSettingsByGroup('EMAIL', true);

    const host = settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(settings.smtp_port) || Number(process.env.SMTP_PORT) || 587;
    const user = settings.smtp_user || process.env.SMTP_USER || 'vvin8160@gmail.com';
    const pass = settings.smtp_password || process.env.SMTP_PASS || 'toymcthjdsbbhwqo';
    const secure = settings.smtp_secure !== undefined ? Boolean(settings.smtp_secure) : (port === 465);

    const providerType = (settings.provider || (host ? 'SMTP' : 'RESEND')).toUpperCase();
    const fromName = settings.from_name || 'Kanishk Digital World';
    const defaultFromEmail = settings.from_email || process.env.SMTP_FROM_EMAIL || user || 'orders@kanishkdigitalworld.com';
    const replyTo = settings.reply_to_email || settings.support_sender_email || undefined;

    // Resolve Sender Email based on Intent
    let selectedSenderEmail = defaultFromEmail;
    switch (intent) {
      case 'SUPPORT':
        selectedSenderEmail = settings.support_sender_email || settings.reply_to_email || defaultFromEmail;
        break;
      case 'FINANCE':
        selectedSenderEmail = settings.finance_sender_email || defaultFromEmail;
        break;
      case 'MARKETING':
        selectedSenderEmail = settings.marketing_sender_email || defaultFromEmail;
        break;
      case 'SECURITY':
        selectedSenderEmail = settings.security_sender_email || settings.no_reply_email || defaultFromEmail;
        break;
      case 'NO_REPLY':
        selectedSenderEmail = settings.no_reply_email || defaultFromEmail;
        break;
      case 'ORDERS':
      case 'DEFAULT':
      default:
        selectedSenderEmail = defaultFromEmail;
        break;
    }

    // When using Gmail SMTP, align sender email with Gmail account user if needed
    if (host.includes('gmail.com') && user) {
      selectedSenderEmail = user;
    }

    let effectiveProvider = providerType;
    if (effectiveProvider === 'RESEND') {
      const apiKey = settings.api_key || process.env.RESEND_API_KEY;
      if (!apiKey || apiKey.startsWith('re_live_key_sample')) {
        console.warn('[EmailProviderFactory] Resend API key is missing or is sample placeholder. Automatically falling back to configured SMTP gateway.');
        effectiveProvider = 'SMTP';
      }
    }

    let transporter: nodemailer.Transporter;

    if (effectiveProvider === 'RESEND') {
      const apiKey = settings.api_key || process.env.RESEND_API_KEY;
      transporter = nodemailer.createTransport({
        host: settings.smtp_host || 'smtp.resend.com',
        port: Number(settings.smtp_port) || 465,
        secure: settings.smtp_secure ?? true,
        auth: {
          user: 'resend',
          pass: apiKey || settings.smtp_password || ''
        }
      });
    } else if (effectiveProvider === 'SENDGRID') {
      const apiKey = settings.api_key || process.env.SENDGRID_API_KEY;
      transporter = nodemailer.createTransport({
        host: settings.smtp_host || 'smtp.sendgrid.net',
        port: Number(settings.smtp_port) || 587,
        secure: settings.smtp_secure ?? false,
        auth: {
          user: 'apikey',
          pass: apiKey || settings.smtp_password || ''
        }
      });
    } else {
      // Standard SMTP Provider (Gmail / Custom SMTP)
      if (host && user && pass) {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass }
        });
      } else {
        // Fallback for development/testing if no host configured
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }
    }

    return {
      provider: effectiveProvider as any,
      fromName,
      fromEmail: selectedSenderEmail,
      replyTo,
      transporter
    };
  }

  /**
   * Tests the connection of a specific provider configuration
   */
  public static async testConnection(providerConfig?: {
    provider?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    smtp_secure?: boolean;
    api_key?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      let transporter: nodemailer.Transporter;

      if (providerConfig && providerConfig.smtp_host) {
        transporter = nodemailer.createTransport({
          host: providerConfig.smtp_host,
          port: Number(providerConfig.smtp_port) || 587,
          secure: providerConfig.smtp_secure ?? (Number(providerConfig.smtp_port) === 465),
          auth: {
            user: providerConfig.smtp_user,
            pass: providerConfig.smtp_password
          }
        });
      } else {
        const resolved = await this.getProvider();
        transporter = resolved.transporter;
      }

      await transporter.verify();
      return { success: true, message: 'Email provider connection verified successfully.' };
    } catch (err: any) {
      return { success: false, message: `Email connection test failed: ${err.message}` };
    }
  }
}
