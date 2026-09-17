import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { getSettingsByGroup } from './settings/settingsService';

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const [settings, generalSettings, storeSettings, currencySettings, taxSettings, checkoutSettings, securitySettings, privacySettings] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: 'DEFAULT' } }),
      getSettingsByGroup('GENERAL'),
      getSettingsByGroup('STORE'),
      getSettingsByGroup('CURRENCY'),
      getSettingsByGroup('TAX'),
      getSettingsByGroup('CHECKOUT'),
      getSettingsByGroup('SECURITY'),
      getSettingsByGroup('PRIVACY')
    ]);
    
    let extra: any = {};
    try {
      if (settings?.socialLinks) extra = JSON.parse(settings.socialLinks);
    } catch (e) {}

    const storeAvailability = storeSettings.availability || 'ACTIVE';
    const maintenanceMessage = storeSettings.maintenance_message || 'Store is temporarily undergoing maintenance for new purchases. Existing customers can still access their library.';

    const publicSettings = {
      // General & Store Identity
      store_name: generalSettings.store_name || (settings as any)?.companyName || 'Kanishk Digital World',
      store_description: generalSettings.store_description || 'Premium digital assets, n8n workflows, architecture templates, and design engineering tools.',
      legal_business_name: generalSettings.legal_business_name || (settings as any)?.companyName || 'Kanishk Digital World Private Limited',
      primary_website_url: generalSettings.primary_website_url || 'https://kanishkdigitalworld.com',
      support_email: generalSettings.support_email || settings?.supportEmail || 'support@kanishkdigitalworld.com',
      support_email_description: extra.support_email_description || 'Our primary support channel.',
      support_phone: generalSettings.contact_phone || settings?.phone || '+91 98765 43210',
      whatsapp_number: generalSettings.whatsapp_number || '+91 98765 43210',
      support_phone_description: extra.support_phone_description || 'Call us during business hours for urgent assistance.',
      business_hours: generalSettings.business_hours || extra.business_hours || 'Mon–Fri, 9:00 AM – 6:00 PM IST',
      business_hours_description: extra.business_hours_description || 'Our support team is available during these hours.',
      office_location: generalSettings.business_address || extra.office_location || 'Bangalore, India',
      business_address: generalSettings.business_address || 'Bangalore, India',
      office_location_description: extra.office_location_description || 'Our primary office and support operations location.',
      business_city: generalSettings.business_city || 'Bangalore',
      business_state: generalSettings.business_state || 'Karnataka',
      business_country: generalSettings.business_country || 'India',
      gst_number: generalSettings.gst_number || '29AAAAA0000A1Z5',
      pan_number: generalSettings.pan_number || 'AAAAA0000A',
      invoice_prefix: generalSettings.invoice_prefix || 'INV-KDW-',
      faq_link: extra.faq_link || '/faq',
      kb_link: extra.kb_link || '/docs',

      // Store Availability & Feature Toggles
      store_status: storeAvailability,
      availability: storeAvailability,
      is_maintenance: storeAvailability === 'MAINTENANCE' || storeAvailability === 'PAUSED',
      maintenance_message: maintenanceMessage,
      expected_reopening_at: storeSettings.expected_reopening_at || null,
      show_product_ratings: storeSettings.show_product_ratings ?? true,
      show_download_format: storeSettings.show_download_format ?? true,
      show_file_size: storeSettings.show_file_size ?? true,
      show_version: storeSettings.show_version ?? true,
      show_licence_summary: storeSettings.show_licence_summary ?? true,
      show_related_products: storeSettings.show_related_products ?? true,
      show_live_previews: storeSettings.show_live_previews ?? true,
      allow_registration: storeSettings.allow_registration ?? true,
      allow_guest_checkout: storeSettings.allow_guest_checkout ?? true,

      // Currency & Formatting
      currency: currencySettings.default_currency || 'INR',
      currency_symbol: currencySettings.currency_symbol || '₹',
      symbol_position: currencySettings.symbol_position || 'BEFORE',
      decimal_places: Number(currencySettings.decimal_places ?? 2),
      thousands_separator: currencySettings.thousands_separator || ',',
      decimal_separator: currencySettings.decimal_separator || '.',
      multi_currency_enabled: Boolean(currencySettings.multi_currency_enabled),

      // Tax & GST
      tax_enabled: taxSettings.tax_enabled ?? true,
      tax_mode: taxSettings.tax_mode || 'INCLUSIVE',
      gst_rate: Number(taxSettings.gst_rate ?? 18),
      default_tax_category: taxSettings.default_tax_category || 'DIGITAL_SERVICES_18',
      display_tax_breakdown_on_checkout: taxSettings.display_tax_breakdown_on_checkout ?? true,
      invoice_tax_note: taxSettings.invoice_tax_note || 'GST @ 18% inclusive on all digital software downloads & digital licenses.',

      // Checkout Mode & Requirements
      checkout_mode: checkoutSettings.checkout_mode || 'BOTH',
      require_terms_acceptance: checkoutSettings.require_terms_acceptance ?? true,
      require_refund_policy_acceptance: checkoutSettings.require_refund_policy_acceptance ?? true,
      require_privacy_acceptance: checkoutSettings.require_privacy_acceptance ?? true,
      require_customer_phone: checkoutSettings.require_customer_phone ?? false,
      require_billing_address: checkoutSettings.require_billing_address ?? false,
      razorpay_key_id: checkoutSettings.razorpay_key_id || process.env.RAZORPAY_KEY_ID || '',

      // Security / Password Rules for Customer Sign-up
      min_password_length: Number(securitySettings.password_min_length ?? 8),
      require_uppercase_and_numbers: securitySettings.require_uppercase_and_numbers ?? true,
      require_special_characters: securitySettings.require_special_characters ?? true,

      // Privacy & Cookie Preferences
      enable_cookie_banner: privacySettings.enable_cookie_banner ?? true,
      cookie_banner_position: privacySettings.cookie_banner_position || 'BOTTOM_RIGHT',
      require_explicit_cookie_consent: privacySettings.require_explicit_cookie_consent ?? false,
      allow_customer_data_export: privacySettings.allow_customer_data_export ?? true,
      allow_customer_account_deletion: privacySettings.allow_customer_account_deletion ?? true
    };

    res.status(200).json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};

