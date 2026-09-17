import Razorpay from 'razorpay';
import { prisma } from '../database/db';

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  environment: 'LIVE' | 'TEST';
}

/**
 * Retrieves the currently active Razorpay credentials, prioritizing DB GatewaySetting and falling back to process.env.
 */
export const getActiveRazorpayCredentials = async (): Promise<RazorpayCredentials> => {
  try {
    const setting = await prisma.gatewaySetting.findUnique({
      where: { gatewayName: 'RAZORPAY' }
    });

    const keyId = setting?.keyId || process.env.RAZORPAY_KEY_ID || '';
    const keySecret = setting?.keySecret || process.env.RAZORPAY_KEY_SECRET || '';
    const webhookSecret = setting?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;
    const environment = keyId.startsWith('rzp_live') || (!keyId.startsWith('rzp_test') && setting?.environment === 'LIVE') ? 'LIVE' : 'TEST';

    return {
      keyId,
      keySecret,
      webhookSecret,
      environment
    };
  } catch (err) {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    return {
      keyId,
      keySecret,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || keySecret,
      environment: keyId.startsWith('rzp_live') ? 'LIVE' : 'TEST'
    };
  }
};

/**
 * Returns a dynamically instantiated Razorpay client with the latest active credentials.
 */
export const getRazorpayClient = (customKeys?: { keyId?: string; keySecret?: string }): Razorpay => {
  const key_id = customKeys?.keyId || process.env.RAZORPAY_KEY_ID || 'dummy_key_id';
  const key_secret = customKeys?.keySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

  return new Razorpay({
    key_id,
    key_secret
  });
};

/**
 * Tests credentials against Razorpay's live servers via HTTP Basic Authentication.
 */
export const verifyRazorpayCredentials = async (keyId: string, keySecret: string) => {
  const cleanKeyId = (keyId || '').trim();
  const cleanKeySecret = (keySecret || '').trim();

  if (!cleanKeyId || !cleanKeySecret) {
    return {
      valid: false,
      statusCode: 400,
      mode: 'UNKNOWN',
      latencyMs: 0,
      message: 'Both Key ID and Key Secret are required to test credentials.'
    };
  }

  const auth = Buffer.from(`${cleanKeyId}:${cleanKeySecret}`).toString('base64');
  const start = Date.now();
  try {
    const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'KWD-Razorpay-Hub/2.0'
      }
    });

    const latencyMs = Math.max(10, Date.now() - start);
    const data: any = await response.json().catch(() => ({}));

    if (response.status === 200) {
      const isLive = cleanKeyId.startsWith('rzp_live');
      return {
        valid: true,
        statusCode: 200,
        mode: isLive ? 'LIVE' : 'TEST',
        latencyMs,
        message: `Razorpay ${isLive ? 'Live Production' : 'Test Sandbox'} credentials verified successfully! (Latency: ${latencyMs}ms)`
      };
    } else {
      const desc = data?.error?.description || data?.error?.code || `Authentication failed with status ${response.status}`;
      const friendlyMessage = (response.status === 401 || desc === 'Authentication failed')
        ? 'Razorpay rejected credentials (401: Authentication failed). The Key ID or Key Secret is expired or invalid in your Razorpay Dashboard.'
        : desc;
      return {
        valid: false,
        statusCode: response.status,
        mode: cleanKeyId.startsWith('rzp_live') ? 'LIVE' : 'TEST',
        latencyMs,
        message: friendlyMessage
      };
    }
  } catch (fetchErr: any) {
    return {
      valid: false,
      statusCode: 500,
      mode: cleanKeyId.startsWith('rzp_live') ? 'LIVE' : 'TEST',
      latencyMs: Date.now() - start,
      message: `Network error connecting to Razorpay: ${fetchErr?.message || 'Check your internet connection.'}`
    };
  }
};
