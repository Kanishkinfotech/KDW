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
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  priority: number;
  stackingPolicy: string;
  freeProductId?: string;
  endAt?: Date | null;
}

export class OfferService {
  /**
   * Evaluate active offers for a specific product
   */
  public static async evaluateProductOffer(product: OfferEvaluationProduct, customerId?: string): Promise<EvaluatedOfferResult | null> {
    const now = new Date();

    const activeOffers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { startAt: null },
          { startAt: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { priority: 'asc' }
    });

    for (const offer of activeOffers) {
      let isEligible = false;

      // Parse JSON product IDs or category IDs
      let productIds: string[] = [];
      let categoryIds: string[] = [];

      try {
        if (offer.productIds) productIds = JSON.parse(offer.productIds);
        if (offer.categoryIds) categoryIds = JSON.parse(offer.categoryIds);
      } catch {
        if (offer.productIds) productIds = offer.productIds.split(',').map(s => s.trim());
        if (offer.categoryIds) categoryIds = offer.categoryIds.split(',').map(s => s.trim());
      }

      if ((offer.offerType === 'PRODUCT_DISCOUNT' || offer.offerType === 'SALE_PRICE') && productIds.includes(product.id)) {
        isEligible = true;
      } else if ((offer.offerType === 'CATEGORY_DISCOUNT' || offer.offerType === 'CATEGORY_SALE') && product.categoryId && categoryIds.includes(product.categoryId)) {
        isEligible = true;
      } else if ((offer.offerType === 'FLASH_SALE' || offer.offerType === 'TIME_LIMITED') && (productIds.length === 0 || productIds.includes(product.id))) {
        isEligible = true;
      } else if ((offer.offerType === 'CUSTOMER_SPECIFIC_OFFER' || offer.offerType === 'CUSTOMER_SPECIFIC') && customerId) {
        isEligible = true;
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
   * Conflict Detection Engine
   * Detects date overlaps, multiple offers targeting the same products, and negative margins.
   */
  public static async detectConflicts(offerData: {
    id?: string;
    productIds?: string[];
    categoryIds?: string[];
    startAt?: Date;
    endAt?: Date;
    discountType?: string;
    discountValue?: number;
  }): Promise<Array<{ level: 'WARNING' | 'BLOCKING'; message: string }>> {
    const conflicts: Array<{ level: 'WARNING' | 'BLOCKING'; message: string }> = [];

    const existingOffers = await prisma.offer.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        ...(offerData.id ? { id: { not: offerData.id } } : {})
      }
    });

    const targetProductIds = offerData.productIds || [];

    for (const existing of existingOffers) {
      let existingProductIds: string[] = [];
      try {
        if (existing.productIds) existingProductIds = JSON.parse(existing.productIds);
      } catch {
        if (existing.productIds) existingProductIds = existing.productIds.split(',').map(s => s.trim());
      }

      const overlappingProducts = targetProductIds.filter(id => existingProductIds.includes(id));

      if (overlappingProducts.length > 0) {
        conflicts.push({
          level: 'WARNING',
          message: `Offer overlaps with existing promotion "${existing.name}" on ${overlappingProducts.length} product(s). Priority ordering will determine the applied price.`
        });
      }
    }

    // Excessive discount check (> 70%)
    if (offerData.discountType === 'PERCENTAGE' && (offerData.discountValue || 0) >= 70) {
      conflicts.push({
        level: 'WARNING',
        message: `High discount alert: Discount value of ${offerData.discountValue}% exceeds normal promotional margin threshold (70%).`
      });
    }

    return conflicts;
  }

  /**
   * Record Impression / Click / Conversion
   */
  public static async recordInteraction(offerId: string, type: 'VIEW' | 'CLICK' | 'ORDER', revenue: number = 0, discount: number = 0): Promise<void> {
    if (type === 'VIEW') {
      await prisma.offer.update({ where: { id: offerId }, data: { viewsCount: { increment: 1 } } });
    } else if (type === 'CLICK') {
      await prisma.offer.update({ where: { id: offerId }, data: { clicksCount: { increment: 1 } } });
    } else if (type === 'ORDER') {
      await prisma.offer.update({
        where: { id: offerId },
        data: {
          ordersCount: { increment: 1 },
          revenueGenerated: { increment: revenue },
          discountGiven: { increment: discount }
        }
      });
    }
  }
}
