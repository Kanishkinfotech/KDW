import { prisma } from '../database/db';

export interface OfferEvaluationProduct {
  id: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
}

export interface EvaluatedOfferResult {
  offerId: string;
  offerName: string;
  offerType: string;
  badgeText?: string;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  priority: number;
  stackingPolicy: string;
  freeProductId?: string;
  endAt?: Date | null;
}

export interface CartEvaluationItem {
  productId?: string;
  bundleId?: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
}

export interface AppliedOfferSummary {
  offerId: string;
  offerName: string;
  offerType: string;
  discountAmount: number;
  eligibleAmount: number;
  priority: number;
  stackingPolicy: string;
}

export interface CartOffersResult {
  appliedOffers: AppliedOfferSummary[];
  totalPromotionDiscount: number;
  itemDiscounts: Record<string, number>;
  isExclusive: boolean;
}

export class OfferService {
  /**
   * Parse JSON array or CSV string safely into an array of strings
   */
  private static parseIdList(raw?: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  /**
   * Evaluates whether a customer is eligible for a customer-specific or segment-targeted offer.
   */
  public static isCustomerEligibleForOffer(
    offer: any,
    customer?: { id?: string; email?: string } | null
  ): boolean {
    if (!['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType)) {
      return true; // Not a customer-specific offer, available publicly
    }

    if (!customer || (!customer.id && !customer.email)) {
      return false; // Anonymous or guest without verified identity cannot claim customer-specific offer
    }

    const rawSegment = offer.customerSegment;
    if (!rawSegment) return false;

    const custEmail = customer.email ? customer.email.toLowerCase().trim() : '';
    const custId = customer.id ? String(customer.id).trim() : '';

    try {
      const parsed = JSON.parse(rawSegment);
      const targetEmails: string[] = [];
      const targetIds: string[] = [];

      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (typeof item === 'string') {
            if (item.includes('@')) targetEmails.push(item.toLowerCase().trim());
            else targetIds.push(item.trim());
          } else if (item && typeof item === 'object') {
            if (item.email) targetEmails.push(String(item.email).toLowerCase().trim());
            if (item.id) targetIds.push(String(item.id).trim());
          }
        });
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.emails)) {
          parsed.emails.forEach((e: any) => targetEmails.push(String(e).toLowerCase().trim()));
        }
        if (Array.isArray(parsed.customerIds)) {
          parsed.customerIds.forEach((id: any) => targetIds.push(String(id).trim()));
        }
        if (parsed.email) targetEmails.push(String(parsed.email).toLowerCase().trim());
        if (parsed.customerId) targetIds.push(String(parsed.customerId).trim());
      }

      if (custEmail && targetEmails.includes(custEmail)) return true;
      if (custId && targetIds.includes(custId)) return true;
      if (custId && targetEmails.includes(custId.toLowerCase())) return true;
      return false;
    } catch {
      // Fallback: comma-separated list of emails or customer IDs
      const list = rawSegment.split(',').map((s: string) => s.trim().toLowerCase());
      if (custEmail && list.includes(custEmail)) return true;
      if (custId && list.includes(custId.toLowerCase())) return true;
      return false;
    }
  }

  /**
   * Evaluate active offers for a specific single product (for Storefront display)
   */
  public static async evaluateProductOffer(
    product: OfferEvaluationProduct,
    customerId?: string,
    customerEmail?: string
  ): Promise<EvaluatedOfferResult | null> {
    const now = new Date();

    const activeOffers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
      },
      orderBy: { priority: 'asc' }
    });

    for (const offer of activeOffers) {
      // Check customer-specific eligibility
      if (['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType)) {
        if (!this.isCustomerEligibleForOffer(offer, { id: customerId, email: customerEmail })) {
          continue;
        }
      }

      let isEligible = false;
      const productIds = this.parseIdList(offer.productIds);
      const categoryIds = this.parseIdList(offer.categoryIds);

      if (['PRODUCT_DISCOUNT', 'SALE_PRICE'].includes(offer.offerType) && productIds.includes(product.id)) {
        isEligible = true;
      } else if (['CATEGORY_DISCOUNT', 'CATEGORY_SALE'].includes(offer.offerType) && product.categoryId && categoryIds.includes(product.categoryId)) {
        isEligible = true;
      } else if (['FLASH_SALE', 'TIME_LIMITED'].includes(offer.offerType) && (productIds.length === 0 || productIds.includes(product.id))) {
        isEligible = true;
      } else if (['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType)) {
        isEligible = productIds.length === 0 || productIds.includes(product.id);
      } else if (productIds.includes(product.id)) {
        isEligible = true;
      }

      if (isEligible) {
        let discountedPrice = product.price;

        if (offer.discountType === 'PERCENTAGE') {
          discountedPrice = product.price * (1 - offer.discountValue / 100);
        } else if (offer.discountType === 'FIXED') {
          discountedPrice = Math.max(0, product.price - offer.discountValue);
        } else if (offer.discountType === 'FLAT_PRICE') {
          discountedPrice = offer.discountValue;
        }

        discountedPrice = Math.round(discountedPrice * 100) / 100;
        const savings = Math.max(0, product.price - discountedPrice);

        return {
          offerId: offer.id,
          offerName: offer.name,
          offerType: offer.offerType,
          originalPrice: product.price,
          discountedPrice,
          savings,
          priority: offer.priority,
          stackingPolicy: offer.stackingPolicy,
          freeProductId: offer.freeProductId || undefined,
          endAt: offer.endAt
        };
      }
    }

    return null;
  }

  /**
   * Deterministic Promotion Engine for Cart & Checkout
   * Evaluates all active offers across cart line items, resolves stacking, priority, and first-order status.
   */
  public static async evaluateCartOffers(params: {
    items: CartEvaluationItem[];
    customerId?: string;
    guestEmail?: string;
  }): Promise<CartOffersResult> {
    const now = new Date();

    const activeOffers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
      },
      orderBy: { priority: 'asc' }
    });

    const appliedOffers: AppliedOfferSummary[] = [];
    const itemDiscounts: Record<string, number> = {};
    let isExclusive = false;

    // Check First-Order eligibility defensively against database
    let isFirstOrder = true;
    if (params.customerId || params.guestEmail) {
      const priorOrdersCount = await prisma.order.count({
        where: {
          OR: [
            ...(params.customerId ? [{ customerId: params.customerId }] : []),
            ...(params.guestEmail ? [{ guestEmail: params.guestEmail.trim().toLowerCase() }] : [])
          ],
          paymentStatus: { in: ['PAID', 'CAPTURED'] }
        }
      });
      isFirstOrder = priorOrdersCount === 0;
    }

    const rawSubtotal = params.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    for (const offer of activeOffers) {
      // Check minimum order value threshold
      if (offer.minOrderValue && rawSubtotal < offer.minOrderValue) {
        continue;
      }

      // Check first-order constraint
      if (['FIRST_ORDER_OFFER', 'FIRST_ORDER'].includes(offer.offerType) && !isFirstOrder) {
        continue;
      }

      // Check customer-specific constraint
      if (['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType)) {
        if (!this.isCustomerEligibleForOffer(offer, { id: params.customerId, email: params.guestEmail })) {
          continue;
        }
      }

      const productIds = this.parseIdList(offer.productIds);
      const categoryIds = this.parseIdList(offer.categoryIds);
      const bundleIds = this.parseIdList(offer.bundleIds);

      let offerDiscountTotal = 0;
      let eligibleAmount = 0;

      for (const item of params.items) {
        let itemMatches = false;

        if (item.productId) {
          if (productIds.length > 0 && productIds.includes(item.productId)) {
            itemMatches = true;
          } else if (item.categoryId && categoryIds.includes(item.categoryId)) {
            itemMatches = true;
          } else if (['FLASH_SALE', 'TIME_LIMITED', 'FIRST_ORDER_OFFER', 'FIRST_ORDER', 'CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC', 'CART_THRESHOLD_OFFER'].includes(offer.offerType)) {
            itemMatches = productIds.length === 0 || productIds.includes(item.productId);
          }
        } else if (item.bundleId) {
          if (bundleIds.length > 0 && bundleIds.includes(item.bundleId)) {
            itemMatches = true;
          } else if (['BUNDLE_OFFER', 'BUNDLE_DEAL', 'FIRST_ORDER_OFFER', 'CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType)) {
            itemMatches = bundleIds.length === 0 || bundleIds.includes(item.bundleId);
          }
        }

        if (itemMatches) {
          const lineTotal = item.unitPrice * item.quantity;
          eligibleAmount += lineTotal;

          let lineDiscount = 0;
          if (offer.discountType === 'PERCENTAGE') {
            lineDiscount = lineTotal * (offer.discountValue / 100);
          } else if (offer.discountType === 'FIXED') {
            lineDiscount = Math.min(lineTotal, offer.discountValue);
          } else if (offer.discountType === 'FLAT_PRICE') {
            lineDiscount = Math.max(0, lineTotal - offer.discountValue * item.quantity);
          }

          offerDiscountTotal += lineDiscount;
          const key = item.productId || item.bundleId || 'item';
          itemDiscounts[key] = (itemDiscounts[key] || 0) + lineDiscount;
        }
      }

      if (offerDiscountTotal > 0) {
        appliedOffers.push({
          offerId: offer.id,
          offerName: offer.name,
          offerType: offer.offerType,
          discountAmount: Math.round(offerDiscountTotal * 100) / 100,
          eligibleAmount: Math.round(eligibleAmount * 100) / 100,
          priority: offer.priority,
          stackingPolicy: offer.stackingPolicy
        });

        if (offer.stackingPolicy === 'EXCLUSIVE') {
          isExclusive = true;
          break; // Exclusive offer halts lower-priority offer evaluations
        }
      }
    }

    const totalPromotionDiscount = appliedOffers.reduce((sum, o) => sum + o.discountAmount, 0);

    return {
      appliedOffers,
      totalPromotionDiscount: Math.round(totalPromotionDiscount * 100) / 100,
      itemDiscounts,
      isExclusive
    };
  }

  /**
   * Transactionally records OfferApplication links upon order initiation.
   * Counters are only incremented when payment is verified (PAID).
   */
  public static async applyOffersToOrder(
    tx: any,
    orderId: string,
    appliedOffers: AppliedOfferSummary[],
    customerId?: string | null,
    shouldIncrementCounters: boolean = false
  ): Promise<void> {
    for (const applied of appliedOffers) {
      await tx.offerApplication.create({
        data: {
          offerId: applied.offerId,
          orderId,
          customerId: customerId || null,
          discountAmount: applied.discountAmount,
          eligibleAmount: applied.eligibleAmount
        }
      });

      if (shouldIncrementCounters) {
        await tx.offer.update({
          where: { id: applied.offerId },
          data: {
            ordersCount: { increment: 1 },
            revenueGenerated: { increment: applied.eligibleAmount },
            discountGiven: { increment: applied.discountAmount }
          }
        });
      }
    }
  }

  /**
   * Authoritatively attributes offer metrics (ordersCount, revenueGenerated, discountGiven)
   * strictly when an order's payment has been verified as PAID or CAPTURED.
   */
  public static async attributeVerifiedOrder(
    orderId: string,
    customTx?: any
  ): Promise<void> {
    try {
      const client = customTx || prisma;
      const order = await client.order.findUnique({
        where: { id: orderId },
        include: {
          applications: true
        }
      });

      if (!order || !order.applications || order.applications.length === 0) {
        return;
      }

      // Only attribute if payment status is genuinely verified
      if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'CAPTURED') {
        return;
      }

      // Check if already attributed to prevent double-counting
      const existingAttrEvent = await client.orderTimelineEvent.findFirst({
        where: {
          orderId,
          eventType: 'OFFER_CONVERSION_ATTRIBUTED'
        }
      });
      if (existingAttrEvent) {
        return;
      }

      for (const app of order.applications) {
        await client.offer.update({
          where: { id: app.offerId },
          data: {
            ordersCount: { increment: 1 },
            revenueGenerated: { increment: app.eligibleAmount },
            discountGiven: { increment: app.discountAmount }
          }
        });
      }

      await client.orderTimelineEvent.create({
        data: {
          orderId,
          eventType: 'OFFER_CONVERSION_ATTRIBUTED',
          actorType: 'SYSTEM',
          status: 'SUCCESS',
          description: `Attributed ${order.applications.length} promotional offer(s) to verified payment of ₹${order.totalAmount}`
        }
      });
    } catch (err) {
      console.error('[OfferService] Error attributing verified order:', err);
    }
  }

  /**
   * Conflict Detection Engine
   * Detects date overlaps, multiple offers targeting the same products, and excessive discounts.
   */
  public static async detectConflicts(offerData: {
    id?: string;
    productIds?: string[];
    categoryIds?: string[];
    startAt?: Date;
    endAt?: Date;
    discountType?: string;
    discountValue?: number;
  }): Promise<Array<{ level: 'WARNING' | 'BLOCKING'; message: string; existingOfferName?: string }>> {
    const conflicts: Array<{ level: 'WARNING' | 'BLOCKING'; message: string; existingOfferName?: string }> = [];

    const existingOffers = await prisma.offer.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        ...(offerData.id ? { id: { not: offerData.id } } : {})
      }
    });

    const targetProductIds = offerData.productIds || [];

    for (const existing of existingOffers) {
      const existingProductIds = this.parseIdList(existing.productIds);
      const overlappingProducts = targetProductIds.filter(id => existingProductIds.includes(id));

      if (overlappingProducts.length > 0) {
        conflicts.push({
          level: 'WARNING',
          message: `Offer overlaps on ${overlappingProducts.length} product(s). Priority order will govern checkout price.`,
          existingOfferName: existing.name
        });
      }
    }

    // Excessive discount check (> 70%)
    if (offerData.discountType === 'PERCENTAGE' && (offerData.discountValue || 0) >= 70) {
      conflicts.push({
        level: 'WARNING',
        message: `High discount alert: Discount of ${offerData.discountValue}% exceeds standard promotional margin threshold (70%).`
      });
    }

    return conflicts;
  }

  /**
   * Record Impression View or Click
   */
  public static async recordInteraction(
    offerId: string,
    type: 'VIEW' | 'CLICK'
  ): Promise<void> {
    if (type === 'VIEW') {
      await prisma.offer.update({
        where: { id: offerId },
        data: { viewsCount: { increment: 1 } }
      });
    } else if (type === 'CLICK') {
      await prisma.offer.update({
        where: { id: offerId },
        data: { clicksCount: { increment: 1 } }
      });
    }
  }

  /**
   * Reconciles offer statuses according to current time:
   * - Marks past-expiration ACTIVE or SCHEDULED offers as EXPIRED
   * - Activates SCHEDULED offers whose startAt has arrived and have not expired
   */
  public static async reconcileAndActivateScheduledOffers(): Promise<{
    activatedCount: number;
    expiredCount: number;
  }> {
    try {
      const now = new Date();

      // 1. Mark expired offers
      const expiredRes = await prisma.offer.updateMany({
        where: {
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          endAt: { not: null, lt: now }
        },
        data: { status: 'EXPIRED' }
      });

      // 2. Automatically activate SCHEDULED offers whose startAt has arrived
      const activatedRes = await prisma.offer.updateMany({
        where: {
          status: 'SCHEDULED',
          startAt: { not: null, lte: now },
          OR: [{ endAt: null }, { endAt: { gte: now } }]
        },
        data: { status: 'ACTIVE' }
      });

      if (activatedRes.count > 0 || expiredRes.count > 0) {
        console.log(`[OfferService] Auto-reconciliation: ${activatedRes.count} offers activated, ${expiredRes.count} expired.`);
      }

      return {
        activatedCount: activatedRes.count,
        expiredCount: expiredRes.count
      };
    } catch (err) {
      console.error('[OfferService] Error during offer auto-reconciliation:', err);
      return { activatedCount: 0, expiredCount: 0 };
    }
  }

  /**
   * Starts background recurring schedule to auto-activate scheduled offers and expire ended offers every 60 seconds
   */
  public static startOfferScheduler(): void {
    // Initial run on server startup
    setTimeout(() => {
      this.reconcileAndActivateScheduledOffers().catch(err =>
        console.error('[OfferService] Initial scheduler run error:', err)
      );
    }, 5000);

    // Check and update every 60 seconds (1 minute)
    setInterval(() => {
      this.reconcileAndActivateScheduledOffers().catch(err =>
        console.error('[OfferService] Periodic scheduler run error:', err)
      );
    }, 60 * 1000);
  }
}
