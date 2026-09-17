import nodemailer from 'nodemailer';
import { EmailProviderFactory, EmailSenderIntent } from '../services/emailProviderFactory';
import { EmailPolicyService, EmailTriggerType } from '../services/emailPolicyService';

interface DeliveryItem {
  name: string;
  driveUrl: string;
  bundleName?: string;
  licenceKey?: string;
}

interface DigitalDeliveryEmailProps {
  recipientEmail: string;
  customerName: string;
  orderNumber: string;
  bundleTitle?: string;
  licenceKey?: string;
  items: DeliveryItem[];
}

/**
 * Standard KDW Multi-Product Bundle & Asset Delivery Email with Policy & Provider Factory
 */
export const sendDigitalProductDeliveryEmail = async (
  props: DigitalDeliveryEmailProps
): Promise<{ success: boolean; messageId?: string; error?: any; skipped?: boolean }> => {
  try {
    const { recipientEmail, customerName, orderNumber, bundleTitle, licenceKey, items } = props;

    // 1. Enforce Email Policy Toggles
    const policy = await EmailPolicyService.isEmailAllowed('DOWNLOAD_ACCESS');
    if (!policy.allowed) {
      console.log(`[EmailService] Digital delivery email skipped: ${policy.reason}`);
      return { success: true, skipped: true };
    }

    // 2. Resolve Active Email Provider and Sender Identity
    const providerConfig = await EmailProviderFactory.getProvider('ORDERS');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const primaryLicenceKey = licenceKey || (items.find(i => i.licenceKey)?.licenceKey) || `KDW-LIC-${orderNumber.replace(/[^A-Z0-9]/g, '')}`;
    const verificationUrl = `${frontendUrl}/verify-license?key=${encodeURIComponent(primaryLicenceKey)}`;

    let itemsHtml = '';
    let itemsText = '';

    items.forEach((item, index) => {
      itemsHtml += `
        <div style="margin-bottom: 16px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 800; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px;">
              Item ${index + 1} of ${items.length}
            </div>
            ${item.bundleName ? `<span style="font-size: 11px; color: #64748b; font-weight: 600;">Part of ${item.bundleName}</span>` : ''}
          </div>
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${item.name}</h3>
          <a href="${item.driveUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
            Open &amp; Download Assets (Google Drive) &rarr;
          </a>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
            🔒 Secure token link &amp; time limit active. (Opens automatically once license key is verified)
          </div>
        </div>
      `;

      itemsText += `${index + 1}. ${item.name}\n   Access Link (requires license verification): ${item.driveUrl}\n\n`;
    });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your KDW Assets & License Key</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #334155; line-height: 1.6; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border-radius: 12px; font-weight: 900; font-size: 20px;">
            K
          </div>
          <h1 style="color: #0f172a; font-size: 22px; margin: 8px 0 0 0; font-weight: 800;">Kanishk Digital World</h1>
          <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0 0 0;">Digital Store & Assets</p>
        </div>

        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Hi ${customerName},</p>
        
        <p style="font-size: 14px; color: #475569; margin-top: 0;">
          Thank you for claiming/purchasing your digital assets from <strong>Kanishk Digital World</strong>.
        </p>

        <div style="padding: 14px 18px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; color: #065f46; font-size: 13px; font-weight: 600; margin: 16px 0;">
          ✓ Entitlement Granted (Order #${orderNumber}) — Your ${bundleTitle ? `"${bundleTitle}" bundle` : 'asset'} is ready to download.
        </div>

        <!-- Prominent License Key Box -->
        <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
            Your Official Commercial License Key
          </span>
          <div style="font-size: 20px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 900; color: #166534; background: #dcfce7; padding: 10px 16px; border-radius: 8px; display: inline-block; letter-spacing: 1.5px; margin: 8px 0; border: 1px solid #86efac;">
            ${primaryLicenceKey}
          </div>
          <p style="font-size: 12px; color: #374151; margin: 8px 0 0 0;">
            Copy this license key and verify it using the button below to immediately unlock and download your files.
          </p>
        </div>

        <!-- Verification Call to Action Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verificationUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
            Verify License & Unlock Download &rarr;
          </a>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
            Link: <a href="${verificationUrl}" style="color: #0284c7; text-decoration: underline;">${verificationUrl}</a>
          </p>
        </div>

        <!-- 3-Step Verification Guide -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 13px; color: #334155;">
          <strong style="color: #0f172a; display: block; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            How to Access Your Deliverables:
          </strong>
          <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Click <strong>"Verify License & Unlock Download"</strong> above or visit <a href="${frontendUrl}/verify-license" style="color: #0284c7; font-weight: 600;">${frontendUrl}/verify-license</a>.</li>
            <li>Your License Key (<code style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px; font-family: monospace;">${primaryLicenceKey}</code>) will be verified and activated on the portal.</li>
            <li>Once verified, return to this email and click the <strong>"Open &amp; Download Assets (Google Drive)"</strong> buttons below to access your files.</li>
            <li><strong>Note:</strong> In accordance with KDW security policy, product assets can only be opened through verified links delivered to your email with link token and time limit enforcement.</li>
          </ol>
        </div>

        <h2 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Direct Deliverables:
        </h2>
        
        ${itemsHtml}

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          All purchases and active licenses are permanently stored in your <a href="${frontendUrl}/dashboard" style="color: #0284c7; font-weight: bold; text-decoration: underline;">KDW Account Dashboard</a> under the <strong>Licenses</strong> and <strong>Downloads</strong> tabs.
        </p>

        <p style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 24px;">
          Thank you for choosing Kanishk Digital World.
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 16px 0;" />
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">
          Need assistance? Reply directly to this email or visit our <a href="${frontendUrl}/support" style="color: #0284c7;">Help Center</a>.
        </p>
      </body>
      </html>
    `;

    const textBody = `
Hi ${customerName},

Thank you for claiming/purchasing your digital assets from Kanishk Digital World.

Your entitlement has been successfully verified (Order #${orderNumber}).

YOUR COMMERCIAL LICENSE KEY:
${primaryLicenceKey}

VERIFY & UNLOCK DOWNLOAD LINK:
${verificationUrl}

HOW TO ACCESS:
1. Open the link above or visit ${frontendUrl}/verify-license
2. Enter or confirm your License Key: ${primaryLicenceKey}
3. Click "Verify & Access Assets" to open your Google Drive files and download.

${bundleTitle ? `Bundle: ${bundleTitle}\n` : ''}Products included: ${items.length}

Direct Downloads:
${itemsText}

Thank you for choosing Kanishk Digital World.
    `.trim();

    const fromHeader = `"${providerConfig.fromName}" <${providerConfig.fromEmail}>`;

    const info = await providerConfig.transporter.sendMail({
      from: fromHeader,
      to: recipientEmail,
      replyTo: providerConfig.replyTo,
      subject: `Your KDW License Key & Assets Ready (Order #${orderNumber})`,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[EmailService] Digital delivery email with license key sent to ${recipientEmail} via ${providerConfig.provider} (MsgID: ${info.messageId})`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending digital delivery email:', error);
    return { success: false, error };
  }
};

/**
 * Generic Email Dispatcher supporting intent routing and trigger policy evaluation
 */
export const sendGeneralEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  intent?: EmailSenderIntent;
  triggerType?: EmailTriggerType;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: any; skipped?: boolean }> => {
  try {
    const { to, subject, html, text, intent = 'DEFAULT', triggerType, fromName, fromEmail, replyTo } = options;

    if (triggerType) {
      const policy = await EmailPolicyService.isEmailAllowed(triggerType);
      if (!policy.allowed) {
        console.log(`[EmailService] Email skipped: ${policy.reason}`);
        return { success: true, skipped: true };
      }
    }

    const providerConfig = await EmailProviderFactory.getProvider(intent);
    const finalFromName = fromName || providerConfig.fromName;
    const finalFromEmail = fromEmail || providerConfig.fromEmail;
    const finalReplyTo = replyTo || (fromEmail ? fromEmail : providerConfig.replyTo);
    const fromHeader = `"${finalFromName}" <${finalFromEmail}>`;

    const info = await providerConfig.transporter.sendMail({
      from: fromHeader,
      to,
      replyTo: finalReplyTo,
      subject,
      text: text || '',
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending general email:', error);
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

/**
 * Send an attractive, high-converting abandoned cart recovery email
 */
export const sendAbandonedCartRecoveryEmail = async (options: {
  recipientEmail: string;
  customerName?: string;
  checkoutId: string;
  cartItems: any[];
  totalAmount: number;
  discountCode?: string;
}): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    const {
      recipientEmail,
      customerName = 'Valued Creator',
      checkoutId,
      cartItems = [],
      totalAmount = 0,
      discountCode = 'RECOVER10'
    } = options;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const recoveryUrl = `${frontendUrl}/checkout?recoveryId=${checkoutId}&coupon=${discountCode}`;

    const itemsHtml = cartItems.map((item, idx) => {
      const title = item.title || item.name || 'Premium Digital Asset';
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const isBundle = item.type === 'bundle' || !!item.bundleId;

      return `
        <div style="padding: 16px; margin-bottom: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #6366f1); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: bold;">
              ${isBundle ? '📦' : '⚡'}
            </div>
            <div>
              <span style="font-size: 14px; font-weight: 700; color: #0f172a; display: block; line-height: 1.3;">
                ${title}
              </span>
              <span style="font-size: 11px; color: #64748b; margin-top: 3px; display: inline-block;">
                ${isBundle ? 'Full Product Bundle' : 'Digital Asset'} • Lifetime License • Qty: ${quantity}
              </span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 16px; font-weight: 800; color: #0284c7; font-family: monospace;">
              ₹${price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      `;
    }).join('');

    const itemsText = cartItems.map(item => `- ${item.title || item.name}: ₹${item.price || 0} (Qty: ${item.quantity || 1})`).join('\n');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Reserved Digital Assets Are Waiting</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Brand Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #0284c7;">
            <div style="display: inline-block; padding: 4px 12px; background: rgba(2, 132, 199, 0.2); border: 1px solid rgba(2, 132, 199, 0.4); border-radius: 9999px; color: #38bdf8; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
              Exclusive Cart Reservation
            </div>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.5px;">
              KANISHK DIGITAL WORLD
            </h1>
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">
              Premium Digital Assets &amp; Business Systems
            </p>
          </div>

          <div style="padding: 32px 28px;">
            <!-- Friendly Headline -->
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; display: block; margin-bottom: 8px;">⏳</span>
              <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
                Did life get in the way? We held your cart!
              </h2>
              <p style="font-size: 14px; color: #64748b; margin: 0; max-width: 440px; margin: 0 auto;">
                Hi <strong>${customerName}</strong>, your selected digital assets are reserved and ready for instant activation.
              </p>
            </div>

            <!-- Product Cards Container -->
            <div style="background-color: #f1f5f9; border-radius: 14px; padding: 18px; margin: 24px 0;">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 12px;">
                Your Reserved Items:
              </span>
              ${itemsHtml}

              <!-- Total Row -->
              <div style="padding-top: 14px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 700; color: #475569;">Cart Total:</span>
                <span style="font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace;">₹${Number(totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <!-- Special Courtesy Voucher Box -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 2px dashed #0284c7; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0;">
              <span style="font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                🎁 Special Courtesy Incentive For You
              </span>
              <p style="font-size: 13px; color: #334155; margin: 0 0 10px 0;">
                Take an extra <strong>10% OFF</strong> when you complete your checkout today!
              </p>
              <div style="font-size: 20px; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-weight: 900; color: #0284c7; background: #ffffff; padding: 8px 18px; border-radius: 8px; display: inline-block; letter-spacing: 2px; border: 1px solid #bae6fd; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);">
                ${discountCode}
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">
                Click below — voucher is automatically applied at checkout!
              </p>
            </div>

            <!-- Primary High-Conversion CTA -->
            <div style="text-align: center; margin: 32px 0 24px 0;">
              <a href="${recoveryUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35); text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease;">
                Complete Order &amp; Unlock Instant Access &rarr;
              </a>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">
                Direct link: <a href="${recoveryUrl}" style="color: #0284c7; text-decoration: underline;">${recoveryUrl}</a>
              </p>
            </div>

            <!-- 4 Trust Reassurance Badges -->
            <div style="margin: 32px 0 16px 0; padding-top: 24px; border-top: 1px solid #f1f5f9;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 10px 8px; vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">⚡ Instant Cloud Delivery</div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">Immediate Google Drive links and direct downloads upon checkout.</div>
                  </td>
                  <td style="width: 50%; padding: 10px 8px; vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">🛡️ Commercial License</div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">Official license key included for personal and client projects.</div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 10px 8px; vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">🔒 100% Secure Checkout</div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">Encrypted 256-bit gateway powered by Razorpay (UPI &amp; Cards).</div>
                  </td>
                  <td style="width: 50%; padding: 10px 8px; vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">💬 Dedicated Support</div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">24/7 assistance if you have questions before downloading.</div>
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; font-style: italic;">
              Cart reservation and voucher ${discountCode} are valid for 24 hours.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0 0 6px 0;">
              Questions? Reply directly to this email or visit our <a href="${frontendUrl}/support" style="color: #0284c7; text-decoration: none;">Support Desk</a>.
            </p>
            <p style="margin: 0;">
              &copy; ${new Date().getFullYear()} Kanishk Digital World. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Hi ${customerName},

We noticed you started checkout on Kanishk Digital World, but didn't get a chance to complete your order.

Your reserved digital assets are held for you:
${itemsText}

Cart Total: ₹${totalAmount}

🎁 SPECIAL COURTESY VOUCHER:
Use coupon code ${discountCode} to take an extra 10% OFF!

COMPLETE YOUR ORDER HERE:
${recoveryUrl}

What you get immediately upon checkout:
- Instant Google Drive cloud files and master downloads
- Official Commercial License Key
- 100% secure payment via Razorpay (UPI, Cards, NetBanking)
- Dedicated customer support

Thank you for choosing Kanishk Digital World.
    `.trim();

    const providerConfig = await EmailProviderFactory.getProvider('ORDERS');
    const fromHeader = `"${providerConfig.fromName}" <${providerConfig.fromEmail}>`;

    const info = await providerConfig.transporter.sendMail({
      from: fromHeader,
      to: recipientEmail,
      replyTo: providerConfig.replyTo,
      subject: `Your reserved digital assets are waiting (Special 10% Voucher Inside 🎁)`,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[EmailService] Abandoned checkout recovery email sent to ${recipientEmail} (MsgID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending abandoned cart recovery email:', error);
    return { success: false, error };
  }
};

