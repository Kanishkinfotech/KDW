import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { sendProductDeliveryEmail } from '../utils/emailService';
import { DigitalDeliveryService } from '../services/digitalDeliveryService';
import { OrderFulfilmentService } from '../services/orderFulfilmentService';
import { CustomerService } from '../services/customerService';
import { PaymentService } from '../services/paymentService';
import { WebhookService } from '../services/webhookService';
import { CouponService } from '../services/couponService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// Auto-generate KDW Standard Order Number
const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `KDW-${year}${month}${day}-${randomSuffix}`;
};

// 1. Create an Order
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { items, customerId, guestEmail, guestName, guestMobile, couponCode } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!guestEmail) {
      return res.status(400).json({ success: false, message: 'Delivery email is required' });
    }
    
    guestEmail = guestEmail.trim().toLowerCase();
    if (guestEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery email format' });
    }

    // Validate Coupon if provided
    let discountAmount = 0;
    let couponValidationResult: any = null;

    if (couponCode) {
      couponValidationResult = await CouponService.validateCoupon({
        code: couponCode,
        cartItems: items.map((i: any) => ({
          productId: i.productId || (i.type !== 'bundle' ? i.id : undefined),
          bundleId: i.bundleId || (i.type === 'bundle' ? i.id : undefined),
          quantity: i.quantity || 1,
          unitPrice: i.price || 0
        })),
        customerId: customerId || (req as any).user?.id,
        guestEmail,
        ipAddress: req.ip
      });

      if (!couponValidationResult.valid) {
        return res.status(400).json({ success: false, message: couponValidationResult.message });
      }

      discountAmount = couponValidationResult.calculatedDiscount;
    }

    // Calculate total amount from database (never trust frontend prices)
    let subtotalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      if (item.type === 'bundle' || item.bundleId) {
        const bundleId = item.bundleId || item.id;
        const bundle = await prisma.bundle.findUnique({ where: { id: bundleId } });
        if (!bundle) {
          return res.status(404).json({ success: false, message: `Bundle ${bundleId} not found` });
        }
        if (bundle.status !== 'ACTIVE') {
          return res.status(400).json({ success: false, message: `Bundle "${bundle.title}" is currently unavailable` });
        }
        const itemTotal = bundle.price * item.quantity;
        subtotalAmount += itemTotal;
        
        orderItems.push({
          bundleId: bundle.id,
          productName: bundle.title,
          productNameSnapshot: bundle.title,
          productTypeSnapshot: 'BUNDLE',
          productVersionSnapshot: bundle.currentVersion || '1.0.0',
          licenceSnapshot: bundle.licenceType || 'COMMERCIAL',
          accessPolicySnapshot: 'LIFETIME',
          quantity: item.quantity,
          unitPrice: bundle.price,
          totalAmount: itemTotal
        });
      } else {
        const productId = item.productId || item.id;
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
          return res.status(404).json({ success: false, message: `Product ${productId} not found` });
        }
        if (product.status && !['ACTIVE', 'PUBLISHED'].includes(product.status.toUpperCase())) {
          return res.status(400).json({ success: false, message: `Product "${product.name}" is currently unavailable` });
        }
        
        const price = product.discountPrice ? product.discountPrice : product.price;
        const itemTotal = price * item.quantity;
        subtotalAmount += itemTotal;
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          productNameSnapshot: product.name,
          productTypeSnapshot: 'DIGITAL_PRODUCT',
          productVersionSnapshot: product.version || '1.0.0',
          licenceSnapshot: product.licenceType || 'COMMERCIAL',
          accessPolicySnapshot: 'LIFETIME',
          quantity: item.quantity,
          unitPrice: price,
          totalAmount: itemTotal
        });
      }
    }

    const totalAmount = Math.max(0, subtotalAmount - discountAmount);
    const orderNumber = generateOrderNumber();

    // Resolve unified Customer record (Account or Guest)
    let resolvedCustomerId = customerId || null;
    if (!resolvedCustomerId && guestEmail) {
      const guestCustomer = await CustomerService.findOrCreateGuestCustomer({
        email: guestEmail,
        name: guestName,
        phone: guestMobile,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      resolvedCustomerId = guestCustomer.id;
    }

    // Create Order in Database first (PENDING status)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        totalAmount,
        subtotal: subtotalAmount,
        discountTotal: discountAmount,
        customerType: customerId ? 'ACCOUNT' : 'GUEST',
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        accessStatus: 'NOT_GRANTED',
        fulfilmentStatus: 'UNFULFILLED',
        isHighValue: totalAmount >= 5000,
        customerId: resolvedCustomerId,
        guestEmail,
        guestName,
        guestMobile,
        items: {
          create: orderItems
        },
        timelineEvents: {
          create: {
            eventType: 'ORDER_CREATED',
            actorType: customerId ? 'CUSTOMER' : 'GUEST',
            actorName: guestName || 'Customer',
            actorEmail: guestEmail,
            status: 'SUCCESS',
            description: `Order ${orderNumber} created with ${orderItems.length} item(s) for ₹${totalAmount}`
          }
        }
      },
      include: { items: true }
    });

    // Reserve Coupon if applied
    if (couponValidationResult && couponValidationResult.couponId) {
      await CouponService.reserveCoupon(
        couponValidationResult.couponId,
        order.id,
        discountAmount,
        resolvedCustomerId || undefined,
        guestEmail
      );
    }

    // Handle FREE Order (totalAmount === 0)
    if (totalAmount === 0) {
      const freeOrderId = `FREE_CLAIM_${Date.now()}`;
      
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'FULFILMENT_PROCESSING',
          razorpayOrderId: freeOrderId,
          razorpayPaymentId: freeOrderId,
          razorpaySignature: 'sig_free_claim',
          paidAt: new Date()
        }
      });

      await prisma.notification.create({
        data: {
          title: `New Free Claim (${order.orderNumber})`,
          message: `Customer ${order.guestName || 'Guest'} (${order.guestEmail}) claimed free product(s)`,
          type: 'Order',
          link: '/admin/orders'
        }
      });

      // Execute Asynchronous Digital Delivery via Fulfilment Engine
      OrderFulfilmentService.fulfilOrder(order.id).catch(err => {
        console.error('[PaymentController] Digital delivery error for free order:', err);
      });

      return res.status(201).json({
        success: true,
        isFree: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          razorpayOrderId: freeOrderId,
          amount: 0,
          currency: 'INR',
          paymentMode: 'free'
        }
      });
    }

    // Check if we're in mock mode (no real Razorpay keys)
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id';

    let razorpayOrderId = `mock_order_${Date.now()}`;
    let amount = Math.round(totalAmount * 100);
    let currency = 'INR';

    if (!isMock) {
      const razorpayOrder = await razorpay.orders.create({
        amount,
        currency,
        receipt: order.id
      });
      razorpayOrderId = razorpayOrder.id;
      amount = razorpayOrder.amount as number;
      currency = razorpayOrder.currency;
    }

    // Update DB order with the Razorpay Order ID
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId }
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId,
        amount,
        currency,
        paymentMode: isMock ? 'mock' : 'live'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Payment (Frontend checkout callback)
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const isValid = PaymentService.verifyCheckoutSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already verified' });
    }

    const payment = await PaymentService.recordSuccessfulCapture({
      orderId: order.id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: order.totalAmount,
      currency: order.currency,
      verificationType: 'SIGNATURE',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Payment verified successfully', payment });
  } catch (error) {
    next(error);
  }
};

// 3. Server-to-Server Webhook Listener (Authoritative)
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'dummy_webhook_secret';
    const signature = (req.headers['x-razorpay-signature'] as string) || 'sig_mock_dummy';

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await WebhookService.processRawWebhook(rawBody, signature, webhookSecret);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
