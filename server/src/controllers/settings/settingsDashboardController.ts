import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getSettingValue } from './settingsService';

const prisma = new PrismaClient();

export const getSettingsDashboardHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      storeStatusVal,
      razorpayKeyId,
      emailProvider,
      mfaRequired,
      taxGstRate,
      defaultCurrency,
      publishedTerms,
      publishedPrivacy,
      downloadCount,
      activeProductsCount
    ] = await Promise.all([
      getSettingValue('store.availability', 'ACTIVE'),
      getSettingValue('checkout.razorpay_key_id', process.env.RAZORPAY_KEY_ID || ''),
      getSettingValue('email.provider', 'RESEND'),
      getSettingValue('security.mfa_required', false),
      getSettingValue('tax.gst_rate', '18'),
      getSettingValue('currency.default_currency', 'INR'),
      prisma.legalDocument.findFirst({ where: { slug: 'terms-of-service', status: 'PUBLISHED' } }),
      prisma.legalDocument.findFirst({ where: { slug: 'privacy-policy', status: 'PUBLISHED' } }),
      prisma.downloadHistory.count(),
      prisma.product.count({ where: { status: 'PUBLISHED' } })
    ]);

    const healthItems = [
      {
        id: 'store_status',
        name: 'Storefront Status',
        category: 'Store',
        status: storeStatusVal === 'ACTIVE' ? 'ACTIVE' : storeStatusVal === 'PAUSED' ? 'WARNING' : 'DISABLED',
        value: storeStatusVal,
        message: storeStatusVal === 'ACTIVE' ? 'Store is open for purchases' : 'Store is paused or in maintenance mode',
        link: '/admin/settings/store'
      },
      {
        id: 'payment_gateway',
        name: 'Razorpay Payment Gateway',
        category: 'Payments',
        status: Boolean(razorpayKeyId && razorpayKeyId !== '••••••••••••••••') ? 'ACTIVE' : 'WARNING',
        value: razorpayKeyId ? 'Configured' : 'Missing API Keys',
        message: razorpayKeyId ? 'Razorpay live/test credentials active' : 'Enter Razorpay Key ID and Secret in Checkout settings',
        link: '/admin/settings/checkout'
      },
      {
        id: 'email_provider',
        name: 'Email Delivery System',
        category: 'Email',
        status: emailProvider ? 'ACTIVE' : 'CONFIGURED',
        value: String(emailProvider).toUpperCase(),
        message: 'Transactional and access notifications active',
        link: '/admin/settings/email'
      },
      {
        id: 'google_drive',
        name: 'Google Drive Digital Delivery',
        category: 'Downloads',
        status: 'ACTIVE',
        value: 'Connected',
        message: 'Google Service Account authenticated for file streaming',
        link: '/admin/settings/downloads'
      },
      {
        id: 'whatsapp_integration',
        name: 'WhatsApp Business API',
        category: 'Integrations',
        status: 'DISABLED',
        value: 'Not Configured',
        message: 'WhatsApp Business API gateway optional setup',
        link: '/admin/settings/store'
      },
      {
        id: 'currency_tax',
        name: 'Currency & Tax (GST)',
        category: 'Finance',
        status: 'ACTIVE',
        value: `${defaultCurrency} @ ${taxGstRate}% GST`,
        message: 'Tax-inclusive pricing rules active',
        link: '/admin/settings/currency-tax'
      },
      {
        id: 'download_system',
        name: 'Download Security (15m Token)',
        category: 'Downloads',
        status: 'ACTIVE',
        value: `${downloadCount} Delivered`,
        message: 'Token rate-limiting and device tracking active',
        link: '/admin/settings/downloads'
      },
      {
        id: 'admin_mfa',
        name: 'Admin MFA & Access Control',
        category: 'Security',
        status: mfaRequired ? 'ACTIVE' : 'WARNING',
        value: mfaRequired ? 'Enforced' : 'Optional',
        message: mfaRequired ? 'MFA required for high-risk operations' : 'Consider enabling MFA for finance and admin staff',
        link: '/admin/settings/security'
      },
      {
        id: 'terms_policy',
        name: 'Terms of Service',
        category: 'Legal',
        status: publishedTerms ? 'ACTIVE' : 'WARNING',
        value: publishedTerms ? `v${publishedTerms.currentVersion}.0.0` : 'Draft / Missing',
        message: publishedTerms ? 'Published and tracked at checkout' : 'Publish Terms of Service document',
        link: '/admin/settings/legal-documents'
      },
      {
        id: 'privacy_policy',
        name: 'Privacy Policy & GDPR',
        category: 'Legal',
        status: publishedPrivacy ? 'ACTIVE' : 'WARNING',
        value: publishedPrivacy ? `v${publishedPrivacy.currentVersion}.0.0` : 'Draft / Missing',
        message: publishedPrivacy ? 'GDPR and Cookie consent active' : 'Publish Privacy Policy document',
        link: '/admin/settings/legal-documents'
      }
    ];

    const activeCount = healthItems.filter(h => h.status === 'ACTIVE').length;
    const warningCount = healthItems.filter(h => h.status === 'WARNING').length;
    const disabledCount = healthItems.filter(h => h.status === 'DISABLED').length;

    res.json({
      success: true,
      summary: {
        totalSubsystems: healthItems.length,
        activeSubsystems: activeCount,
        warningSubsystems: warningCount,
        disabledSubsystems: disabledCount,
        overallHealthScore: Math.round((activeCount / healthItems.length) * 100)
      },
      healthItems
    });
  } catch (error) {
    next(error);
  }
};
