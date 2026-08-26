import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings } from './settingsService';

export const getStoreSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('STORE');

    const response = {
      // Store Availability
      availability: settings.availability || 'ACTIVE', // ACTIVE, PAUSED, MAINTENANCE
      maintenance_message: settings.maintenance_message || 'Store is temporarily undergoing maintenance for new purchases. Existing customers can still access their library.',
      expected_reopening_at: settings.expected_reopening_at || null,

      // Storefront Feature Toggles
      show_product_ratings: settings.show_product_ratings ?? true,
      show_download_format: settings.show_download_format ?? true,
      show_file_size: settings.show_file_size ?? true,
      show_version: settings.show_version ?? true,
      show_licence_summary: settings.show_licence_summary ?? true,
      show_related_products: settings.show_related_products ?? true,
      show_live_previews: settings.show_live_previews ?? true,

      // Search & Discovery
      search_enabled: settings.search_enabled ?? true,
      search_typo_tolerance: settings.search_typo_tolerance ?? true,
      search_synonyms_enabled: settings.search_synonyms_enabled ?? true,
      exclude_draft_products: settings.exclude_draft_products ?? true,

      // Customer Accounts & Guest Checkout
      allow_registration: settings.allow_registration ?? true,
      require_email_verification: settings.require_email_verification ?? true,
      allow_guest_checkout: settings.allow_guest_checkout ?? true,
      require_guest_email_verification: settings.require_guest_email_verification ?? false,
      allow_guest_purchase_claim: settings.allow_guest_purchase_claim ?? true,
      allow_customer_reviews: settings.allow_customer_reviews ?? true
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateStoreSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList = Object.entries(updates).map(([key, value]) => ({
      key: key.startsWith('store.') ? key : `store.${key}`,
      value,
      group: 'STORE',
      dataType: (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING') as any,
      changeReason: req.body._changeReason || 'Store configuration update'
    }));

    await bulkSaveSettings(payloadList, authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Store settings saved successfully.' });
  } catch (error) {
    next(error);
  }
};
