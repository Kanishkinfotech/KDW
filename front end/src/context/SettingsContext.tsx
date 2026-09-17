import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { setGlobalCurrencyConfig } from '../utils/currency';

export interface PublicSettings {
  store_name: string;
  store_description: string;
  legal_business_name: string;
  primary_website_url: string;
  support_email: string;
  support_phone: string;
  whatsapp_number: string;
  business_hours: string;
  office_location: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_country: string;
  gst_number: string;
  pan_number: string;
  invoice_prefix: string;
  faq_link: string;
  kb_link: string;
  store_status: string;
  availability: string;
  is_maintenance: boolean;
  maintenance_message: string;
  currency: string;
  currency_symbol: string;
  symbol_position: string;
  decimal_places: number;
  tax_enabled: boolean;
  tax_mode: string;
  gst_rate: number;
  invoice_tax_note: string;
  checkout_mode: string;
  require_terms_acceptance: boolean;
  require_refund_policy_acceptance: boolean;
  require_privacy_acceptance: boolean;
  require_customer_phone: boolean;
  require_billing_address: boolean;
  razorpay_key_id: string;
  min_password_length: number;
  enable_cookie_banner: boolean;
  cookie_banner_position: string;
  show_product_ratings?: boolean;
  show_download_format?: boolean;
  show_file_size?: boolean;
  show_version?: boolean;
  show_licence_summary?: boolean;
  show_related_products?: boolean;
  show_live_previews?: boolean;
  allow_registration?: boolean;
  allow_guest_checkout?: boolean;
  [key: string]: any;
}

const DEFAULT_SETTINGS: PublicSettings = {
  store_name: 'Kanishk Digital World',
  store_description: 'Premium digital assets, n8n workflows, architecture templates, and design engineering tools.',
  legal_business_name: 'Kanishk Digital World Private Limited',
  primary_website_url: 'https://kanishkdigitalworld.com',
  support_email: 'support@kanishkdigitalworld.com',
  support_phone: '+91 98765 43210',
  whatsapp_number: '+91 98765 43210',
  business_hours: 'Mon–Fri, 9:00 AM – 6:00 PM IST',
  office_location: 'Bangalore, India',
  business_address: 'Bangalore, India',
  business_city: 'Bangalore',
  business_state: 'Karnataka',
  business_country: 'India',
  gst_number: '29AAAAA0000A1Z5',
  pan_number: 'AAAAA0000A',
  invoice_prefix: 'INV-KDW-',
  faq_link: '/faq',
  kb_link: '/docs',
  store_status: 'ACTIVE',
  availability: 'ACTIVE',
  is_maintenance: false,
  maintenance_message: '',
  currency: 'INR',
  currency_symbol: '₹',
  symbol_position: 'BEFORE',
  decimal_places: 0,
  tax_enabled: true,
  tax_mode: 'INCLUSIVE',
  gst_rate: 18,
  invoice_tax_note: 'GST @ 18% inclusive on all digital software downloads & digital licenses.',
  checkout_mode: 'BOTH',
  require_terms_acceptance: true,
  require_refund_policy_acceptance: true,
  require_privacy_acceptance: true,
  require_customer_phone: false,
  require_billing_address: false,
  razorpay_key_id: '',
  min_password_length: 8,
  enable_cookie_banner: true,
  cookie_banner_position: 'BOTTOM_RIGHT',
  show_product_ratings: true,
  show_download_format: true,
  show_file_size: true,
  show_version: true,
  show_licence_summary: true,
  show_related_products: true,
  show_live_previews: true,
  allow_registration: true,
  allow_guest_checkout: true
};

interface SettingsContextType {
  settings: PublicSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {}
});

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await axios.get('/api/settings/public?t=' + Date.now());
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setSettings(prev => ({ ...prev, ...d }));

        // Update currency globally
        setGlobalCurrencyConfig({
          currency: d.currency || 'INR',
          symbol: d.currency_symbol || '₹',
          symbolPosition: d.symbol_position || 'BEFORE',
          decimalPlaces: d.decimal_places !== undefined ? Number(d.decimal_places) : 0
        });

        // Update document title if applicable
        if (d.store_name) {
          const currentTitle = document.title;
          if (currentTitle.includes('Kanishk Digital World')) {
            document.title = currentTitle.replace(/Kanishk Digital World/g, d.store_name);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load public settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();

    // Listen for storage events (e.g. admin saves settings in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kdw_settings_updated') {
        refreshSettings();
      }
    };
    // Also listen to custom in-page event when settings are saved in admin panel
    const handleCustomUpdate = () => {
      refreshSettings();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('kdw:settings-updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kdw:settings-updated', handleCustomUpdate);
    };
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

