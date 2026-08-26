import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { bulkSaveSettings } from '../controllers/settings/settingsService';

const prisma = new PrismaClient();

async function seedSettingsSystem() {
  console.log('--- SEEDING COMPREHENSIVE KDW SETTINGS & LEGAL SYSTEM ---');

  // 1. Initial System Settings definitions across all 9 groups
  const initialSettings = [
    // GENERAL GROUP
    { key: 'general.store_name', value: 'Kanishk Digital World', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.legal_business_name', value: 'Kanishk Digital World Private Limited', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.store_description', value: 'Premium digital assets, n8n workflows, architecture templates, and design engineering tools.', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.primary_website_url', value: 'https://kanishkdigitalworld.com', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.support_email', value: 'support@kanishkdigitalworld.com', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.no_reply_email', value: 'no-reply@kanishkdigitalworld.com', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.business_address', value: 'KDW Innovation Hub, Outer Ring Road, Bangalore, Karnataka, India', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.business_country', value: 'India', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.business_state', value: 'Karnataka', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.business_city', value: 'Bangalore', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.business_postal_code', value: '560001', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.gst_number', value: '29AAAAA0000A1Z5', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.pan_number', value: 'AAAAA0000A', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.invoice_prefix', value: 'INV-KDW-', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.contact_phone', value: '+91 98765 43210', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.whatsapp_number', value: '+91 98765 43210', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.finance_email', value: 'finance@kanishkdigitalworld.com', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.privacy_email', value: 'privacy@kanishkdigitalworld.com', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.marketing_email', value: 'marketing@kanishkdigitalworld.com', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.business_hours', value: 'Mon–Fri, 9:00 AM – 6:00 PM IST', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.default_timezone', value: 'Asia/Kolkata', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.default_language', value: 'en', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.date_format', value: 'DD MMM YYYY', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.time_format', value: '24-hour', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.number_format', value: 'INDIAN_LAKHS', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.logo_light_url', value: '/logo.svg', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.logo_dark_url', value: '/logo-dark.svg', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.favicon_url', value: '/favicon.ico', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.primary_brand_color', value: '#2563EB', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.secondary_brand_color', value: '#4F46E5', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.default_product_status', value: 'PUBLISHED', group: 'GENERAL', dataType: 'STRING' },
    { key: 'general.default_support_priority', value: 'MEDIUM', group: 'GENERAL', dataType: 'STRING' },

    // STORE GROUP
    { key: 'store.availability', value: 'ACTIVE', group: 'STORE', dataType: 'STRING' },
    { key: 'store.maintenance_message', value: 'Store is temporarily undergoing maintenance for new purchases. Existing customers can still access their library.', group: 'STORE', dataType: 'STRING' },
    { key: 'store.show_product_ratings', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.show_download_format', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.show_file_size', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.show_version', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.show_licence_summary', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.show_related_products', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.show_live_previews', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.search_enabled', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.search_typo_tolerance', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.search_synonyms_enabled', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.exclude_draft_products', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.allow_registration', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.require_email_verification', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.allow_guest_checkout', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.require_guest_email_verification', value: false, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.allow_guest_purchase_claim', value: true, group: 'STORE', dataType: 'BOOLEAN' },
    { key: 'store.allow_customer_reviews', value: true, group: 'STORE', dataType: 'BOOLEAN' },

    // CURRENCY GROUP
    { key: 'currency.default_currency', value: 'INR', group: 'CURRENCY', dataType: 'STRING' },
    { key: 'currency.currency_symbol', value: '₹', group: 'CURRENCY', dataType: 'STRING' },
    { key: 'currency.symbol_position', value: 'BEFORE', group: 'CURRENCY', dataType: 'STRING' },
    { key: 'currency.decimal_places', value: 2, group: 'CURRENCY', dataType: 'NUMBER' },
    { key: 'currency.thousands_separator', value: ',', group: 'CURRENCY', dataType: 'STRING' },
    { key: 'currency.decimal_separator', value: '.', group: 'CURRENCY', dataType: 'STRING' },
    { key: 'currency.multi_currency_enabled', value: false, group: 'CURRENCY', dataType: 'BOOLEAN' },

    // TAX GROUP
    { key: 'tax.tax_enabled', value: true, group: 'TAX', dataType: 'BOOLEAN' },
    { key: 'tax.tax_mode', value: 'INCLUSIVE', group: 'TAX', dataType: 'STRING' },
    { key: 'tax.gst_rate', value: 18, group: 'TAX', dataType: 'NUMBER' },
    { key: 'tax.default_tax_category', value: 'DIGITAL_SERVICES_18', group: 'TAX', dataType: 'STRING' },
    { key: 'tax.place_of_supply_rule', value: 'BILLING_STATE', group: 'TAX', dataType: 'STRING' },
    { key: 'tax.tax_registration_number', value: '29AAAAA0000A1Z5', group: 'TAX', dataType: 'STRING' },
    { key: 'tax.display_tax_breakdown_on_checkout', value: true, group: 'TAX', dataType: 'BOOLEAN' },
    { key: 'tax.invoice_tax_note', value: 'GST @ 18% inclusive on all digital software downloads & digital licenses.', group: 'TAX', dataType: 'STRING' },

    // CHECKOUT GROUP
    { key: 'checkout.checkout_mode', value: 'BOTH', group: 'CHECKOUT', dataType: 'STRING' },
    { key: 'checkout.require_customer_phone', value: false, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.require_billing_address', value: false, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.allow_gst_invoice_request', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.razorpay_environment', value: 'TEST', group: 'CHECKOUT', dataType: 'STRING' },
    { key: 'checkout.razorpay_key_id', value: 'rzp_test_KDWLive2026', group: 'CHECKOUT', dataType: 'STRING' },
    { key: 'checkout.razorpay_key_secret', value: 'secret_live_placeholder_9921', group: 'CHECKOUT', dataType: 'SECRET', isSecret: true },
    { key: 'checkout.razorpay_webhook_url', value: 'https://api.kanishkdigitalworld.com/api/payments/webhook', group: 'CHECKOUT', dataType: 'STRING' },
    { key: 'checkout.razorpay_webhook_secret', value: 'whsec_kdw_signature_live', group: 'CHECKOUT', dataType: 'SECRET', isSecret: true },
    { key: 'checkout.auto_capture_payments', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.payment_timeout_minutes', value: 15, group: 'CHECKOUT', dataType: 'NUMBER' },
    { key: 'checkout.allow_failed_payment_retry', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.retry_link_validity_hours', value: 24, group: 'CHECKOUT', dataType: 'NUMBER' },
    { key: 'checkout.max_retry_attempts', value: 3, group: 'CHECKOUT', dataType: 'NUMBER' },
    { key: 'checkout.send_payment_failure_email', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.require_terms_acceptance', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.require_refund_policy_acceptance', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },
    { key: 'checkout.require_privacy_acceptance', value: true, group: 'CHECKOUT', dataType: 'BOOLEAN' },

    // DOWNLOAD GROUP
    { key: 'download.default_download_limit', value: 5, group: 'DOWNLOAD', dataType: 'NUMBER' },
    { key: 'download.default_access_duration_days', value: 365, group: 'DOWNLOAD', dataType: 'NUMBER' },
    { key: 'download.require_login_for_download', value: true, group: 'DOWNLOAD', dataType: 'BOOLEAN' },
    { key: 'download.allow_guest_download_access', value: true, group: 'DOWNLOAD', dataType: 'BOOLEAN' },
    { key: 'download.token_lifetime_minutes', value: 15, group: 'DOWNLOAD', dataType: 'NUMBER' },
    { key: 'download.max_active_tokens_per_user', value: 3, group: 'DOWNLOAD', dataType: 'NUMBER' },
    { key: 'download.token_rate_limit_attempts', value: 10, group: 'DOWNLOAD', dataType: 'NUMBER' },
    { key: 'download.hash_tokens_in_database', value: true, group: 'DOWNLOAD', dataType: 'BOOLEAN' },
    { key: 'download.max_file_size_mb', value: 5120, group: 'DOWNLOAD', dataType: 'NUMBER' },
    { key: 'download.refund_access_revocation', value: 'REVOKE_IMMEDIATELY', group: 'DOWNLOAD', dataType: 'STRING' },
    { key: 'download.log_download_telemetry', value: true, group: 'DOWNLOAD', dataType: 'BOOLEAN' },

    // EMAIL GROUP
    { key: 'email.provider', value: 'RESEND', group: 'EMAIL', dataType: 'STRING' },
    { key: 'email.api_key', value: 're_live_key_sample_8899', group: 'EMAIL', dataType: 'SECRET', isSecret: true },
    { key: 'email.from_name', value: 'Kanishk Digital World', group: 'EMAIL', dataType: 'STRING' },
    { key: 'email.from_email', value: 'orders@kanishkdigitalworld.com', group: 'EMAIL', dataType: 'STRING' },
    { key: 'email.reply_to_email', value: 'support@kanishkdigitalworld.com', group: 'EMAIL', dataType: 'STRING' },
    { key: 'email.support_sender_email', value: 'support@kanishkdigitalworld.com', group: 'EMAIL', dataType: 'STRING' },
    { key: 'email.finance_sender_email', value: 'finance@kanishkdigitalworld.com', group: 'EMAIL', dataType: 'STRING' },
    { key: 'email.send_order_confirmation', value: true, group: 'EMAIL', dataType: 'BOOLEAN' },
    { key: 'email.send_download_access_email', value: true, group: 'EMAIL', dataType: 'BOOLEAN' },
    { key: 'email.send_licence_email', value: true, group: 'EMAIL', dataType: 'BOOLEAN' },
    { key: 'email.send_refund_email', value: true, group: 'EMAIL', dataType: 'BOOLEAN' },
    { key: 'email.send_support_reply_email', value: true, group: 'EMAIL', dataType: 'BOOLEAN' },

    // SECURITY GROUP
    { key: 'security.mfa_required', value: false, group: 'SECURITY', dataType: 'BOOLEAN' },
    { key: 'security.mfa_for_refund_approval', value: true, group: 'SECURITY', dataType: 'BOOLEAN' },
    { key: 'security.mfa_for_secret_rotation', value: true, group: 'SECURITY', dataType: 'BOOLEAN' },
    { key: 'security.mfa_for_data_export', value: true, group: 'SECURITY', dataType: 'BOOLEAN' },
    { key: 'security.password_min_length', value: 8, group: 'SECURITY', dataType: 'NUMBER' },
    { key: 'security.require_uppercase_and_numbers', value: true, group: 'SECURITY', dataType: 'BOOLEAN' },
    { key: 'security.max_failed_login_attempts', value: 5, group: 'SECURITY', dataType: 'NUMBER' },
    { key: 'security.lockout_duration_minutes', value: 15, group: 'SECURITY', dataType: 'NUMBER' },
    { key: 'security.admin_session_duration_hours', value: 24, group: 'SECURITY', dataType: 'NUMBER' },
    { key: 'security.admin_idle_timeout_minutes', value: 60, group: 'SECURITY', dataType: 'NUMBER' },
    { key: 'security.rate_limiting_enabled', value: true, group: 'SECURITY', dataType: 'BOOLEAN' },
    { key: 'security.enable_suspicious_login_alerts', value: true, group: 'SECURITY', dataType: 'BOOLEAN' },

    // PRIVACY GROUP
    { key: 'privacy.data_collection_enabled', value: true, group: 'PRIVACY', dataType: 'BOOLEAN' },
    { key: 'privacy.log_ip_addresses_for_downloads', value: true, group: 'PRIVACY', dataType: 'BOOLEAN' },
    { key: 'privacy.allow_customer_data_export', value: true, group: 'PRIVACY', dataType: 'BOOLEAN' },
    { key: 'privacy.allow_customer_account_deletion', value: true, group: 'PRIVACY', dataType: 'BOOLEAN' },
    { key: 'privacy.enable_cookie_banner', value: true, group: 'PRIVACY', dataType: 'BOOLEAN' },
    { key: 'privacy.retention_customer_profiles_days', value: 730, group: 'PRIVACY', dataType: 'NUMBER' },
    { key: 'privacy.retention_login_logs_days', value: 90, group: 'PRIVACY', dataType: 'NUMBER' },
    { key: 'privacy.retention_download_logs_days', value: 365, group: 'PRIVACY', dataType: 'NUMBER' },
    { key: 'privacy.retention_support_tickets_days', value: 730, group: 'PRIVACY', dataType: 'NUMBER' },
    { key: 'privacy.retention_audit_logs_days', value: 1825, group: 'PRIVACY', dataType: 'NUMBER' }
  ];

  await bulkSaveSettings(initialSettings as any, { name: 'System Initializer', role: 'SUPER_ADMIN' });
  console.log(`Seeded ${initialSettings.length} core system settings across 9 functional groups.`);

  // 2. Seed 8 Core Legal Documents
  const legalDocs = [
    {
      slug: 'terms-of-service',
      name: 'Terms of Service',
      category: 'LEGAL',
      title: 'Kanishk Digital World Terms of Service',
      summary: 'Master governing agreement covering digital product purchases, user accounts, and platform usage.',
      content: `# TERMS OF SERVICE

**Last Updated:** August 27, 2026  
**Effective Date:** August 27, 2026  

Welcome to **Kanishk Digital World** ("KDW", "we", "our", or "us"). By accessing our website, purchasing digital goods, downloading digital software bundles, or using our services, you agree to be bound by these Terms of Service.

## 1. Digital Products and Delivery
1.1 All items sold on KDW are digital assets delivered electronically via Google Drive and direct encrypted stream tokens.  
1.2 Upon confirmed payment, digital entitlements are granted to your account and download links remain active for the duration specified on the product page.

## 2. User Accounts and Security
2.1 You are responsible for safeguarding your login credentials.  
2.2 Sharing accounts, redistributing download tokens, or reselling unauthorized copies is strictly prohibited and results in immediate entitlement revocation without refund.

## 3. Pricing and Payments
3.1 All prices are displayed in Indian Rupees (INR) and include applicable Goods and Services Tax (GST) unless stated otherwise.  
3.2 Payments are processed securely through Razorpay. We do not store raw credit card numbers.

## 4. Contact and Inquiries
For legal inquiries, contact our compliance team at **legal@kanishkdigitalworld.com**.`
    },
    {
      slug: 'refund-policy',
      name: 'Refund & Cancellation Policy',
      category: 'POLICY',
      title: 'Digital Goods Refund and Reversal Policy',
      summary: 'Rules and eligibility criteria for digital product refunds and technical remediation.',
      content: `# REFUND & CANCELLATION POLICY

**Last Updated:** August 27, 2026  

At Kanishk Digital World, we stand behind the quality of our digital software, n8n templates, and engineering assets.

## 1. Digital Goods Eligibility
Because digital products are immediately accessible upon purchase:
1.1 **Pre-Download Cancellation:** If an order has been paid but zero downloads or licence key activations have occurred, you may request a 100% full refund within 7 calendar days.  
1.2 **Corrupted or Incompatible Files:** If a file is technically defective and our support team cannot provide a working fix or alternate link within 48 business hours, a full refund will be granted.  
1.3 **Duplicate Transactions:** In cases of duplicate payment charges on UPI or credit card, the excess transaction will be refunded immediately upon verification.

## 2. Refund Processing
Approved refunds are credited to the original payment source via Razorpay within 3–5 business days.`
    },
    {
      slug: 'digital-delivery-policy',
      name: 'Digital Delivery Policy',
      category: 'POLICY',
      title: 'Instant Electronic Delivery & Token Access Policy',
      summary: 'Details on automated fulfillment, Google Drive streaming, and token security.',
      content: `# DIGITAL DELIVERY POLICY

**Last Updated:** August 27, 2026  

## 1. Instant Automated Fulfillment
Upon successful payment capture via Razorpay, our backend digital fulfillment engine automatically:
- Creates your Digital Entitlement record.
- Dispatches an access email with temporary 15-minute secure download tokens.
- Unlocks the file inside your **Account Dashboard -> Orders**.

## 2. Token Security & Lifetime
Download tokens are cryptographically generated and expire after 15 minutes to prevent link piracy. You may generate fresh tokens directly in your account dashboard at any time during your entitlement duration.`
    },
    {
      slug: 'licence-policy',
      name: 'Licence & Usage Agreement',
      category: 'LEGAL',
      title: 'Software & Digital Asset Licensing Terms',
      summary: 'Defines Personal, Commercial, and Agency licence usage rights and activation limits.',
      content: `# LICENCE & USAGE AGREEMENT

**Last Updated:** August 27, 2026  

Every digital asset purchased on KDW is accompanied by a specific Licence Key and Grant of Rights.

## 1. Commercial Licence
- Permitted: Use in unlimited commercial projects and client deliverables.
- Permitted: Customization, modification, and integration into client websites.
- Prohibited: Resale of original source files, public redistributions, or uploading to open repositories.

## 2. Machine Activation Slots
Standard licence keys include 1–5 machine activation slots. If you migrate servers, you may request an activation slot reset via the KDW Support Center.`
    },
    {
      slug: 'privacy-policy',
      name: 'Privacy Policy',
      category: 'COMPLIANCE',
      title: 'KDW Privacy Policy & Data Protection Notice',
      summary: 'Transparency regarding personal data collection, cookies, and GDPR rights.',
      content: `# PRIVACY POLICY & DATA PROTECTION

**Last Updated:** August 27, 2026  

Kanishk Digital World respects your privacy and is committed to protecting your personal data in accordance with the Information Technology Act and GDPR principles.

## 1. Information We Collect
- Contact Information: Name, Email address, Phone number.
- Transactional Information: Order items, Payment transaction IDs, Billing state for GST compliance.
- Technical Telemetry: IP address, Browser user-agent for download security.

## 2. Customer Privacy Rights
You have the right to request an export of your personal data or request account deletion by submitting a verified request to **privacy@kanishkdigitalworld.com**.`
    },
    {
      slug: 'cookie-policy',
      name: 'Cookie Policy',
      category: 'COMPLIANCE',
      title: 'Cookie Notice & Consent Preferences',
      summary: 'Explanation of essential session cookies and optional analytics.',
      content: `# COOKIE POLICY

**Last Updated:** August 27, 2026  

We use essential session cookies to maintain your shopping cart, authentication state, and CSRF protection. Non-essential analytical cookies are only loaded after explicit customer consent.`
    },
    {
      slug: 'copyright-policy',
      name: 'Copyright & Intellectual Property',
      category: 'LEGAL',
      title: 'Intellectual Property and DMCA Notice',
      summary: 'Copyright ownership and infringement notice procedures.',
      content: `# COPYRIGHT & INTELLECTUAL PROPERTY

**Last Updated:** August 27, 2026  

All original software, graphics, video motion presets, and tutorials hosted on KDW are proprietary intellectual property of Kanishk Digital World. DMCA takedown requests should be directed to **legal@kanishkdigitalworld.com**.`
    },
    {
      slug: 'support-policy',
      name: 'Support & SLA Policy',
      category: 'POLICY',
      title: 'Customer Resolution & Support SLA Policy',
      summary: 'Response time commitments, business hours, and included support scope.',
      content: `# CUSTOMER SUPPORT & SLA POLICY

**Last Updated:** August 27, 2026  

## 1. Support Hours & Response Times
- Support Hours: Monday to Friday, 9:00 AM to 6:00 PM IST.
- Critical Issues (Download / Payment failure): First response within 30–120 minutes.
- General Inquiries: Within 24 business hours.`
    }
  ];

  for (const doc of legalDocs) {
    const existing = await prisma.legalDocument.findUnique({ where: { slug: doc.slug } });
    if (existing) {
      await prisma.legalDocument.delete({ where: { id: existing.id } });
    }

    const createdDoc = await prisma.legalDocument.create({
      data: {
        slug: doc.slug,
        name: doc.name,
        category: doc.category,
        currentVersion: 1,
        publishedVersion: 1,
        status: 'PUBLISHED',
        effectiveDate: new Date(),
        publishedAt: new Date()
      }
    });

    await prisma.legalDocumentVersion.create({
      data: {
        documentId: createdDoc.id,
        versionNumber: 1,
        title: doc.title,
        content: doc.content,
        summary: doc.summary,
        status: 'PUBLISHED',
        effectiveDate: new Date(),
        publishedAt: new Date()
      }
    });
  }

  console.log(`Seeded ${legalDocs.length} published v1.0.0 legal documents.`);

  // 3. Seed Data Retention Rules
  const retentionRules = [
    { entityType: 'CUSTOMER_PROFILE', retentionPeriodDays: 730, actionOnExpiry: 'ANONYMIZE' },
    { entityType: 'LOGIN_LOG', retentionPeriodDays: 90, actionOnExpiry: 'DELETE' },
    { entityType: 'DOWNLOAD_LOG', retentionPeriodDays: 365, actionOnExpiry: 'ARCHIVE' },
    { entityType: 'SUPPORT_TICKET', retentionPeriodDays: 730, actionOnExpiry: 'ARCHIVE' },
    { entityType: 'PAYMENT_RECORD', retentionPeriodDays: 2555, actionOnExpiry: 'ARCHIVE' }, // 7 years for GST audit
    { entityType: 'AUDIT_LOG', retentionPeriodDays: 1825, actionOnExpiry: 'ARCHIVE' }
  ];

  for (const rule of retentionRules) {
    await prisma.dataRetentionRule.upsert({
      where: { entityType: rule.entityType },
      update: rule,
      create: rule
    });
  }

  console.log(`Seeded ${retentionRules.length} data retention compliance rules.`);
}

seedSettingsSystem()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
