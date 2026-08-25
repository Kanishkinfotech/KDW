import { prisma } from '../database/db';
import crypto from 'crypto';

export interface ReviewSubmissionInput {
  productId: string;
  productVersion?: string;
  orderId?: string;
  customerId?: string;
  guestName?: string;
  guestEmail?: string;
  guestReviewToken?: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  images?: string[];
  videos?: string[];
}

export class ReviewService {
  /**
   * Determine if review is from a verified purchase with active entitlement
   */
  public static async verifyPurchase(input: {
    productId: string;
    customerId?: string;
    guestEmail?: string;
    orderId?: string;
  }): Promise<{ verified: boolean; method?: string; orderId?: string }> {
    // 1. Direct OrderId check
    if (input.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { items: true }
      });

      if (order && order.paymentStatus === 'PAID') {
        const hasItem = order.items.some(i => i.productId === input.productId);
        if (hasItem) {
          return { verified: true, method: 'PAID_ORDER_ENTITLEMENT', orderId: order.id };
        }
      }
    }

    // 2. Customer ID check
    if (input.customerId) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          customerId: input.customerId,
          productId: input.productId,
          accessStatus: { in: ['ACTIVE', 'LIFETIME'] }
        }
      });

      if (purchase) {
        return { verified: true, method: 'PAID_ORDER_ENTITLEMENT', orderId: purchase.orderId || undefined };
      }
    }

    // 3. Guest Email check
    if (input.guestEmail) {
      const paidOrder = await prisma.order.findFirst({
        where: {
          guestEmail: { equals: input.guestEmail.trim(), mode: 'insensitive' },
          paymentStatus: 'PAID',
          items: { some: { productId: input.productId } }
        }
      });

      if (paidOrder) {
        return { verified: true, method: 'ORDER_TOKEN', orderId: paidOrder.id };
      }
    }

    return { verified: false };
  }

  /**
   * Automated Content & Spam Risk Classification
   */
  public static screenReviewContent(title: string, comment: string): { riskScore: string; reason?: string } {
    const text = `${title} ${comment}`.toLowerCase();

    // 1. Profanity & Threat Filter
    const profanities = ['scam', 'fraud', 'cheat', 'fake', 'stolen', 'abuse', 'fuck', 'shit', 'bastard'];
    const matchedProfanity = profanities.find(p => text.includes(p));
    if (matchedProfanity) {
      return { riskScore: 'PROFANITY_FLAGGED', reason: `Matched flagged term: "${matchedProfanity}"` };
    }

    // 2. Competitor URLs / Links
    if (/https?:\/\/[^\s]+/i.test(text) || /www\.[^\s]+/i.test(text)) {
      return { riskScore: 'SPAM_FLAGGED', reason: 'Review contains external links or URLs' };
    }

    // 3. Repetitive characters / All caps spam
    if (/(.)\1{5,}/.test(text) || (title.length > 10 && title === title.toUpperCase())) {
      return { riskScore: 'SUSPICIOUS', reason: 'Unusual character patterns or all-caps format' };
    }

    return { riskScore: 'NORMAL' };
  }

  /**
   * Submit a Customer / Guest Review
   */
  public static async submitReview(input: ReviewSubmissionInput): Promise<any> {
    const verification = await this.verifyPurchase({
      productId: input.productId,
      customerId: input.customerId,
      guestEmail: input.guestEmail,
      orderId: input.orderId
    });

    const risk = this.screenReviewContent(input.title, input.comment);

    // Auto-approve if verified purchase and clean risk score
    const autoPublish = verification.verified && risk.riskScore === 'NORMAL';
    const status = autoPublish ? 'PUBLISHED' : 'PENDING';

    const customerName = input.guestName || 'KDW Customer';

    const review = await prisma.review.create({
      data: {
        productId: input.productId,
        productVersion: input.productVersion || '1.0.0',
        orderId: verification.orderId || input.orderId,
        customerId: input.customerId,
        customerName,
        customerEmail: input.guestEmail,
        rating: Math.max(1, Math.min(5, input.rating)),
        title: input.title,
        comment: input.comment,
        pros: input.pros,
        cons: input.cons,
        verifiedPurchase: verification.verified,
        verificationMethod: verification.method,
        status,
        riskScore: risk.riskScore,
        moderationReason: risk.reason,
        publishedAt: autoPublish ? new Date() : null,
        images: input.images ? JSON.stringify(input.images) : null,
        videos: input.videos ? JSON.stringify(input.videos) : null,
        guestReviewToken: input.guestReviewToken
      }
    });

    // If review submitted from a review request token, update request status
    if (input.guestReviewToken) {
      await prisma.reviewRequest.updateMany({
        where: { token: input.guestReviewToken },
        data: { status: 'REVIEW_SUBMITTED' }
      });
    }

    return review;
  }

  /**
   * Generate Review Request for a Paid Order
   */
  public static async scheduleReviewRequest(orderId: string, productId: string, customerEmail: string, customerId?: string): Promise<any> {
    const token = crypto.randomBytes(24).toString('hex');

    return prisma.reviewRequest.create({
      data: {
        orderId,
        productId,
        customerEmail,
        customerId,
        token,
        status: 'SCHEDULED',
        scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Default 3 days delay
      }
    });
  }

  /**
   * Product Version Analytics
   */
  public static async getVersionAnalytics(productId: string): Promise<any[]> {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: { in: ['APPROVED', 'PUBLISHED'] }
      },
      select: {
        productVersion: true,
        rating: true,
        verifiedPurchase: true
      }
    });

    const versionMap: Record<string, { total: number; sumRating: number; verifiedCount: number }> = {};

    reviews.forEach(r => {
      const v = r.productVersion || '1.0.0';
      if (!versionMap[v]) {
        versionMap[v] = { total: 0, sumRating: 0, verifiedCount: 0 };
      }
      versionMap[v].total++;
      versionMap[v].sumRating += r.rating;
      if (r.verifiedPurchase) versionMap[v].verifiedCount++;
    });

    return Object.entries(versionMap).map(([version, stats]) => ({
      version,
      reviewCount: stats.total,
      averageRating: Math.round((stats.sumRating / stats.total) * 10) / 10,
      verifiedPercentage: Math.round((stats.verifiedCount / stats.total) * 100)
    }));
  }
}
