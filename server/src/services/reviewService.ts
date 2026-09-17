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
  public static screenReviewContent(title: string, comment: string, pros?: string, cons?: string): { isFlagged: boolean; riskScore: string; reason?: string; flagType?: string } {
    const text = `${title || ''} ${comment || ''} ${pros || ''} ${cons || ''}`.toLowerCase();

    // 1. Abusive words & Profanity filter
    const profanities = [
      'scam', 'fraud', 'cheat', 'fake', 'stolen', 'abuse', 'fuck', 'shit', 'bastard', 'asshole', 'bitch', 'dick', 'cunt',
      'slut', 'whore', 'idiot', 'stupid', 'moron', 'scammer', 'thief', 'chutiya', 'harami', 'saala', 'madarchod', 'behenchod'
    ];
    const matchedProfanity = profanities.find(p => {
      const regex = new RegExp(`\\b${p}\\b`, 'i');
      return regex.test(text);
    });
    if (matchedProfanity) {
      return {
        isFlagged: true,
        riskScore: 'PROFANITY_FLAGGED',
        flagType: 'ABUSIVE_LANGUAGE',
        reason: `Prohibited abusive language detected: "${matchedProfanity}"`
      };
    }

    // 2. Piracy, Warez, Cracks & Exploits
    const piracyTerms = ['cracked', 'pirated', 'pirate', 'warez', 'keygen', 'nulled', 'torrent', 'bypass license', 'free download crack'];
    const matchedPiracy = piracyTerms.find(p => text.includes(p));
    if (matchedPiracy) {
      return {
        isFlagged: true,
        riskScore: 'SPAM_FLAGGED',
        flagType: 'PIRACY_VIOLATION',
        reason: `Prohibited piracy/crack keyword detected: "${matchedPiracy}"`
      };
    }

    // 3. Phishing Links, URL Shorteners & Spam
    const spamLinkPatterns = [
      /https?:\/\/[^\s]+/i,
      /www\.[^\s]+/i,
      /bit\.ly\/[^\s]+/i,
      /t\.me\/[^\s]+/i,
      /wa\.me\/[^\s]+/i,
      /\.cc\b/i,
      /\.ru\b/i
    ];
    for (const pattern of spamLinkPatterns) {
      if (pattern.test(text)) {
        return {
          isFlagged: true,
          riskScore: 'SPAM_FLAGGED',
          flagType: 'SPAM_LINK',
          reason: 'Prohibited external link or URL shortener detected in review'
        };
      }
    }

    // 4. Repetitive characters / spam strings
    if (/(.)\1{6,}/.test(text)) {
      return {
        isFlagged: true,
        riskScore: 'SUSPICIOUS',
        flagType: 'CHARACTER_SPAM',
        reason: 'Suspicious repetitive character spam detected'
      };
    }

    return { isFlagged: false, riskScore: 'NORMAL' };
  }

  /**
   * Submit a Customer / Guest Review
   */
  public static async submitReview(input: ReviewSubmissionInput): Promise<any> {
    if (!input.productId) {
      throw new Error('Product ID is required for review submission');
    }

    // Resolve product by ID or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: input.productId },
          { slug: input.productId }
        ]
      }
    });

    if (!product) {
      throw new Error('Product not found. Please provide a valid product identifier.');
    }

    // Set canonical product ID
    input.productId = product.id;

    // Duplicate check: Prevent duplicate reviews for same product by same user/email
    const duplicateConditions: any[] = [];
    if (input.customerId) {
      duplicateConditions.push({ customerId: input.customerId });
    }
    if (input.guestEmail) {
      duplicateConditions.push({ customerEmail: { equals: input.guestEmail.trim(), mode: 'insensitive' as const } });
    }
    if (duplicateConditions.length > 0) {
      const existing = await prisma.review.findFirst({
        where: {
          productId: input.productId,
          OR: duplicateConditions
        }
      });
      if (existing) {
        throw new Error('A review from this account for this product already exists. Duplicate reviews are not allowed.');
      }
    }

    // STRICT VERIFICATION CHECK: Only verified buyers who purchased this product can review
    const verification = await this.verifyPurchase({
      productId: input.productId,
      customerId: input.customerId,
      guestEmail: input.guestEmail,
      orderId: input.orderId
    });

    if (!verification.verified) {
      throw new Error('Only verified buyers who have purchased this digital product can submit a review. Please sign in with your purchasing account.');
    }

    const prosString = Array.isArray(input.pros) 
      ? input.pros.filter(Boolean).join(', ') 
      : (typeof input.pros === 'string' ? input.pros : null);
    
    const consString = Array.isArray(input.cons) 
      ? input.cons.filter(Boolean).join(', ') 
      : (typeof input.cons === 'string' ? input.cons : null);

    const imagesString = input.images 
      ? (typeof input.images === 'string' ? input.images : JSON.stringify(input.images)) 
      : '[]';

    const videosString = input.videos 
      ? (typeof input.videos === 'string' ? input.videos : JSON.stringify(input.videos)) 
      : '[]';

    // Automated Abusive Words & Spam Moderation Screening
    const risk = this.screenReviewContent(input.title, input.comment, prosString || undefined, consString || undefined);

    // If abusive words or spam detected, route directly to REPORTED status
    let status = 'PUBLISHED';
    let reportCount = 0;
    if (risk.isFlagged) {
      status = 'REPORTED';
      reportCount = 1;
    }

    const customerName = input.guestName || 'KDW Customer';

    const review = await prisma.review.create({
      data: {
        productId: input.productId,
        productVersion: input.productVersion || '1.0.0',
        orderId: verification.orderId || input.orderId || undefined,
        customerId: input.customerId || undefined,
        customerName,
        customerEmail: input.guestEmail || undefined,
        rating: Math.max(1, Math.min(5, input.rating)),
        title: input.title,
        comment: input.comment,
        pros: prosString,
        cons: consString,
        verifiedPurchase: true,
        verificationMethod: verification.method || 'PAID_ORDER_ENTITLEMENT',
        status,
        riskScore: risk.riskScore,
        reportCount,
        moderationReason: risk.reason || undefined,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        images: imagesString,
        videos: videosString,
        guestReviewToken: input.guestReviewToken || undefined
      }
    });

    // If flagged as abusive or spam, automatically create an OPEN ReviewReport dispute record
    if (risk.isFlagged) {
      await prisma.reviewReport.create({
        data: {
          reviewId: review.id,
          reporterEmail: 'automoderation@kdw.internal',
          reason: risk.flagType || 'ABUSIVE_LANGUAGE_OR_SPAM',
          details: risk.reason || 'Flagged by automated moderation for prohibited terms',
          status: 'OPEN'
        }
      });
    }

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
