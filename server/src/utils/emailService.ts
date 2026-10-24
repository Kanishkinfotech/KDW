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
  isVerified?: boolean;
}

/**
 * Standard KDW Multi-Product Bundle & Asset Delivery Email with Policy & Provider Factory
 */
export const sendDigitalProductDeliveryEmail = async (
  props: DigitalDeliveryEmailProps
): Promise<{ success: boolean; messageId?: string; error?: any; skipped?: boolean }> => {
  try {
    const { recipientEmail, customerName, orderNumber, bundleTitle, licenceKey, items, isVerified = false } = props;

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
      if (isVerified) {
        itemsHtml += `
          <div style="margin-bottom: 16px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
                Deliverable ${index + 1} of ${items.length}
              </div>
              <span style="font-size: 11px; color: #059669; font-weight: 700; background: #d1fae5; padding: 2px 8px; border-radius: 6px;">
                🔓 Unlocked &amp; Ready
              </span>
            </div>
            <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px; font-weight: 700;">${item.name}</h3>
            <div style="margin: 12px 0;">
              <a href="${item.driveUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                Open &amp; Download Assets (Google Drive) &rarr;
              </a>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
              Personal license verified &amp; active. You have full permission for personal use.
            </div>
          </div>
        `;
        itemsText += `${index + 1}. ${item.name} (UNLOCKED)\n   Google Drive Download Link: ${item.driveUrl}\n\n`;
      } else {
        itemsHtml += `
          <div style="margin-bottom: 16px; padding: 18px; border: 1px solid #fed7aa; border-radius: 12px; background-color: #fffaf5;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-size: 11px; font-weight: 800; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px;">
                Deliverable ${index + 1} of ${items.length}
              </div>
              <span style="font-size: 11px; color: #c2410c; font-weight: 700; background: #ffedd5; padding: 2px 8px; border-radius: 6px;">
                🔒 Locked — Verification Required
              </span>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px; font-weight: 700;">${item.name}</h3>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 14px 0;">
              To protect license authenticity, download access remains locked until your Personal License Key is verified.
            </p>
            <div style="margin: 12px 0;">
              <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                🔒 Verify License Key to Unlock Assets &rarr;
              </a>
            </div>
            <div style="font-size: 12px; color: #9a3412; margin-top: 6px;">
              Click above to verify your key and unlock your Google Drive access.
            </div>
          </div>
        `;
        itemsText += `${index + 1}. ${item.name} [LOCKED — Verification Required]\n   Verify your key to unlock: ${verificationUrl}\n\n`;
      }
    });

    const subject = isVerified
      ? `Order #${orderNumber} Deliverables Unlocked — Your Google Drive Download Links`
      : `Order #${orderNumber} Confirmed — Your Personal License Key (Action Required: Verify to Unlock Downloads)`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #334155; line-height: 1.6; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
          <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #7c3aed; color: white; border-radius: 12px; font-weight: 900; font-size: 20px;">
            K
          </div>
          <h1 style="color: #0f172a; font-size: 22px; margin: 8px 0 0 0; font-weight: 800;">Kanishk Digital World</h1>
          <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0 0 0;">
            ${isVerified ? 'Official Deliverables Unlocked & Personal License Active' : 'Official Order Delivery & Personal License Key'}
          </p>
        </div>

        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Hello ${customerName},</p>
        
        <p style="font-size: 14px; color: #475569; margin-top: 0;">
          ${isVerified
            ? `Thank you for choosing <strong>Kanishk Digital World</strong>. Your Personal License for order #${orderNumber} is verified and your Google Drive deliverables are now unlocked below.`
            : `Thank you for choosing <strong>Kanishk Digital World</strong>. Your order #${orderNumber} is confirmed! Your official Personal License Key is provided below. <strong>Action Required:</strong> Please verify your license key to unlock your digital assets.`
          }
        </p>

        <!-- Official Personal License Key Box -->
        ${isVerified ? `
        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
            Your Official Personal License Key (Verified &amp; Active)
          </span>
          <div style="font-size: 18px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 800; color: #14532d; background: #dcfce7; padding: 10px 16px; border-radius: 8px; display: inline-block; letter-spacing: 1.5px; margin: 8px 0; border: 1px solid #bbf7d0;">
            ${primaryLicenceKey}
          </div>
          <div style="margin-top: 8px;">
            <span style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #bbf7d0;">
              ✅ Status: Active &amp; Verified Personal License
            </span>
          </div>
          <p style="font-size: 12px; color: #166534; margin: 8px 0 0 0;">
            Your license authorizes lifetime personal use. Keep this for your records.
          </p>
        </div>
        ` : `
        <div style="background-color: #faf5ff; border: 2px dashed #9333ea; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 800; color: #7e22ce; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
            Your Official Personal License Key (Verification Required)
          </span>
          <div style="font-size: 18px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 800; color: #581c87; background: #f3e8ff; padding: 10px 16px; border-radius: 8px; display: inline-block; letter-spacing: 1.5px; margin: 8px 0; border: 1px solid #d8b4fe;">
            ${primaryLicenceKey}
          </div>
          <div style="margin-top: 8px;">
            <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #fde68a;">
              🔒 Status: Verification Required to Unlock Downloads
            </span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin: 8px 0 0 0;">
            Your downloads are locked. You must verify this key to activate access to your deliverables.
          </p>
        </div>
        `}

        <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 24px 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Your Digital Deliverables:
        </h2>
        
        ${itemsHtml}

        <!-- Verification Portal Section -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
            ${isVerified 
              ? 'You can verify your key anytime on our customer license portal or access all past downloads in your dashboard.' 
              : 'Enter your Personal License Key on our license verification portal to unlock your Google Drive download link.'
            }
          </p>
          <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; font-weight: bold; text-decoration: underline;">
            Open License Verification Portal &rarr;
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">This is an automated transactional order confirmation for Order #${orderNumber}.</p>
          <p style="margin: 0;">© ${new Date().getFullYear()} Kanishk Digital World. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Hello ${customerName},

Thank you for choosing Kanishk Digital World. Your order #${orderNumber} is confirmed.

YOUR OFFICIAL PERSONAL LICENSE KEY:
${primaryLicenceKey}
(${isVerified ? 'Status: ACTIVE & VERIFIED' : 'Status: LOCKED — VERIFICATION REQUIRED'})

YOUR DIGITAL ASSETS & DOWNLOAD STATUS:
${itemsText}

LICENSE VERIFICATION PORTAL:
${verificationUrl}

${isVerified ? 'Your deliverables are unlocked. Thank you for choosing Kanishk Digital World.' : 'Please verify your license key above to unlock your Google Drive downloads.'}
    `.trim();

    const fromHeader = `"${providerConfig.fromName}" <${providerConfig.fromEmail}>`;

    const info = await providerConfig.transporter.sendMail({
      from: fromHeader,
      to: recipientEmail,
      replyTo: providerConfig.replyTo,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        'X-Entity-Ref-ID': `order-${orderNumber}`
      }
    });

    console.log(`[EmailService] Digital delivery email (${isVerified ? 'UNLOCKED' : 'LOCKED_VERIFICATION_REQUIRED'}) sent to ${recipientEmail} via ${providerConfig.provider} (MsgID: ${info.messageId})`);

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

