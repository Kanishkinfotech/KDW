import nodemailer from 'nodemailer';

interface EmailTemplateProps {
  orderNumber: string;
  products: { name: string; url: string }[];
  dashboardUrl: string;
}

const getTransporter = async () => {
  let transporter;
  
  if (process.env.SMTP_HOST) {
    // Production / Configured SMTP
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
    // Development fallback using Ethereal
    console.log('No SMTP configured. Using Ethereal Mail for development testing.');
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

const generateHtmlTemplate = (props: EmailTemplateProps) => {
  const { orderNumber, products } = props;
  
  let productsHtml = '';
  for (const product of products) {
    productsHtml += `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">${product.name}</h3>
        <a href="${product.url}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Your Purchase</a>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-w-width: 600px; margin: 0 auto; color: #334155;">
      <h1 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">KDW</h1>
      
      <h2>Payment successful!</h2>
      <p>Thank you for your purchase.</p>
      
      <p><strong>Order:</strong> #${orderNumber}</p>
      
      <h3>Your purchased products:</h3>
      ${productsHtml}
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      
      <p style="font-size: 14px; color: #64748b;">
        Need help? <br />
        Contact KDW Support.
      </p>
      
      <p style="font-size: 14px; color: #64748b;">
        Thank you,<br />
        KDW Team
      </p>
    </div>
  `;
};

const generateTextTemplate = (props: EmailTemplateProps) => {
  const { orderNumber, products } = props;
  
  let productsText = '';
  for (const product of products) {
    productsText += `${product.name}\n${product.url}\n\n`;
  }

  return `
KDW
--------------------------------

Payment successful!

Thank you for your purchase.

Order: #${orderNumber}

Your purchased products:

${productsText}
Need help?
Contact KDW Support.

Thank you,
KDW Team
  `.trim();
};

export const sendProductDeliveryEmail = async (
  toEmail: string,
  orderNumber: string,
  products: { name: string; url: string }[]
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    const transporter = await getTransporter();
    
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads`;
    
    const templateProps = { orderNumber, products, dashboardUrl };
    const htmlBody = generateHtmlTemplate(templateProps);
    const textBody = generateTextTemplate(templateProps);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KDW Store" <noreply@kwd-store.com>',
      to: toEmail,
      subject: `Your KDW purchase is ready — Order #${orderNumber}`,
      text: textBody,
      html: htmlBody,
    });

    console.log(`Delivery email sent for Order ${orderNumber}`);
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending delivery email:', error);
    return { success: false, error };
  }
};
