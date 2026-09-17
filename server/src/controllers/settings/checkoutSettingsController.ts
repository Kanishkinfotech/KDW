import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings, SECRET_MASK } from './settingsService';

export const getCheckoutSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('CHECKOUT');

    const response = {
      // Checkout Mode & Requirements
      checkout_mode: settings.checkout_mode || 'BOTH', // BOTH, ACCOUNT_ONLY, GUEST_ONLY
      require_customer_phone: settings.require_customer_phone ?? false,
      require_billing_address: settings.require_billing_address ?? false,
      allow_gst_invoice_request: settings.allow_gst_invoice_request ?? true,

      // Razorpay Integration Configuration
      razorpay_environment: settings.razorpay_environment || 'TEST', // TEST, LIVE
      razorpay_key_id: settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID || '',
      razorpay_key_secret: settings.razorpay_key_secret ? SECRET_MASK : (process.env.RAZORPAY_KEY_SECRET ? SECRET_MASK : ''),
      razorpay_webhook_url: settings.razorpay_webhook_url || 'https://api.kanishkdigitalworld.com/api/payments/webhook',
      razorpay_webhook_secret: settings.razorpay_webhook_secret ? SECRET_MASK : '',
      auto_capture_payments: settings.auto_capture_payments ?? true,
      payment_timeout_minutes: settings.payment_timeout_minutes ?? 15,

      // Failed Payment & Retry Rules
      allow_failed_payment_retry: settings.allow_failed_payment_retry ?? true,
      retry_link_validity_hours: settings.retry_link_validity_hours ?? 24,
      max_retry_attempts: settings.max_retry_attempts ?? 3,
      send_payment_failure_email: settings.send_payment_failure_email ?? true,

      // Terms & Policy Acceptance at Checkout
      require_terms_acceptance: settings.require_terms_acceptance ?? false,
      require_refund_policy_acceptance: settings.require_refund_policy_acceptance ?? false,
      require_privacy_acceptance: settings.require_privacy_acceptance ?? false
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateCheckoutSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key.startsWith('_')) continue;

      const cleanKey = key.replace(/^checkout\./, '');
      const isSecret = cleanKey === 'razorpay_key_secret' || cleanKey === 'razorpay_webhook_secret';

      // If secret and value is masked placeholder, skip overwriting
      if (isSecret && value === SECRET_MASK) continue;

      payloadList.push({
        key: `checkout.${cleanKey}`,
        value,
        group: 'CHECKOUT',
        dataType: isSecret ? 'SECRET' : (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : 'STRING'),
        isSecret,
        changeReason: req.body._changeReason || 'Checkout & Payment settings update'
      });
    }

    await bulkSaveSettings(payloadList, authUser || { name: 'Admin' });

    res.json({ success: true, message: 'Checkout settings updated and payment policies applied.' });
  } catch (error) {
    next(error);
  }
};
