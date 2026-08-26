import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings, saveSetting } from './settingsService';

export const getGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('GENERAL');

    // Default fallbacks
    const response = {
      // Store Identity
      store_name: settings.store_name || 'Kanishk Digital World',
      legal_business_name: settings.legal_business_name || 'Kanishk Digital World Private Limited',
      store_description: settings.store_description || 'Premium digital assets, n8n workflows, and design engineering tools.',
      primary_website_url: settings.primary_website_url || 'https://kanishkdigitalworld.com',
      support_email: settings.support_email || 'support@kanishkdigitalworld.com',
      no_reply_email: settings.no_reply_email || 'no-reply@kanishkdigitalworld.com',

      // Business & GST Details
      business_address: settings.business_address || 'KDW HQ, Bangalore, Karnataka, India',
      business_country: settings.business_country || 'India',
      business_state: settings.business_state || 'Karnataka',
      business_city: settings.business_city || 'Bangalore',
      business_postal_code: settings.business_postal_code || '560001',
      gst_number: settings.gst_number || '29AAAAA0000A1Z5',
      pan_number: settings.pan_number || 'AAAAA0000A',
      invoice_prefix: settings.invoice_prefix || 'INV-KDW-',

      // Contact Details
      contact_phone: settings.contact_phone || '+91 98765 43210',
      whatsapp_number: settings.whatsapp_number || '+91 98765 43210',
      finance_email: settings.finance_email || 'finance@kanishkdigitalworld.com',
      privacy_email: settings.privacy_email || 'privacy@kanishkdigitalworld.com',
      marketing_email: settings.marketing_email || 'marketing@kanishkdigitalworld.com',
      business_hours: settings.business_hours || 'Mon–Fri, 9:00 AM – 6:00 PM IST',

      // Localization
      default_timezone: settings.default_timezone || 'Asia/Kolkata',
      default_language: settings.default_language || 'en',
      date_format: settings.date_format || 'DD MMM YYYY',
      time_format: settings.time_format || '24-hour',
      number_format: settings.number_format || 'INDIAN_LAKHS',

      // Branding
      logo_light_url: settings.logo_light_url || '/logo.svg',
      logo_dark_url: settings.logo_dark_url || '/logo-dark.svg',
      favicon_url: settings.favicon_url || '/favicon.ico',
      primary_brand_color: settings.primary_brand_color || '#2563EB',
      secondary_brand_color: settings.secondary_brand_color || '#4F46E5',

      // Defaults
      default_product_status: settings.default_product_status || 'PUBLISHED',
      default_support_priority: settings.default_support_priority || 'MEDIUM',
      default_access_duration_days: settings.default_access_duration_days || 365
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    // Validate email addresses if updated
    if (updates.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.support_email)) {
      return res.status(400).json({ success: false, message: 'Invalid support email format' });
    }
    if (updates.primary_website_url && !/^https?:\/\//i.test(updates.primary_website_url)) {
      return res.status(400).json({ success: false, message: 'Primary website URL must start with http:// or https://' });
    }

    const payloadList = Object.entries(updates).map(([key, value]) => ({
      key: key.startsWith('general.') ? key : `general.${key}`,
      value,
      group: 'GENERAL',
      dataType: (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING') as any,
      changeReason: req.body._changeReason || 'General settings update'
    }));

    await bulkSaveSettings(payloadList, authUser || { name: 'Admin' });

    res.json({ success: true, message: 'General settings updated and audited successfully.' });
  } catch (error) {
    next(error);
  }
};
