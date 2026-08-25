import { prisma } from '../database/db';
import { sendGeneralEmail } from '../utils/emailService';

export interface CampaignRecipientTarget {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
  customerType?: string;
  role?: string;
}

export class CampaignService {
  /**
   * Audience Builder: Queries dynamic audience count and recipients
   */
  public static async buildAudience(segment: string = 'ALL_CUSTOMERS'): Promise<{
    recipients: CampaignRecipientTarget[];
    totalEligible: number;
    suppressedCount: number;
  }> {
    let whereClause: any = { status: 'ACTIVE' };

    if (segment === 'PAID_CUSTOMERS') {
      whereClause.orders = { some: { paymentStatus: 'PAID' } };
    } else if (segment === 'NEW_CUSTOMERS') {
      whereClause.orders = { none: { paymentStatus: 'PAID' } };
    } else if (segment === 'HIGH_VALUE') {
      whereClause.orders = { some: { paymentStatus: 'PAID', totalAmount: { gte: 2000 } } };
    } else if (segment === 'STUDENTS') {
      whereClause.customerType = 'STUDENT';
    } else if (segment === 'AGENCY') {
      whereClause.customerType = 'AGENCY';
    }

    const customers = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, mobile: true, customerType: true, role: true }
    });

    // Check against suppression list
    const suppressedEntries = await prisma.suppressionEntry.findMany({
      select: { identifier: true }
    });
    const suppressedSet = new Set(suppressedEntries.map(s => s.identifier.toLowerCase().trim()));

    const eligible: CampaignRecipientTarget[] = [];
    let suppressedCount = 0;

    customers.forEach(c => {
      const emailLower = (c.email || '').toLowerCase().trim();
      const phoneClean = (c.mobile || '').trim();

      if (suppressedSet.has(emailLower) || (phoneClean && suppressedSet.has(phoneClean))) {
        suppressedCount++;
      } else {
        eligible.push({
          id: c.id,
          name: c.name,
          email: c.email,
          mobile: c.mobile || undefined,
          customerType: c.customerType,
          role: c.role
        });
      }
    });

    return {
      recipients: eligible,
      totalEligible: eligible.length,
      suppressedCount
    };
  }

  /**
   * Safe Template Variable Interpolation
   */
  public static renderTemplate(
    template: string,
    variables: {
      customerName?: string;
      customerEmail?: string;
      productName?: string;
      couponCode?: string;
      offerEndDate?: string;
      orderNumber?: string;
      downloadLink?: string;
    }
  ): string {
    let rendered = template || '';

    const map: Record<string, string> = {
      '{{customer.first_name}}': (variables.customerName || 'Valued Customer').split(' ')[0],
      '{{customer.name}}': variables.customerName || 'Valued Customer',
      '{{customer.email}}': variables.customerEmail || '',
      '{{product.name}}': variables.productName || 'KDW Digital Assets',
      '{{coupon.code}}': variables.couponCode || 'SAVE10',
      '{{offer.end_date}}': variables.offerEndDate || 'Limited Time',
      '{{order.number}}': variables.orderNumber || '',
      '{{download.link}}': variables.downloadLink || 'https://kdw.in/account'
    };

    for (const [key, value] of Object.entries(map)) {
      rendered = rendered.split(key).join(value);
    }

    return rendered;
  }

  /**
   * Send Test Campaign Email
   */
  public static async sendTestEmail(campaignId: string, testRecipientEmail: string): Promise<boolean> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { coupons: true, offers: true }
    });

    if (!campaign) throw new Error('Campaign not found.');

    const renderedHtml = this.renderTemplate(campaign.emailBodyHtml || '<p>KDW Promotional Announcement</p>', {
      customerName: 'Test Recipient',
      customerEmail: testRecipientEmail,
      couponCode: campaign.coupons[0]?.code || 'TESTCODE',
      offerEndDate: 'August 31, 2026'
    });

    const renderedSubject = this.renderTemplate(campaign.emailSubject || 'Special Announcement from KDW', {
      customerName: 'Test Recipient'
    });

    await sendGeneralEmail({
      to: testRecipientEmail,
      subject: `[TEST] ${renderedSubject}`,
      html: renderedHtml,
      text: campaign.emailBodyPlain || undefined
    });

    return true;
  }

  /**
   * Execute Campaign Delivery
   */
  public static async executeCampaign(campaignId: string): Promise<{
    queued: number;
    delivered: number;
    failed: number;
  }> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { coupons: true, offers: true }
    });

    if (!campaign) throw new Error('Campaign not found.');

    // Build fresh audience immediately before sending
    const audience = await this.buildAudience(campaign.audienceSegment || 'ALL_CUSTOMERS');

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'RUNNING',
        audienceCount: audience.totalEligible,
        suppressedCount: audience.suppressedCount
      }
    });

    let delivered = 0;
    let failed = 0;

    for (const recipient of audience.recipients) {
      if (!recipient.email) continue;

      try {
        const renderedHtml = this.renderTemplate(campaign.emailBodyHtml || '', {
          customerName: recipient.name || 'Valued Customer',
          customerEmail: recipient.email,
          couponCode: campaign.coupons[0]?.code || undefined,
          offerEndDate: campaign.endAt ? new Date(campaign.endAt).toLocaleDateString('en-IN') : undefined
        });

        const renderedSubject = this.renderTemplate(campaign.emailSubject || 'Special Offer from KDW', {
          customerName: recipient.name || 'Valued Customer'
        });

        const emailResult = await sendGeneralEmail({
          to: recipient.email,
          subject: renderedSubject,
          html: renderedHtml,
          text: campaign.emailBodyPlain || undefined
        });
        const emailSent = emailResult.success;

        await prisma.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            customerId: recipient.id,
            email: recipient.email,
            phone: recipient.mobile,
            channel: 'EMAIL',
            eligibilityStatus: 'ELIGIBLE',
            deliveryStatus: emailSent ? 'DELIVERED' : 'FAILED',
            sentAt: new Date(),
            deliveredAt: emailSent ? new Date() : null
          }
        });

        if (emailSent) delivered++;
        else failed++;
      } catch (err: any) {
        failed++;
        await prisma.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            customerId: recipient.id,
            email: recipient.email,
            channel: 'EMAIL',
            eligibilityStatus: 'ELIGIBLE',
            deliveryStatus: 'FAILED',
            failureReason: err.message
          }
        });
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        sentCount: delivered + failed,
        deliveredCount: delivered
      }
    });

    return { queued: audience.totalEligible, delivered, failed };
  }
}
