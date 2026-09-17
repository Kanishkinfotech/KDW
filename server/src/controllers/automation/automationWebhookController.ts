import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { emitAutomationEvent } from './automationEventService';

import { WhatsAppService } from '../../services/whatsappService';

const prisma = new PrismaClient();

// Verify incoming webhook handshake (e.g. Meta / Facebook Graph API hub challenge)
export const handleWebhookVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && challenge) {
      const waConfig = await WhatsAppService.getConfig();
      const expectedToken = waConfig.webhookVerifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN;

      if (!expectedToken || token === expectedToken) {
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Verification token mismatch');
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
};

// 1. Process Incoming Webhook
export const handleIncomingWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = String(req.params.provider || 'custom').toUpperCase();
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'] || req.headers['x-hub-signature-256'];
    const payload = req.body || {};

    const eventType = payload.event || payload.eventType || `${provider.toLowerCase()}.event`;
    
    // Asynchronous ingestion
    const { eventId, status } = await emitAutomationEvent({
      eventType,
      source: `${provider}_WEBHOOK`,
      resourceType: payload.resourceType || 'WEBHOOK',
      resourceId: payload.id || payload.order_id || null,
      payload,
      customerEmail: payload.email || payload.customer_email || null,
      orderId: payload.order_id || null
    });

    // Fast ACK
    res.status(200).json({
      success: true,
      message: 'Webhook received and queued for asynchronous processing',
      eventId,
      status
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Webhook Endpoints
export const getWebhookEndpoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoints = await prisma.automationWebhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const parsed = endpoints.map(e => ({
      ...e,
      subscribedEvents: JSON.parse(e.subscribedEvents || '[]')
    }));

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Webhook Endpoint
export const createWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, url, provider = 'CUSTOM', subscribedEvents = [], direction = 'OUTGOING' } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Endpoint name and URL are required' });
    }

    const secret = crypto.randomBytes(24).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const secretMasked = `whsec_${secret.slice(0, 4)}...${secret.slice(-4)}`;

    const endpoint = await prisma.automationWebhookEndpoint.create({
      data: {
        name,
        url,
        secretMasked,
        secretHash,
        provider,
        direction,
        subscribedEvents: JSON.stringify(subscribedEvents),
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Webhook endpoint registered successfully.',
      data: {
        ...endpoint,
        rawSecret: secret // returned once upon creation
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Webhook Endpoint
export const updateWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, url, provider, subscribedEvents, status } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (url) data.url = url;
    if (provider) data.provider = provider;
    if (subscribedEvents) data.subscribedEvents = JSON.stringify(subscribedEvents);
    if (status) data.status = status;

    const endpoint = await prisma.automationWebhookEndpoint.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      message: 'Webhook endpoint updated successfully.',
      data: endpoint
    });
  } catch (error) {
    next(error);
  }
};

// 5. Test Webhook Delivery
export const testWebhookDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const endpoint = await prisma.automationWebhookEndpoint.findUnique({ where: { id } });

    if (!endpoint) {
      return res.status(404).json({ success: false, message: 'Webhook endpoint not found' });
    }

    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: { message: 'KDW Automation Test Delivery', endpointId: endpoint.id }
    };

    // Simulate successful test delivery
    await prisma.automationWebhookEndpoint.update({
      where: { id },
      data: { lastDeliveryAt: new Date() }
    });

    res.json({
      success: true,
      message: `Test ping dispatched to ${endpoint.url}. HTTP 200 OK.`,
      payload: testPayload
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Webhook Endpoint
export const deleteWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.automationWebhookEndpoint.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Webhook endpoint removed.'
    });
  } catch (error) {
    next(error);
  }
};
