import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings } from './settingsService';

export const getCurrencyTaxSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [currencySettings, taxSettings] = await Promise.all([
      getSettingsByGroup('CURRENCY'),
      getSettingsByGroup('TAX')
    ]);

    const response = {
      // Currency Configuration
      default_currency: currencySettings.default_currency || 'INR',
      currency_symbol: currencySettings.currency_symbol || '₹',
      symbol_position: currencySettings.symbol_position || 'BEFORE', // BEFORE, AFTER
      decimal_places: currencySettings.decimal_places ?? 2,
      thousands_separator: currencySettings.thousands_separator || ',',
      decimal_separator: currencySettings.decimal_separator || '.',
      
      // Multi-currency
      multi_currency_enabled: currencySettings.multi_currency_enabled ?? false,
      supported_currencies: currencySettings.supported_currencies || ['INR', 'USD', 'EUR'],
      auto_fetch_exchange_rates: currencySettings.auto_fetch_exchange_rates ?? false,

      // Tax & GST Configuration
      tax_enabled: taxSettings.tax_enabled ?? true,
      tax_mode: taxSettings.tax_mode || 'INCLUSIVE', // INCLUSIVE, EXCLUSIVE
      gst_rate: taxSettings.gst_rate ?? 18,
      default_tax_category: taxSettings.default_tax_category || 'DIGITAL_SERVICES_18',
      place_of_supply_rule: taxSettings.place_of_supply_rule || 'BILLING_STATE',
      tax_registration_number: taxSettings.tax_registration_number || '29AAAAA0000A1Z5',
      display_tax_breakdown_on_checkout: taxSettings.display_tax_breakdown_on_checkout ?? true,
      invoice_tax_note: taxSettings.invoice_tax_note || 'GST @ 18% inclusive on all digital software downloads & digital licenses.'
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateCurrencyTaxSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList = Object.entries(updates).map(([key, value]) => {
      const isTax = key.startsWith('tax_') || key.startsWith('gst_') || key.includes('tax') || key.includes('invoice');
      const group = isTax ? 'TAX' : 'CURRENCY';
      const prefix = isTax ? 'tax.' : 'currency.';
      const cleanKey = key.replace(/^(tax|currency)\./, '');

      return {
        key: `${prefix}${cleanKey}`,
        value,
        group,
        dataType: (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'object' ? 'JSON' : 'STRING') as any,
        changeReason: req.body._changeReason || 'Currency & Tax configuration update'
      };
    });

    await bulkSaveSettings(payloadList, authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Currency and Tax settings updated and snapshot policies preserved.' });
  } catch (error) {
    next(error);
  }
};
