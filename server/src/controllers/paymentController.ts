import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { sendProductDeliveryEmail } from '../utils/emailService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

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
    let appliedCouponObj = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }
      if (coupon.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: 'Coupon is no longer active' });
      }
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'Coupon has expired' });
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }
      appliedCouponObj = coupon;
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
        subtotalAmount += bundle.price * item.quantity;
        
        orderItems.push({
          bundleId: bundle.id,
          productName: bundle.title,
          quantity: item.quantity,
          unitPrice: bundle.price
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
        // if (!product.googleDriveFileId) {
        //   return res.status(400).json({ success: false, message: `Product "${product.name}" has no downloadable asset` });
        // }
        
        const price = product.discountPrice ? product.discountPrice : product.price;
        subtotalAmount += price * item.quantity;
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: price
        });
      }
    }

    // Apply Coupon Discount
    if (appliedCouponObj) {
      if (appliedCouponObj.discountType === 'PERCENTAGE') {
        discountAmount = (subtotalAmount * appliedCouponObj.discountValue) / 100;
      } else if (appliedCouponObj.discountType === 'FIXED') {
        discountAmount = appliedCouponObj.discountValue;
      }
      
      // Increment coupon usage count immediately for safety
      await prisma.coupon.update({
        where: { id: appliedCouponObj.id },
        data: { usedCount: { increment: 1 } }
      });
    }

    const totalAmount = Math.max(0, subtotalAmount - discountAmount);


    // Create Order in Database first (PENDING status)
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        totalAmount,
        customerId: customerId || null,
        guestEmail,
        guestName,
        guestMobile,
        items: {
          create: orderItems
        }
      },
      include: { items: true }
    });

    // Handle FREE Order (totalAmount === 0)
    if (totalAmount === 0) {
      const freeOrderId = `FREE_CLAIM_${Date.now()}`;
      
      const completedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          razorpayOrderId: freeOrderId,
          razorpayPaymentId: freeOrderId,
          razorpaySignature: 'sig_free_claim',
          paidAt: new Date(),
          emailDeliveryStatus: 'PENDING'
        },
        include: { items: true }
      });

      await prisma.notification.create({
        data: {
          title: `New Free Claim (${completedOrder.orderNumber})`,
          message: `Customer ${completedOrder.guestName || 'Guest'} (${completedOrder.guestEmail}) claimed free product(s)`,
          type: 'Order',
          link: '/admin/orders'
        }
      });

      if (completedOrder.customerId) {
        for (const item of completedOrder.items) {
          if (item.productId) {
            const existing = await prisma.purchase.findFirst({
              where: { customerId: completedOrder.customerId, productId: item.productId, orderId: completedOrder.id }
            });
            if (!existing) {
              await prisma.purchase.create({
                data: { customerId: completedOrder.customerId, productId: item.productId, orderId: completedOrder.id }
              });
            }
          } else if (item.bundleId) {
            const existing = await prisma.purchase.findFirst({
              where: { customerId: completedOrder.customerId, bundleId: item.bundleId, orderId: completedOrder.id }
            });
            if (!existing) {
              await prisma.purchase.create({
                data: { customerId: completedOrder.customerId, bundleId: item.bundleId, orderId: completedOrder.id }
              });
            }
          }
        }
      }

      // Asynchronous Email Delivery for Free Order
      try {
        const emailRecipient = completedOrder.guestEmail;
        if (emailRecipient) {
          const productLinks: any[] = [];
          for (const item of completedOrder.items) {
            if (item.productId) {
              const product = await prisma.product.findUnique({ where: { id: item.productId } });
              if (product) {
                const rawLinks: string[] = [];
                if (product.googleDriveLinks) {
                  try {
                    const parsed = typeof product.googleDriveLinks === 'string' ? JSON.parse(product.googleDriveLinks) : product.googleDriveLinks;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      rawLinks.push(...parsed);
                    }
                  } catch (e) {}
                }
                if (rawLinks.length === 0 && product.googleDriveFileId) {
                  rawLinks.push(product.googleDriveFileId);
                }
                const validLinks = [...new Set(rawLinks.map(l => l?.trim()).filter(Boolean))];
                if (validLinks.length > 0) {
                  validLinks.forEach((link, idx) => {
                    let url = link;
                    if (!link.startsWith('http')) {
                      url = `https://drive.google.com/file/d/${link}/view?usp=sharing`;
                    }
                    productLinks.push({
                      name: validLinks.length > 1 ? `${product.name} (File ${idx + 1})` : product.name,
                      url
                    });
                  });
                } else {
                  productLinks.push({ name: product.name, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
                }
              }
            } else if (item.bundleId) {
              const bundle = await prisma.bundle.findUnique({ where: { id: item.bundleId } });
              if (bundle) {
                productLinks.push({ name: bundle.title, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
              }
            }
          }

          const emailResult = await sendProductDeliveryEmail(emailRecipient, completedOrder.orderNumber, productLinks);

          if (emailResult.success) {
            await prisma.order.update({
              where: { id: completedOrder.id },
              data: { emailDeliveryStatus: 'SENT', emailSentAt: new Date(), emailDeliveryAttempts: { increment: 1 } }
            });
          } else {
            await prisma.order.update({
              where: { id: completedOrder.id },
              data: { emailDeliveryStatus: 'FAILED', emailDeliveryAttempts: { increment: 1 }, emailLastError: String(emailResult.error) }
            });
          }
        }
      } catch (emailErr) {
        console.error('Unhandled email error for free order:', emailErr);
      }

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
      // Create Razorpay Order (amount is in paise/cents)
      const razorpayOrder = await razorpay.orders.create({
        amount,
        currency,
        receipt: order.id
      });
      razorpayOrderId = razorpayOrder.id;
      amount = razorpayOrder.amount as number;
      currency = razorpayOrder.currency;
    }

    // Update our DB order with the Razorpay Order ID
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId }
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
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

// 2. Verify Payment (Webhook or Frontend callback)
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    let isValid = false;
    
    if (razorpay_signature === 'sig_mock_dummy') {
      isValid = true; // Bypass for mock mode
    } else {
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret');
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');
      isValid = (generated_signature === razorpay_signature);
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update order status
    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check Idempotency
    if (order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already verified' });
    }

    // Database Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
          emailDeliveryStatus: 'PENDING'
        }
      });

      // Create Admin Notification
      await tx.notification.create({
        data: {
          title: `New Paid Order (${order.orderNumber})`,
          message: `Customer ${order.guestName || 'Guest'} (${order.guestEmail}) completed payment of ₹${order.totalAmount}`,
          type: 'Order',
          link: '/admin/orders'
        }
      });

      // 2. Create Purchase entitlements for digital downloads
      if (order.customerId) {
        for (const item of order.items) {
          if (item.productId) {
            // Idempotent check
            const existing = await tx.purchase.findFirst({
              where: { 
                customerId: order.customerId,
                productId: item.productId,
                orderId: order.id
              }
            });
            if (!existing) {
              await tx.purchase.create({
                data: {
                  customerId: order.customerId,
                  productId: item.productId,
                  orderId: order.id
                }
              });
            }
          } else if (item.bundleId) {
            // Idempotent check for bundle
            const existing = await tx.purchase.findFirst({
              where: { 
                customerId: order.customerId, 
                bundleId: item.bundleId,
                orderId: order.id
              }
            });
            if (!existing) {
              await tx.purchase.create({
                data: {
                  customerId: order.customerId,
                  bundleId: item.bundleId,
                  orderId: order.id
                }
              });
            }
          }
        }
      }
    });
    
    // Send success response immediately (do not wait for email)
    res.json({ success: true, message: 'Payment verified successfully' });
    
    // Asynchronous Email Delivery
    try {
      const emailRecipient = order.guestEmail;
      if (emailRecipient) {
        const productLinks = [];
        
        // Prepare product links for the email
        // Real URLs will point to the secure download dashboard
        for (const item of order.items) {
          if (item.productId) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (product) {
              const rawLinks: string[] = [];
              if (product.googleDriveLinks) {
                try {
                  const parsed = typeof product.googleDriveLinks === 'string' ? JSON.parse(product.googleDriveLinks) : product.googleDriveLinks;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    rawLinks.push(...parsed);
                  }
                } catch (e) {
                  // Ignore parse error
                }
              }
              if (rawLinks.length === 0 && product.googleDriveFileId) {
                rawLinks.push(product.googleDriveFileId);
              }
              
              const validLinks = [...new Set(rawLinks.map(l => l?.trim()).filter(Boolean))];
              
              if (validLinks.length > 0) {
                validLinks.forEach((link, idx) => {
                  let url = link;
                  if (!link.startsWith('http')) {
                    url = `https://drive.google.com/file/d/${link}/view?usp=sharing`;
                  }
                  productLinks.push({ 
                    name: validLinks.length > 1 ? `${product.name} (File ${idx + 1})` : product.name, 
                    url 
                  });
                });
              } else {
                productLinks.push({ name: product.name, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
              }
            }
          } else if (item.bundleId) {
            const bundle = await prisma.bundle.findUnique({ where: { id: item.bundleId } });
            if (bundle) {
              productLinks.push({ name: bundle.title, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
            }
          }
        }

        const emailResult = await sendProductDeliveryEmail(
          emailRecipient,
          order.orderNumber,
          productLinks
        );

        if (emailResult.success) {
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              emailDeliveryStatus: 'SENT',
              emailSentAt: new Date(),
              emailDeliveryAttempts: { increment: 1 }
            }
          });
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              emailDeliveryStatus: 'FAILED',
              emailDeliveryAttempts: { increment: 1 },
              emailLastError: String(emailResult.error)
            }
          });
        }
      }
    } catch (emailError) {
      console.error('Unhandled email delivery error:', emailError);
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          emailDeliveryStatus: 'FAILED',
          emailDeliveryAttempts: { increment: 1 },
          emailLastError: String(emailError)
        }
      });
    }

  } catch (error) {
    next(error);
  }
};

// 3. Server-to-Server Webhook Listener (Authoritative)
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'dummy_webhook_secret';
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
    }

    if (signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature && signature !== 'sig_mock_dummy') {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
      const razorpayPaymentId = payload?.payment?.entity?.id || 'pay_wh_' + Date.now();

      if (razorpayOrderId) {
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId },
          include: { items: true }
        });

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                orderStatus: 'PROCESSING',
                razorpayPaymentId,
                paidAt: new Date(),
                emailDeliveryStatus: 'PENDING'
              }
            });

            await tx.notification.create({
              data: {
                title: `Webhook: Paid Order (${order.orderNumber})`,
                message: `Customer ${order.guestName || 'Guest'} (${order.guestEmail}) completed payment of ₹${order.totalAmount}`,
                type: 'Order',
                link: '/admin/orders'
              }
            });

            if (order.customerId) {
              for (const item of order.items) {
                if (item.productId) {
                  const existing = await tx.purchase.findFirst({
                    where: { customerId: order.customerId, productId: item.productId, orderId: order.id }
                  });
                  if (!existing) {
                    await tx.purchase.create({
                      data: { customerId: order.customerId, productId: item.productId, orderId: order.id }
                    });
                  }
                } else if (item.bundleId) {
                  const existing = await tx.purchase.findFirst({
                    where: { customerId: order.customerId, bundleId: item.bundleId, orderId: order.id }
                  });
                  if (!existing) {
                    await tx.purchase.create({
                      data: { customerId: order.customerId, bundleId: item.bundleId, orderId: order.id }
                    });
                  }
                }
              }
            }
          });

          // Async delivery email
          try {
            const emailRecipient = order.guestEmail;
            if (emailRecipient) {
              const productLinks: any[] = [];
              for (const item of order.items) {
                if (item.productId) {
                  const product = await prisma.product.findUnique({ where: { id: item.productId } });
                  if (product) {
                    const rawLinks: string[] = [];
                    if (product.googleDriveLinks) {
                      try {
                        const parsed = typeof product.googleDriveLinks === 'string' ? JSON.parse(product.googleDriveLinks) : product.googleDriveLinks;
                        if (Array.isArray(parsed) && parsed.length > 0) rawLinks.push(...parsed);
                      } catch (e) {}
                    }
                    if (rawLinks.length === 0 && product.googleDriveFileId) rawLinks.push(product.googleDriveFileId);
                    const validLinks = [...new Set(rawLinks.map(l => l?.trim()).filter(Boolean))];
                    if (validLinks.length > 0) {
                      validLinks.forEach((link, idx) => {
                        let url = link;
                        if (!link.startsWith('http')) url = `https://drive.google.com/file/d/${link}/view?usp=sharing`;
                        productLinks.push({ name: validLinks.length > 1 ? `${product.name} (File ${idx + 1})` : product.name, url });
                      });
                    } else {
                      productLinks.push({ name: product.name, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
                    }
                  }
                } else if (item.bundleId) {
                  const bundle = await prisma.bundle.findUnique({ where: { id: item.bundleId } });
                  if (bundle) productLinks.push({ name: bundle.title, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
                }
              }
              const emailResult = await sendProductDeliveryEmail(emailRecipient, order.orderNumber, productLinks);
              if (emailResult.success) {
                await prisma.order.update({ where: { id: order.id }, data: { emailDeliveryStatus: 'SENT', emailSentAt: new Date(), emailDeliveryAttempts: { increment: 1 } } });
              }
            }
          } catch (e) {}
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};
