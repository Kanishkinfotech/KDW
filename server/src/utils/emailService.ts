import nodemailer from 'nodemailer';

interface DeliveryItem {
  name: string;
  driveUrl: string;
  bundleName?: string;
}

interface DigitalDeliveryEmailProps {
  recipientEmail: string;
  customerName: string;
  orderNumber: string;
  bundleTitle?: string;
  items: DeliveryItem[];
}

const getTransporter = async () => {
  let transporter;
  
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  return transporter;
};

/**
 * Standard KDW Multi-Product Bundle & Asset Delivery Email (Clause 24 & 53)
 */
export const sendDigitalProductDeliveryEmail = async (
  props: DigitalDeliveryEmailProps
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    const { recipientEmail, customerName, orderNumber, bundleTitle, items } = props;
    const transporter = await getTransporter();

    let itemsHtml = '';
    let itemsText = '';

    items.forEach((item, index) => {
      itemsHtml += `
        <div style="margin-bottom: 16px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px;">
              Item ${index + 1} of ${items.length}
            </div>
            ${item.bundleName ? `<span style="font-size: 11px; color: #64748b; font-weight: 600;">Part of ${item.bundleName}</span>` : ''}
          </div>
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${item.name}</h3>
          <a href="${item.driveUrl}" target="_blank" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
            Access ${item.name}
          </a>
        </div>
      `;

      itemsText += `${index + 1}. ${item.name}\n   Access Link: ${item.driveUrl}\n\n`;
    });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your KDW Bundle Is Ready</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #334155; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border-radius: 12px; font-weight: 900; font-size: 20px;">
            K
          </div>
          <h1 style="color: #0f172a; font-size: 20px; margin: 8px 0 0 0; font-weight: 800;">Kanishk Digital World</h1>
          <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0 0 0;">Digital Store & Assets</p>
        </div>

        <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Hi ${customerName},</p>
        
        <p style="font-size: 14px; color: #475569; margin-top: 0;">
          Thank you for your purchase from <strong>Kanishk Digital World</strong>.
        </p>

        <div style="padding: 14px 18px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; color: #065f46; font-size: 13px; font-weight: 600; margin: 16px 0;">
          ✓ Payment Verified (Order #${orderNumber}) — Your ${bundleTitle ? `"${bundleTitle}" bundle` : 'purchase'} is ready.
        </div>

        <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #334155;">
          ${bundleTitle ? `<strong>Bundle:</strong> ${bundleTitle}<br />` : ''}
          <strong>Products included:</strong> ${items.length} Digital ${items.length === 1 ? 'Asset' : 'Assets'}
        </div>

        <h2 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 20px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Your Download Links:
        </h2>
        
        ${itemsHtml}

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          Please keep this email for future access. All purchases are permanently available in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/account/orders" style="color: #7c3aed; font-weight: bold; text-decoration: underline;">KDW Account Library</a>.
        </p>

        <p style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 24px;">
          Thank you for choosing Kanishk Digital World.
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 16px 0;" />
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">
          Need assistance? Contact KDW Support or reply directly to this email.
        </p>
      </body>
      </html>
    `;

    const textBody = `
Hi ${customerName},

Thank you for your purchase from Kanishk Digital World.

Your payment has been successfully verified (Order #${orderNumber}).

${bundleTitle ? `Bundle: ${bundleTitle}\n` : ''}Products included: ${items.length}

Your Downloads:

${itemsText}
Please keep this email for future access.

Thank you for choosing Kanishk Digital World.
    `.trim();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KDW Digital Store" <deliveries@kwd-store.com>',
      to: recipientEmail,
      subject: 'Your KDW Bundle Is Ready',
      text: textBody,
      html: htmlBody,
    });

    console.log(`[EmailService] Digital delivery email sent to ${recipientEmail} (MsgID: ${info.messageId})`);
    if (!process.env.SMTP_HOST) {
      console.log('[EmailService] Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending digital delivery email:', error);
    return { success: false, error };
  }
};

// Generic Email Sender for Marketing & Campaigns
export const sendGeneralEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KDW Digital World" <support@kwd-store.com>',
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    return { success: false, error };
  }
};

// Backwards compatibility alias
export const sendProductDeliveryEmail = async (toEmail: string, orderNumber: string, products: any[]) => {
  return sendDigitalProductDeliveryEmail({
    recipientEmail: toEmail,
    customerName: 'Valued Customer',
    orderNumber,
    items: products.map(p => ({ name: p.name, driveUrl: p.url }))
  });
};
