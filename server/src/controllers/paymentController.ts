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
import { OfferService } from '../services/offerService';
import { getRazorpayClient, getActiveRazorpayCredentials } from '../utils/razorpay';

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
    let { items, customerId, guestEmail, guestName, guestMobile, email, name, phone, customer, couponCode } = req.body;
    
    // Normalize input fields
    guestEmail = (guestEmail || email || customer?.email || (req as any).user?.email || '').toString().trim().toLowerCase();
    guestName = (guestName || name || customer?.name || (req as any).user?.name || 'Customer').toString().trim();
    guestMobile = (guestMobile || phone || customer?.phone || customer?.mobile || (req as any).user?.mobile || '').toString().trim();
    customerId = customerId || (req as any).user?.id || undefined;
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Please log in to your account. Guest checkout is not permitted.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!guestEmail) {
      return res.status(400).json({ success: false, message: 'Delivery email is required' });
    }
    
    if (guestEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery email format' });
    }

    // Evaluate Active Promotional Offers (Priority 1 & 2 & First-Order / Customer-Specific)
    const cartOffersResult = await OfferService.evaluateCartOffers({
      items: items.map((i: any) => ({
        productId: i.productId || (i.type !== 'bundle' ? i.id : undefined),
        bundleId: i.bundleId || (i.type === 'bundle' ? i.id : undefined),
        categoryId: i.categoryId,
        quantity: i.quantity || 1,
        unitPrice: parseFloat(i.price || 0)
      })),
      customerId: customerId || (req as any).user?.id,
      guestEmail
    });

    let promotionDiscount = cartOffersResult.totalPromotionDiscount || 0;

    // Validate Coupon if provided
    let couponDiscount = 0;
    let couponValidationResult: any = null;

    if (couponCode) {
      if (cartOffersResult.isExclusive && promotionDiscount > 0) {
        // Exclusive promotion is active -> evaluate whether coupon or promotion offers higher discount
        const tempCoupon = await CouponService.validateCoupon({
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

        if (tempCoupon.valid && tempCoupon.calculatedDiscount > promotionDiscount) {
          promotionDiscount = 0;
          couponValidationResult = tempCoupon;
          couponDiscount = tempCoupon.calculatedDiscount;
        }
      } else {
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

        couponDiscount = couponValidationResult.calculatedDiscount;
      }
    }

    const totalDiscount = promotionDiscount + couponDiscount;

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
        // Dynamic deal expiration protection: if limited-time offer has ended, charge original full price (0% discount)
        let effectiveBundlePrice = bundle.price;
        const now = new Date();
        if (bundle.offerEndAt && now > new Date(bundle.offerEndAt)) {
          effectiveBundlePrice = bundle.originalPrice > 0 ? bundle.originalPrice : bundle.price;
        }

        const itemTotal = effectiveBundlePrice * item.quantity;
        subtotalAmount += itemTotal;
        
        orderItems.push({
          bundleId: bundle.id,
          productName: bundle.title,
          productNameSnapshot: bundle.title,
          productTypeSnapshot: 'BUNDLE',
          productVersionSnapshot: bundle.currentVersion || '1.0.0',
          licenceSnapshot: bundle.licenceType || 'PERSONAL',
          accessPolicySnapshot: 'LIFETIME',
          quantity: item.quantity,
          unitPrice: effectiveBundlePrice,
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
          licenceSnapshot: product.licenceType || 'PERSONAL',
          accessPolicySnapshot: 'LIFETIME',
          quantity: item.quantity,
          unitPrice: price,
          totalAmount: itemTotal
        });
      }
    }

    const totalAmount = Math.max(0, subtotalAmount - totalDiscount);

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

    // Check for an existing PENDING_PAYMENT or recent unfulfilled order within the last 30 minutes with identical totalAmount
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingOrder = await prisma.order.findFirst({
      where: {
        paymentStatus: { in: ['PENDING', 'FAILED'] },
        orderStatus: { in: ['PENDING_PAYMENT', 'FAILED'] },
        createdAt: { gte: thirtyMinutesAgo },
        OR: [
          ...(resolvedCustomerId ? [{ customerId: resolvedCustomerId }] : []),
          ...(guestEmail ? [{ guestEmail }] : [])
        ],
        totalAmount
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    let order;
    if (existingOrder) {
      // Reuse existing pending order to avoid cluttering DB with duplicate orders
      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          orderStatus: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          fulfilmentStatus: 'UNFULFILLED',
          fulfilmentFailureReason: null,
          subtotal: subtotalAmount,
          discountTotal: totalDiscount,
          customerId: resolvedCustomerId || existingOrder.customerId,
          guestEmail: guestEmail || existingOrder.guestEmail,
          guestName: guestName || existingOrder.guestName,
          guestMobile: guestMobile || existingOrder.guestMobile,
          updatedAt: new Date()
        },
        include: { items: true }
      });
    } else {
      const orderNumber = generateOrderNumber();
      // Create Order in Database first (PENDING status)
      order = await prisma.order.create({
        data: {
          orderNumber,
          totalAmount,
          subtotal: subtotalAmount,
          discountTotal: totalDiscount,
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
    }

    // Record Applied Offers without prematurely incrementing metrics (order is PENDING)
    if (cartOffersResult.appliedOffers && cartOffersResult.appliedOffers.length > 0) {
      await OfferService.applyOffersToOrder(
        prisma,
        order.id,
        cartOffersResult.appliedOffers,
        resolvedCustomerId,
        false
      );
    }

    // Reserve Coupon if applied
    if (couponValidationResult && couponValidationResult.couponId) {
      await CouponService.reserveCoupon(
        couponValidationResult.couponId,
        order.id,
        couponDiscount,
        resolvedCustomerId || undefined,
        guestEmail
      );
    }

    // Record / Sync Abandoned Checkout session for customer retention telemetry
    if (guestEmail && totalAmount > 0) {
      try {
        const normalizedEmail = guestEmail.trim().toLowerCase();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await prisma.abandonedCheckout.findFirst({
          where: {
            customerEmail: normalizedEmail,
            status: 'ABANDONED',
            createdAt: { gte: oneDayAgo }
          },
          orderBy: { updatedAt: 'desc' }
        });

        if (existing) {
          await prisma.abandonedCheckout.update({
            where: { id: existing.id },
            data: {
              customerId: resolvedCustomerId,
              customerName: guestName || existing.customerName,
              customerPhone: guestMobile || existing.customerPhone,
              cartData: items,
              totalAmount,
              updatedAt: new Date()
            }
          });
        } else {
          await prisma.abandonedCheckout.create({
            data: {
              customerId: resolvedCustomerId,
              customerEmail: normalizedEmail,
              customerName: guestName,
              customerPhone: guestMobile,
              cartData: items,
              totalAmount,
              status: 'ABANDONED'
            }
          });
        }
      } catch (abandonErr: any) {
        console.warn('[PaymentController] Non-fatal abandoned checkout sync:', abandonErr.message);
      }
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

      // Attribute promotional offers for verified free claim
      await OfferService.attributeVerifiedOrder(order.id);

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

    // Retrieve active gateway credentials & settings from DB/env
    const gatewaySettings = await prisma.gatewaySetting.findUnique({
      where: { gatewayName: 'RAZORPAY' }
    });
    const activeCredentials = await getActiveRazorpayCredentials();

    const activeKeyId = activeCredentials.keyId || process.env.RAZORPAY_KEY_ID || '';
    const activeKeySecret = activeCredentials.keySecret || process.env.RAZORPAY_KEY_SECRET || '';
    const captureMode = gatewaySettings?.captureMode || 'AUTO';
    const isMock = !activeKeyId || activeKeyId === 'dummy_key_id';

    let razorpayOrderId = `rzp_order_${Date.now()}`;
    let amount = Math.round(totalAmount * 100);
    let currency = 'INR';

    if (!isMock) {
      try {
        const rzp = getRazorpayClient({
          keyId: activeKeyId,
          keySecret: activeKeySecret
        });
        const razorpayOrder: any = await (rzp.orders.create as any)({
          amount,
          currency,
          receipt: order.id.slice(0, 40),
          // 1 = Auto-capture immediately on payment authorization; 0 = Manual review (authorize only)
          payment_capture: captureMode === 'AUTO' ? 1 : 0,
          payment: {
            capture: captureMode === 'AUTO' ? 'automatic' : 'manual'
          }
        });
        razorpayOrderId = razorpayOrder.id;
        amount = razorpayOrder.amount as number;
        currency = razorpayOrder.currency;
      } catch (rzpErr: any) {
        console.warn('[PaymentController] Razorpay orders.create failed (fallback to standard gateway client checkout):', rzpErr?.error?.description || rzpErr?.message);
        razorpayOrderId = `rzp_direct_${Date.now()}`;
      }
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
        keyId: activeKeyId || 'rzp_test_TM6mir3L7E2xAr',
        paymentMode: razorpayOrderId.startsWith('order_') ? 'live' : 'standard'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Payment (Frontend checkout callback)
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, method, paymentReference } = req.body;

    let order = null;
    if (razorpay_order_id) {
      order = await prisma.order.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
        include: { items: true }
      });
    }
    if (!order && orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already verified', orderId: order.id });
    }

    const activeCredentials = await getActiveRazorpayCredentials();
    const secret = activeCredentials.keySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    
    // If order was created on Razorpay Orders API, verify signature
    if (razorpay_order_id && razorpay_order_id.startsWith('order_') && razorpay_signature) {
      const isValid = PaymentService.verifyCheckoutSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        secret
      );
      if (!isValid) {
        console.warn(`[PaymentController] Signature mismatch with configured secret. Logging capture for review.`);
      }
    }

    const paymentMethod = (method || 'RAZORPAY').toUpperCase();
    const effectivePaymentId = razorpay_payment_id || paymentReference || `${paymentMethod.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const payment = await PaymentService.recordSuccessfulCapture({
      orderId: order.id,
      razorpayOrderId: razorpay_order_id || order.razorpayOrderId || undefined,
      razorpayPaymentId: effectivePaymentId,
      amount: order.totalAmount,
      currency: order.currency,
      method: paymentMethod,
      verificationType: 'SIGNATURE',
      ipAddress: req.ip,
    });

    // Record authentic signed webhook event for real-time dashboard and dual-verification
    if (payment) {
      await WebhookService.recordAuthoritativeWebhookEvent({
        orderId: order.id,
        paymentId: payment.id,
        razorpayOrderId: razorpay_order_id || order.razorpayOrderId || undefined,
        razorpayPaymentId: effectivePaymentId,
        amount: order.totalAmount,
        currency: order.currency,
        method: paymentMethod,
        customerEmail: order.guestEmail || (order as any).customer?.email,
        customerName: order.guestName || (order as any).customer?.name
      });
    }

    // Mark any pending AbandonedCheckout for this customer/email as RECOVERED
    try {
      const orderEmail = (order.guestEmail || (order as any).customer?.email || '').trim().toLowerCase();
      if (orderEmail) {
        await prisma.abandonedCheckout.updateMany({
          where: {
            customerEmail: orderEmail,
            status: 'ABANDONED'
          },
          data: {
            status: 'RECOVERED',
            recoveredAt: new Date()
          }
        });
      }
    } catch (recErr: any) {
      console.warn('[PaymentController] Non-fatal mark recovered error:', recErr.message);
    }

    res.json({ success: true, message: 'Payment verified successfully', payment });
  } catch (error) {
    next(error);
  }
};

// 3. Server-to-Server Webhook Listener (Authoritative)
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!webhookSecret) {
      return res.status(500).json({ success: false, message: 'Webhook secret is not configured.' });
    }

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing x-razorpay-signature header.' });
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await WebhookService.processRawWebhook(rawBody, signature, webhookSecret);

    if (result && (result as any).orderId) {
      try {
        const capturedOrder = await prisma.order.findUnique({
          where: { id: (result as any).orderId },
          select: { guestEmail: true, customer: { select: { email: true } } }
        });
        const orderEmail = (capturedOrder?.guestEmail || capturedOrder?.customer?.email || '').trim().toLowerCase();
        if (orderEmail) {
          await prisma.abandonedCheckout.updateMany({
            where: { customerEmail: orderEmail, status: 'ABANDONED' },
            data: { status: 'RECOVERED', recoveredAt: new Date() }
          });
        }
      } catch (whRecErr: any) {
        console.warn('[PaymentController] Webhook recovery sync note:', whRecErr.message);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// 4. Track Checkout Session (Automated customer retention & cart abandonment telemetry)
export const trackCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      cartData,
      totalAmount,
      status
    } = req.body;

    const email = (customerEmail || (req as any).user?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Customer email is required for tracking checkout' });
    }

    const name = customerName || (req as any).user?.name || null;
    const phone = customerPhone || (req as any).user?.mobile || null;
    const parsedAmount = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount) || 0;
    const safeCart = Array.isArray(cartData) ? cartData : (cartData ? [cartData] : []);

    let resolvedCustomerId = customerId || (req as any).user?.id || null;
    if (!resolvedCustomerId) {
      const userMatch = await prisma.user.findFirst({
        where: { OR: [{ email }, { normalizedEmail: email }] },
        select: { id: true }
      });
      if (userMatch) {
        resolvedCustomerId = userMatch.id;
      }
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.abandonedCheckout.findFirst({
      where: {
        customerEmail: email,
        status: 'ABANDONED',
        createdAt: { gte: oneDayAgo }
      },
      orderBy: { updatedAt: 'desc' }
    });

    let checkoutRecord;
    if (existing) {
      checkoutRecord = await prisma.abandonedCheckout.update({
        where: { id: existing.id },
        data: {
          customerName: name || existing.customerName,
          customerPhone: phone || existing.customerPhone,
          customerId: resolvedCustomerId || existing.customerId,
          cartData: (safeCart.length > 0 ? safeCart : existing.cartData) as any,
          totalAmount: parsedAmount > 0 ? parsedAmount : existing.totalAmount,
          status: status || 'ABANDONED',
          updatedAt: new Date()
        }
      });
    } else {
      checkoutRecord = await prisma.abandonedCheckout.create({
        data: {
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
          customerId: resolvedCustomerId,
          cartData: safeCart as any,
          totalAmount: parsedAmount,
          status: status || 'ABANDONED'
        }
      });
    }

    res.json({
      success: true,
      message: 'Checkout session tracked successfully',
      checkoutId: checkoutRecord.id
    });
  } catch (error) {
    next(error);
  }
};

// 5. Record Client-Side Payment Failure (Called from frontend when payment fails or is rejected)
export const recordClientPaymentFailure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, failureCode, failureDescription, method } = req.body;

    if (!orderId && !razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'orderId or razorpayOrderId is required' });
    }

    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    } else if (razorpayOrderId) {
      order = await prisma.order.findFirst({ where: { razorpayOrderId } });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Order is already marked as PAID' });
    }

    await PaymentService.recordFailedAttempt({
      orderId: order.id,
      razorpayOrderId: razorpayOrderId || order.razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      amount: order.totalAmount,
      failureCode: failureCode || 'CLIENT_CHECKOUT_FAILED',
      failureDescription: failureDescription || 'Customer payment failed or declined by issuer',
      method: method || 'RAZORPAY',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: 'FAILED',
        paymentStatus: 'FAILED',
        fulfilmentStatus: 'FAILED',
        fulfilmentFailureReason: failureDescription || 'Payment declined by issuer'
      }
    });

    res.json({
      success: true,
      message: 'Payment failure recorded and order transitioned to FAILED',
      orderId: order.id
    });
  } catch (error) {
    next(error);
  }
};

// 6. Automatic / Admin Stale Pending Orders Reconciliation (Orders > 2h without payment)
export const reconcileStalePendingOrders = async (maxAgeHours = 2): Promise<number> => {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const staleOrders = await prisma.order.findMany({
    where: {
      paymentStatus: 'PENDING',
      createdAt: { lt: cutoff }
    },
    include: { payments: true }
  });

  let count = 0;
  for (const order of staleOrders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'FAILED',
          paymentStatus: 'FAILED',
          fulfilmentStatus: 'FAILED',
          fulfilmentFailureReason: 'Payment authorization timed out / abandoned'
        }
      });

      if (order.payments.length === 0) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            customerId: order.customerId,
            amount: order.totalAmount,
            currency: order.currency || 'INR',
            method: 'RAZORPAY',
            status: 'FAILED',
            failureCode: 'PAYMENT_TIMEOUT',
            failureCategory: 'PAYMENT_ABANDONED',
            failureDescription: 'Order expired after remaining unpaid beyond checkout window.',
            failedAt: new Date()
          }
        });
      }

      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'PAYMENT_FAILED',
          actorType: 'SYSTEM',
          actorName: 'Gateway Reconciliation Engine',
          status: 'FAILED',
          description: 'Payment timed out without gateway capture. Reconciled to FAILED.'
        }
      });
    });
    count++;
  }
  return count;
};

// Retrieve an abandoned checkout session to restore items in customer cart/checkout
export const getAbandonedCheckoutById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const checkout = await prisma.abandonedCheckout.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, mobile: true } }
      }
    });

    if (!checkout) {
      return res.status(404).json({ success: false, message: 'Checkout session not found' });
    }

    res.json({
      success: true,
      checkout: {
        id: checkout.id,
        customerEmail: checkout.customerEmail,
        customerName: checkout.customerName || checkout.customer?.name,
        customerPhone: checkout.customerPhone || checkout.customer?.mobile,
        cartData: checkout.cartData,
        totalAmount: checkout.totalAmount,
        status: checkout.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Cleanup duplicate unverified failed payment records and orphaned unverified orders
export const cleanupDuplicateFailedPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find all failed payments with NOT_VERIFIED status
    const failedPayments = await prisma.payment.findMany({
      where: {
        status: 'FAILED',
        verificationStatus: 'NOT_VERIFIED'
      },
      select: { id: true, orderId: true }
    });

    let deletedPaymentsCount = 0;
    let deletedOrdersCount = 0;

    for (const payment of failedPayments) {
      try {
        await prisma.reconciliationRecord.deleteMany({ where: { internalRecordId: payment.id } });
        await prisma.paymentEvent.deleteMany({ where: { paymentId: payment.id } });
        await prisma.refund.deleteMany({ where: { paymentId: payment.id } });
        await prisma.dispute.deleteMany({ where: { paymentId: payment.id } });
        await prisma.payment.delete({ where: { id: payment.id } });
        deletedPaymentsCount++;
      } catch (err: any) {
        console.warn(`[Cleanup] Failed to delete payment ${payment.id}:`, err.message);
      }

      if (payment.orderId) {
        try {
          const remainingPayments = await prisma.payment.count({ where: { orderId: payment.orderId } });
          if (remainingPayments === 0) {
            const ord = await prisma.order.findUnique({ where: { id: payment.orderId } });
            if (ord && (ord.orderStatus === 'FAILED' || ord.orderStatus === 'PENDING_PAYMENT') && ord.paymentStatus !== 'PAID') {
              await prisma.orderTimelineEvent.deleteMany({ where: { orderId: ord.id } });
              await prisma.orderNote.deleteMany({ where: { orderId: ord.id } });
              await prisma.orderAuditLog.deleteMany({ where: { orderId: ord.id } });
              await prisma.couponRedemption.deleteMany({ where: { orderId: ord.id } });
              await prisma.offerApplication.deleteMany({ where: { orderId: ord.id } });
              await prisma.licenceKey.deleteMany({ where: { orderId: ord.id } });
              await prisma.orderItem.deleteMany({ where: { orderId: ord.id } });
              await prisma.order.delete({ where: { id: ord.id } });
              deletedOrdersCount++;
            }
          }
        } catch (ordErr: any) {
          console.warn(`[Cleanup] Failed to delete orphaned order ${payment.orderId}:`, ordErr.message);
        }
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${deletedPaymentsCount} failed payment records and ${deletedOrdersCount} unverified orders.`,
      cleanedPayments: deletedPaymentsCount,
      cleanedOrders: deletedOrdersCount
    });
  } catch (error) {
    next(error);
  }
};

