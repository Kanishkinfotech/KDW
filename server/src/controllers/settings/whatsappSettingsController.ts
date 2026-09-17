import { Request, Response, NextFunction } from 'express';
import { getSettingsByGroup, bulkSaveSettings, SECRET_MASK } from './settingsService';
import { WhatsAppService } from '../../services/whatsappService';

export const getWhatsAppSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettingsByGroup('WHATSAPP');
    const integrationSettings = await getSettingsByGroup('INTEGRATION');

    const metaAppId = settings.meta_app_id || integrationSettings.meta_app_id || process.env.META_APP_ID || '';
    const metaAppSecret = settings.meta_app_secret || integrationSettings.meta_app_secret || (process.env.META_APP_SECRET ? SECRET_MASK : '');
    const wabaId = settings.waba_id || integrationSettings.waba_id || process.env.META_WABA_ID || '';
    const phoneNumberId = settings.phone_number_id || integrationSettings.phone_number_id || process.env.META_PHONE_NUMBER_ID || '';
    const businessPhoneNumber = settings.business_phone_number || integrationSettings.business_phone_number || process.env.META_PHONE_NUMBER || '';
    const accessToken = settings.access_token || integrationSettings.meta_access_token || (process.env.META_ACCESS_TOKEN ? SECRET_MASK : '');
    const webhookVerifyToken = settings.webhook_verify_token || integrationSettings.meta_verify_token || (process.env.META_WEBHOOK_VERIFY_TOKEN ? SECRET_MASK : '');
    const apiVersion = settings.api_version || 'v20.0';

    const response = {
      meta_app_id: metaAppId,
      meta_app_secret: metaAppSecret,
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      business_phone_number: businessPhoneNumber,
      access_token: accessToken,
      webhook_verify_token: webhookVerifyToken,
      api_version: apiVersion,

      send_order_confirmation_wa: settings.send_order_confirmation_wa ?? true,
      send_download_ready_wa: settings.send_download_ready_wa ?? true,
      send_abandoned_cart_wa: settings.send_abandoned_cart_wa ?? false,
      send_promotional_wa: settings.send_promotional_wa ?? true,

      webhook_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/admin/automation/webhook/meta`
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

export const updateWhatsAppSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const authUser = (req as any).user;

    const payloadList: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key.startsWith('_')) continue;

      const cleanKey = key.replace(/^whatsapp\./, '');
      const isSecret = cleanKey === 'access_token' || cleanKey === 'meta_app_secret' || cleanKey === 'webhook_verify_token';

      if (isSecret && (value === SECRET_MASK || value === '••••••••••••••••' || value === '')) continue;

      payloadList.push({
        key: `whatsapp.${cleanKey}`,
        value,
        group: 'WHATSAPP',
        dataType: isSecret ? 'SECRET' : (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : 'STRING'),
        isSecret,
        changeReason: req.body._changeReason || 'WhatsApp Business API configuration update'
      });
    }

    await bulkSaveSettings(payloadList, authUser || { name: 'Admin' });

    res.json({ success: true, message: 'WhatsApp configuration saved successfully.' });
  } catch (error) {
    next(error);
  }
};

export const sendTestWhatsAppMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientPhone, message } = req.body;
    if (!recipientPhone) {
      return res.status(400).json({ success: false, message: 'A valid recipient phone number is required.' });
    }

    const testText = message || 'Hello! This is a real test notification from Kanishk Digital World WhatsApp Integration.';
    const result = await WhatsAppService.sendMessage({
      to: recipientPhone,
      textMessage: testText
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Test WhatsApp message successfully queued/dispatched to ${recipientPhone}. Message ID: ${result.messageId || 'N/A'}`
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to dispatch WhatsApp message: ${result.error || 'Check Meta WhatsApp API credentials.'}`
      });
    }
  } catch (error: any) {
    next(error);
  }
};
