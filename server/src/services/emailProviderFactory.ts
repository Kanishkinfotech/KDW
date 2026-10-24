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

    const host = (settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = Number(settings.smtp_port) || Number(process.env.SMTP_PORT) || 587;
    const user = (settings.smtp_user || process.env.SMTP_USER || '').trim();
    let pass = (settings.smtp_password || process.env.SMTP_PASS || '').trim();

    // If Gmail and app password contains spaces (e.g. "abcd efgh ijkl mnop"), strip spaces
    if (host.includes('gmail') && pass.replace(/\s+/g, '').length === 16) {
      pass = pass.replace(/\s+/g, '');
    }

    // Determine SSL/TLS mode:
    // Port 465 requires direct SSL (secure: true)
    // Port 587, 25, 2525 require STARTTLS (secure: false in nodemailer)
    // Other custom ports follow user setting
    let secure = false;
    if (port === 465) {
      secure = true;
    } else if (port === 587 || port === 25 || port === 2525) {
      secure = false;
    } else if (settings.smtp_secure !== undefined) {
      secure = settings.smtp_secure === true || settings.smtp_secure === 'true';
    }

    const providerType = (settings.provider || (host ? 'SMTP' : 'RESEND')).toUpperCase();
    const fromName = (settings.from_name || 'Kanishk Digital World').trim();
    const defaultFromEmail = (settings.from_email || process.env.SMTP_FROM_EMAIL || user || 'orders@kanishkdigitalworld.com').trim();
    const replyTo = (settings.reply_to_email || settings.support_sender_email || undefined)?.trim();

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
    selectedSenderEmail = selectedSenderEmail.trim();

    // When using Gmail SMTP, align sender email with the authenticated Gmail user to prevent SPF/DMARC rejection
    let effectiveReplyTo = replyTo;
    if (host.includes('gmail.com') && user && user.includes('@')) {
      selectedSenderEmail = user;
      if (!effectiveReplyTo || !effectiveReplyTo.endsWith('@gmail.com')) {
        effectiveReplyTo = user;
      }
    }

    let effectiveProvider = providerType;
    if (effectiveProvider === 'RESEND') {
      const apiKey = settings.api_key || process.env.RESEND_API_KEY;
      if (!apiKey || apiKey.startsWith('re_live_key_sample')) {
        console.warn('[EmailProviderFactory] Resend API key is missing or sample placeholder. Automatically using configured SMTP gateway.');
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
        },
        tls: { rejectUnauthorized: false }
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
        },
        tls: { rejectUnauthorized: false }
      });
    } else {
      // Standard SMTP Provider (Gmail / Custom Self-Hosted / Third-Party SMTP)
      if (host && user && pass) {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          tls: {
            rejectUnauthorized: false
          }
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
      replyTo: effectiveReplyTo,
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
        const host = (providerConfig.smtp_host || '').trim();
        const port = Number(providerConfig.smtp_port) || 587;
        const user = (providerConfig.smtp_user || '').trim();
        let pass = (providerConfig.smtp_password || '').trim();

        // If password is blank or mask, load existing stored password from DB
        if (!pass || pass === '__SET__' || pass.startsWith('••••')) {
          const dbSettings = await getSettingsByGroup('EMAIL', true);
          pass = (dbSettings.smtp_password || process.env.SMTP_PASS || '').trim();
        }

        if (host.includes('gmail') && pass.replace(/\s+/g, '').length === 16) {
          pass = pass.replace(/\s+/g, '');
        }

        let secure = false;
        if (port === 465) {
          secure = true;
        } else if (port === 587 || port === 25 || port === 2525) {
          secure = false;
        } else if (providerConfig.smtp_secure !== undefined) {
          secure = providerConfig.smtp_secure === true || String(providerConfig.smtp_secure) === 'true';
        }

        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: user && pass ? { user, pass } : undefined,
          tls: { rejectUnauthorized: false }
        });
      } else {
        const resolved = await this.getProvider();
        transporter = resolved.transporter;
      }

      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully! Email gateway is fully operational.' };
    } catch (err: any) {
      return { success: false, message: `Email connection test failed: ${err.message}` };
    }
  }
}
