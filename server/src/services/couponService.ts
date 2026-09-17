import { prisma } from '../database/db';

export interface CouponValidationInput {
  code: string;
  customerId?: string;
  guestEmail?: string;
  guestPhone?: string;
  cartItems: Array<{
    productId?: string;
    bundleId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  ipAddress?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  calculatedDiscount: number;
  message: string;
  eligibleItemIds?: string[];
  freeProductId?: string;
  freeProduct?: { id: string; name: string; price: number; thumbnail?: string | null; slug?: string | null };
  affiliateId?: string;
  stackingPolicy?: string;
  durationBadge?: string;
  durationLabel?: string;
  isPermanent?: boolean;
  isFirstOrder?: boolean;
  minOrderValue?: number;
}

export class CouponService {
  /**
   * Normalizes coupon code to uppercase and trims whitespace.
   */
  public static normalizeCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  /**
   * Comprehensive Server-Side Coupon Validation
   */
  public static async validateCoupon(input: CouponValidationInput): Promise<CouponValidationResult> {
    const normalizedCode = this.normalizeCode(input.code);

    if (!normalizedCode) {
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'Please enter a coupon code.' };
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
      include: {
        campaign: true,
        redemptions: {
          where: { status: 'REDEEMED' }
        }
      }
    });

    if (!coupon) {
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'Invalid coupon code.' };
    }

    // 1. Status Check
    const now = new Date();
    if (coupon.status === 'PAUSED') {
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'This coupon is currently paused.' };
    }
    if (coupon.status === 'DISABLED' || coupon.status === 'DRAFT') {
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'This coupon is inactive.' };
    }

    // 2. Date Window Check
    if (coupon.startAt && now < new Date(coupon.startAt)) {
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'This coupon is not active yet.' };
    }
    if (coupon.endAt && now > new Date(coupon.endAt)) {
      // Auto-update status to EXPIRED if past end date
      await prisma.coupon.update({ where: { id: coupon.id }, data: { status: 'EXPIRED' } });
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'This coupon has expired.' };
    }

    // 3. Global Usage Limit
    if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
      await prisma.coupon.update({ where: { id: coupon.id }, data: { status: 'EXHAUSTED' } });
      return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'This coupon has reached its maximum usage limit.' };
    }

    // 4. Per-Customer & Per-Email Usage Limit
    const targetEmail = input.guestEmail?.trim().toLowerCase();
    const targetCustomerId = input.customerId;

    if (targetCustomerId || targetEmail) {
      const customerRedemptions = await prisma.couponRedemption.count({
        where: {
          couponId: coupon.id,
          status: 'REDEEMED',
          OR: [
            ...(targetCustomerId ? [{ customerId: targetCustomerId }] : []),
            ...(targetEmail ? [{ guestEmail: targetEmail }] : [])
          ]
        }
      });

      const perCustomerLimit = coupon.perCustomerLimit || 1;
      if (customerRedemptions >= perCustomerLimit) {
        return {
          valid: false,
          code: normalizedCode,
          calculatedDiscount: 0,
          message: `You have already redeemed this coupon the maximum allowed times (${perCustomerLimit}).`
        };
      }
    }

    // 5. Abuse Signals Screening (Rapid submissions / Suspicious IPs)
    if (input.ipAddress) {
      const recentAbuse = await this.screenAbuseSignals(coupon.id, input);
      if (recentAbuse.blocked) {
        return { valid: false, code: normalizedCode, calculatedDiscount: 0, message: 'Coupon application temporarily restricted due to suspicious activity.' };
      }
    }

    // 6. Subtotal Calculation & Minimum Order Value Check
    const totalSubtotal = input.cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const minOrderVal = coupon.minOrderValue || 0;

    if (totalSubtotal < minOrderVal) {
      return {
        valid: false,
        code: normalizedCode,
        calculatedDiscount: 0,
        message: `Minimum order value of ₹${minOrderVal.toLocaleString('en-IN')} required for this coupon (Current: ₹${totalSubtotal.toLocaleString('en-IN')}).`
      };
    }

    // 7. Evaluate Specific Coupon Type Rules
    let eligibleSubtotal = 0;
    const eligibleItemIds: string[] = [];

    // Parse eligibility JSON strings
    let eligibleProductIds: string[] = [];
    let excludedProductIds: string[] = [];
    let eligibleCategoryIds: string[] = [];
    let eligibleBundleIds: string[] = [];
    let eligibleCustomerSegments: string[] = [];

    try {
      if (coupon.eligibleProducts) eligibleProductIds = JSON.parse(coupon.eligibleProducts);
      if (coupon.excludedProducts) excludedProductIds = JSON.parse(coupon.excludedProducts);
      if (coupon.eligibleCategories) eligibleCategoryIds = JSON.parse(coupon.eligibleCategories);
      if (coupon.eligibleBundles) eligibleBundleIds = JSON.parse(coupon.eligibleBundles);
      if (coupon.eligibleCustomerSegments) eligibleCustomerSegments = JSON.parse(coupon.eligibleCustomerSegments);
    } catch {
      // String fallback if comma-separated
      if (coupon.eligibleProducts) eligibleProductIds = coupon.eligibleProducts.split(',').map(s => s.trim());
      if (coupon.excludedProducts) excludedProductIds = coupon.excludedProducts.split(',').map(s => s.trim());
      if (coupon.eligibleCategories) eligibleCategoryIds = coupon.eligibleCategories.split(',').map(s => s.trim());
      if (coupon.eligibleBundles) eligibleBundleIds = coupon.eligibleBundles.split(',').map(s => s.trim());
    }

    // A. FIRST_ORDER Check
    if (coupon.discountType === 'FIRST_ORDER') {
      const hasPriorPaidOrder = await this.checkPriorPaidOrders(targetCustomerId, targetEmail);
      if (hasPriorPaidOrder) {
        return {
          valid: false,
          code: normalizedCode,
          calculatedDiscount: 0,
          message: 'This coupon is valid only on your first successful purchase.'
        };
      }
      eligibleSubtotal = totalSubtotal;
    }
    // B. CUSTOMER_SEGMENT Check
    else if (coupon.discountType === 'CUSTOMER_SEGMENT') {
      const isEligibleSegment = await this.checkCustomerSegmentEligibility(targetCustomerId, targetEmail, eligibleCustomerSegments);
      if (!isEligibleSegment) {
        return {
          valid: false,
          code: normalizedCode,
          calculatedDiscount: 0,
          message: 'Your account is not eligible for this targeted segment coupon.'
        };
      }
      eligibleSubtotal = totalSubtotal;
    }
    // C. PRODUCT_SPECIFIC Check
    else if (coupon.discountType === 'PRODUCT_SPECIFIC') {
      input.cartItems.forEach(item => {
        if (item.productId && eligibleProductIds.includes(item.productId) && !excludedProductIds.includes(item.productId)) {
          eligibleSubtotal += item.quantity * item.unitPrice;
          eligibleItemIds.push(item.productId);
        }
      });

      if (eligibleSubtotal <= 0) {
        return {
          valid: false,
          code: normalizedCode,
          calculatedDiscount: 0,
          message: 'None of the items in your cart qualify for this product-specific coupon.'
        };
      }
    }
    // D. CATEGORY_SPECIFIC Check
    else if (coupon.discountType === 'CATEGORY_SPECIFIC') {
      const productIds = input.cartItems.map(i => i.productId).filter(Boolean) as string[];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true }
      });

      const subcategories = await prisma.category.findMany({
        where: { parentId: { in: eligibleCategoryIds } },
        select: { id: true }
      });
      const allEligibleCatIds = new Set([...eligibleCategoryIds, ...subcategories.map(c => c.id)]);
      const categoryMap = new Map(products.map(p => [p.id, p.categoryId]));

      input.cartItems.forEach(item => {
        if (item.productId) {
          const catId = categoryMap.get(item.productId);
          if (catId && allEligibleCatIds.has(catId) && !excludedProductIds.includes(item.productId)) {
            eligibleSubtotal += item.quantity * item.unitPrice;
            eligibleItemIds.push(item.productId);
          }
        }
      });

      if (eligibleSubtotal <= 0) {
        return {
          valid: false,
          code: normalizedCode,
          calculatedDiscount: 0,
          message: 'None of the items in your cart match the eligible categories for this coupon.'
        };
      }
    }
    // E. BUNDLE_SPECIFIC Check
    else if (coupon.discountType === 'BUNDLE_SPECIFIC') {
      input.cartItems.forEach(item => {
        if (item.bundleId && (eligibleBundleIds.length === 0 || eligibleBundleIds.includes(item.bundleId))) {
          eligibleSubtotal += item.quantity * item.unitPrice;
          eligibleItemIds.push(item.bundleId);
        }
      });

      if (eligibleSubtotal <= 0) {
        return {
          valid: false,
          code: normalizedCode,
          calculatedDiscount: 0,
          message: 'This coupon can only be applied to qualifying bundle packages.'
        };
      }
    }
    // F. FREE_PRODUCT / ADD-ON
    else if (coupon.discountType === 'FREE_PRODUCT') {
      eligibleSubtotal = totalSubtotal;
    }
    // G. Default / PERCENTAGE / FIXED / AFFILIATE
    else {
      // Exclude excluded products from subtotal
      input.cartItems.forEach(item => {
        if (!item.productId || !excludedProductIds.includes(item.productId)) {
          eligibleSubtotal += item.quantity * item.unitPrice;
        }
      });
    }

    // 8. Calculate Discount Value
    let calculatedDiscount = 0;
    let freeProductData: any = undefined;

    if (coupon.discountType === 'FREE_PRODUCT') {
      if (coupon.freeProductId) {
        const fp = await prisma.product.findUnique({
          where: { id: coupon.freeProductId },
          select: { id: true, name: true, price: true, thumbnail: true, slug: true }
        });
        if (fp) {
          freeProductData = fp;
          const freeInCart = input.cartItems.find(i => i.productId === fp.id);
          if (freeInCart) {
            calculatedDiscount = Math.min(freeInCart.unitPrice, totalSubtotal);
          }
        }
      }
    } else if (coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'FIRST_ORDER' || coupon.discountType === 'CUSTOMER_SEGMENT') {
      calculatedDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'FIXED' || coupon.discountType === 'BUNDLE_SPECIFIC' || coupon.discountType === 'AFFILIATE') {
      calculatedDiscount = Math.min(coupon.discountValue, eligibleSubtotal);
    } else if (coupon.discountType === 'PRODUCT_SPECIFIC' || coupon.discountType === 'CATEGORY_SPECIFIC') {
      if (coupon.discountValue <= 100) {
        calculatedDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
          calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscountAmount);
        }
      } else {
        calculatedDiscount = Math.min(coupon.discountValue, eligibleSubtotal);
      }
    }

    // Ensure discount never exceeds total subtotal or makes total negative
    calculatedDiscount = Math.max(0, Math.min(calculatedDiscount, totalSubtotal));
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    // Duration metadata computation
    let isPermanent = !coupon.endAt;
    let durationBadge = 'Permanent';
    let durationLabel = 'Permanent / No Expiration';

    if (coupon.endAt) {
      const startMs = coupon.startAt ? new Date(coupon.startAt).getTime() : new Date(coupon.createdAt).getTime();
      const endMs = new Date(coupon.endAt).getTime();
      const totalSpanDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)));

      if (totalSpanDays <= 8) {
        durationBadge = '1 Week Limited';
      } else if (totalSpanDays <= 32) {
        durationBadge = '1 Month Limited';
      } else {
        durationBadge = 'Limited Time';
      }

      durationLabel = daysRemaining > 0 
        ? `${durationBadge} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left)`
        : 'Expiring today';
    }

    const customMessage = calculatedDiscount > 0
      ? `Coupon "${coupon.code}" applied! You save ₹${calculatedDiscount.toLocaleString('en-IN')}.`
      : freeProductData
        ? `🎁 Free gift "${freeProductData.name}" unlocked with coupon "${coupon.code}"!`
        : `Coupon "${coupon.code}" applied successfully.`;

    return {
      valid: true,
      code: normalizedCode,
      couponId: coupon.id,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount,
      eligibleItemIds,
      freeProductId: coupon.freeProductId || undefined,
      freeProduct: freeProductData,
      affiliateId: coupon.affiliateId || undefined,
      stackingPolicy: coupon.stackingPolicy,
      durationBadge,
      durationLabel,
      isPermanent,
      isFirstOrder: coupon.discountType === 'FIRST_ORDER',
      minOrderValue: coupon.minOrderValue || 0,
      message: customMessage
    };
  }

  /**
   * Check if customer or email has previous paid order or claimed first-order coupon
   */
  public static async checkPriorPaidOrders(customerId?: string, email?: string): Promise<boolean> {
    const conditions: any[] = [];
    if (customerId) {
      conditions.push({ customerId });
      try {
        const user = await prisma.user.findUnique({ where: { id: customerId }, select: { email: true } });
        if (user?.email) {
          conditions.push({ guestEmail: { equals: user.email.trim(), mode: 'insensitive' } });
        }
      } catch {
        // ignore
      }
    }
    if (email && email.trim()) {
      const trimmedEmail = email.trim();
      conditions.push({ guestEmail: { equals: trimmedEmail, mode: 'insensitive' } });
      try {
        const user = await prisma.user.findUnique({ where: { email: trimmedEmail.toLowerCase() }, select: { id: true } });
        if (user?.id) {
          conditions.push({ customerId: user.id });
        }
      } catch {
        // ignore
      }
    }

    if (conditions.length === 0) return false;

    // Check PAID or CAPTURED orders
    const paidOrderCount = await prisma.order.count({
      where: {
        paymentStatus: { in: ['PAID', 'CAPTURED'] },
        OR: conditions
      }
    });

    if (paidOrderCount > 0) return true;

    // Check prior redemption or active reservation for any FIRST_ORDER coupon
    const redemptionConditions: any[] = [];
    if (customerId) redemptionConditions.push({ customerId });
    if (email && email.trim()) redemptionConditions.push({ guestEmail: { equals: email.trim(), mode: 'insensitive' } });

    if (redemptionConditions.length > 0) {
      const priorFirstOrderRedemption = await prisma.couponRedemption.findFirst({
        where: {
          status: { in: ['REDEEMED', 'RESERVED'] },
          coupon: { discountType: 'FIRST_ORDER' },
          OR: redemptionConditions
        }
      });
      if (priorFirstOrderRedemption) return true;
    }

    return false;
  }

  /**
   * Check dynamic customer segment eligibility & direct customer/email targets
   */
  public static async checkCustomerSegmentEligibility(customerId?: string, email?: string, segments: string[] = []): Promise<boolean> {
    if ((!customerId && !email) || segments.length === 0) return false;

    const normalizedEmail = (email || '').toLowerCase().trim();

    // 1. Check direct ID or Email matches in segments
    for (const rawSeg of segments) {
      const seg = (rawSeg || '').trim();
      if (customerId && seg === customerId) return true;
      if (normalizedEmail && seg.toLowerCase() === normalizedEmail) return true;
    }

    let customer: any = null;
    if (customerId) {
      customer = await prisma.user.findUnique({
        where: { id: customerId },
        include: {
          orders: { where: { paymentStatus: 'PAID' } },
          bundleEntitlements: true
        }
      });
    } else if (normalizedEmail) {
      customer = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          orders: { where: { paymentStatus: 'PAID' } },
          bundleEntitlements: true
        }
      });
    }

    if (!customer) return false;

    // Check if customer email or ID was in segments
    for (const rawSeg of segments) {
      const seg = (rawSeg || '').trim();
      if (seg === customer.id || (customer.email && seg.toLowerCase() === customer.email.toLowerCase())) {
        return true;
      }
    }

    const paidOrders = customer.orders || [];
    const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    for (const rawSeg of segments) {
      const segment = (rawSeg || '').toUpperCase().trim();
      if ((segment === 'RETURNING_CUSTOMERS' || segment === 'RETURNING') && paidOrders.length >= 1) return true;
      if ((segment === 'NEW_CUSTOMERS' || segment === 'NEW') && paidOrders.length === 0) return true;
      if ((segment === 'HIGH_VALUE' || segment === 'HIGH_VALUE_CUSTOMERS') && (totalSpent >= 5000 || paidOrders.length >= 3)) return true;
      if ((segment === 'VIP' || segment === 'VIPS') && (totalSpent >= 10000 || customer.role === 'VIP')) return true;
      if ((segment === 'STUDENTS' || segment === 'STUDENT') && customer.customerType === 'STUDENT') return true;
      if ((segment === 'AGENCY' || segment === 'AGENCIES') && (customer.customerType === 'AGENCY' || customer.bundleEntitlements.some((e: any) => e.licenceType === 'AGENCY'))) return true;
    }

    return false;
  }

  /**
   * Abuse screening helper
   */
  private static async screenAbuseSignals(couponId: string, input: CouponValidationInput): Promise<{ blocked: boolean }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSubmissions = await prisma.couponAbuseLog.count({
      where: {
        couponId,
        ipAddress: input.ipAddress,
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    if (recentSubmissions >= 15) {
      return { blocked: true };
    }

    return { blocked: false };
  }

  /**
   * Reserve a coupon upon checkout initiation
   */
  public static async reserveCoupon(couponId: string, orderId: string, discountAmount: number, customerId?: string, guestEmail?: string): Promise<any> {
    // Expire reservations older than 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await prisma.couponRedemption.updateMany({
      where: {
        couponId,
        status: 'RESERVED',
        reservedAt: { lt: thirtyMinsAgo }
      },
      data: { status: 'EXPIRED' }
    });

    return prisma.couponRedemption.create({
      data: {
        couponId,
        orderId,
        customerId,
        guestEmail,
        discountAmount,
        status: 'RESERVED',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });
  }

  /**
   * Authoritative Redemption on Payment Capture
   */
  public static async redeemCoupon(orderId: string): Promise<any> {
    const redemption = await prisma.couponRedemption.findFirst({
      where: { orderId, status: 'RESERVED' },
      include: { coupon: true }
    });

    if (!redemption) return null;

    const updated = await prisma.$transaction([
      prisma.couponRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date()
        }
      }),
      prisma.coupon.update({
        where: { id: redemption.couponId },
        data: {
          usedCount: { increment: 1 }
        }
      })
    ]);

    // Check if total limit reached
    const coupon = updated[1];
    if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: 'EXHAUSTED' }
      });
    }

    return updated[0];
  }

  /**
   * Release coupon when unpaid order is cancelled
   */
  public static async releaseCoupon(orderId: string): Promise<any> {
    return prisma.couponRedemption.updateMany({
      where: { orderId, status: 'RESERVED' },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      }
    });
  }

  /**
   * Reverse coupon on order refund (if policy permits)
   */
  public static async reverseCoupon(orderId: string, restoreUsage: boolean = false): Promise<any> {
    const redemption = await prisma.couponRedemption.findFirst({
      where: { orderId, status: 'REDEEMED' }
    });

    if (!redemption) return null;

    await prisma.couponRedemption.update({
      where: { id: redemption.id },
      data: {
        status: 'REVERSED',
        reversedAt: new Date()
      }
    });

    if (restoreUsage) {
      await prisma.coupon.update({
        where: { id: redemption.couponId },
        data: {
          usedCount: { decrement: 1 }
        }
      });
    }
  }

  /**
   * Automatically reconciles coupons:
   * - Sets past-expiration coupons to EXPIRED
   * - Sets scheduled coupons whose startAt has arrived to ACTIVE
   */
  public static async reconcileAndActivateScheduledCoupons(): Promise<{
    activatedCount: number;
    expiredCount: number;
  }> {
    try {
      const now = new Date();

      // Expire coupons past end date
      const expiredRes = await prisma.coupon.updateMany({
        where: {
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          endAt: { not: null, lt: now }
        },
        data: { status: 'EXPIRED' }
      });

      // Activate scheduled coupons whose startAt has arrived
      const activatedRes = await prisma.coupon.updateMany({
        where: {
          status: 'SCHEDULED',
          startAt: { not: null, lte: now },
          OR: [{ endAt: null }, { endAt: { gte: now } }]
        },
        data: { status: 'ACTIVE' }
      });

      return {
        activatedCount: activatedRes.count,
        expiredCount: expiredRes.count
      };
    } catch (err) {
      console.error('[CouponService] Error in coupon auto-reconciliation:', err);
      return { activatedCount: 0, expiredCount: 0 };
    }
  }

  /**
   * Background schedule for coupons every 60 seconds
   */
  public static startCouponScheduler(): void {
    setTimeout(() => {
      this.reconcileAndActivateScheduledCoupons().catch(err =>
        console.error('[CouponService] Initial coupon scheduler run error:', err)
      );
    }, 6000);

    setInterval(() => {
      this.reconcileAndActivateScheduledCoupons().catch(err =>
        console.error('[CouponService] Periodic coupon scheduler run error:', err)
      );
    }, 60 * 1000);
  }
}
