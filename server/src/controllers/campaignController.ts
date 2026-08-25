import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { CampaignService } from '../services/campaignService';
import { logAdminAction } from '../utils/auditLogger';

// 1. Get All Campaigns with multi-filter subviews and live KPIs
export const getAdminCampaigns = async (req: Request, res: Response) => {
  try {
    const { status, channel, campaignType, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (channel && channel !== 'ALL') {
      where.channel = channel as string;
    }
    if (campaignType && campaignType !== 'ALL') {
      where.campaignType = campaignType as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { emailSubject: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [campaigns, total, runningCount, scheduledCount, draftCount, completedCount] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          coupons: { select: { id: true, code: true } },
          offers: { select: { id: true, name: true } },
          _count: { select: { recipients: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.campaign.count({ where }),
      prisma.campaign.count({ where: { status: 'RUNNING' } }),
      prisma.campaign.count({ where: { status: 'SCHEDULED' } }),
      prisma.campaign.count({ where: { status: 'DRAFT' } }),
      prisma.campaign.count({ where: { status: 'COMPLETED' } })
    ]);

    // Live aggregated metrics across all campaigns
    const metricsAgg = await prisma.campaign.aggregate({
      _sum: {
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        convertedOrdersCount: true,
        revenueGenerated: true
      }
    });

    res.status(200).json({
      success: true,
      campaigns,
      kpis: {
        totalCampaigns: total,
        runningCampaigns: runningCount,
        scheduledCampaigns: scheduledCount,
        draftCampaigns: draftCount,
        completedCampaigns: completedCount,
        totalSent: metricsAgg._sum.sentCount || 0,
        totalDelivered: metricsAgg._sum.deliveredCount || 0,
        totalOpened: metricsAgg._sum.openedCount || 0,
        totalClicked: metricsAgg._sum.clickedCount || 0,
        totalOrders: metricsAgg._sum.convertedOrdersCount || 0,
        totalRevenue: metricsAgg._sum.revenueGenerated || 0
      },
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: 'Server error fetching campaigns' });
  }
};

// 2. Get Single Campaign
export const getAdminCampaignById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        coupons: true,
        offers: true,
        recipients: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.status(200).json({ success: true, campaign });
  } catch (error) {
    console.error('Error fetching campaign detail:', error);
    res.status(500).json({ success: false, message: 'Server error fetching campaign' });
  }
};

// 3. Create Campaign
export const createAdminCampaign = async (req: Request, res: Response) => {
  try {
    const {
      name,
      campaignType,
      channel,
      audienceSegment,
      offerId,
      couponId,
      productId,
      landingPageUrl,
      utmCampaign,
      emailSubject,
      emailPreviewText,
      emailFromName,
      emailReplyTo,
      emailBodyHtml,
      emailBodyPlain,
      whatsAppTemplateName,
      whatsAppLanguage,
      frequencyLimitDays,
      startAt,
      endAt,
      status
    } = req.body;

    const audience = await CampaignService.buildAudience(audienceSegment || 'ALL_CUSTOMERS');

    const campaign = await prisma.campaign.create({
      data: {
        name,
        campaignType: campaignType || 'SALE_CAMPAIGN',
        channel: channel || 'EMAIL',
        audienceSegment: audienceSegment || 'ALL_CUSTOMERS',
        audienceCount: audience.totalEligible,
        suppressedCount: audience.suppressedCount,
        offerId,
        couponId,
        productId,
        landingPageUrl,
        utmCampaign: utmCampaign || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        emailSubject,
        emailPreviewText,
        emailFromName: emailFromName || 'KDW Digital World',
        emailReplyTo: emailReplyTo || 'support@kdw.in',
        emailBodyHtml,
        emailBodyPlain,
        whatsAppTemplateName,
        whatsAppLanguage: whatsAppLanguage || 'en',
        frequencyLimitDays: frequencyLimitDays ? parseInt(frequencyLimitDays, 10) : 3,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        status: status || 'DRAFT',
        ownerId: (req as any).user?.name || 'Admin'
      }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'CREATE_CAMPAIGN', 'Campaign', `Created campaign ${campaign.name}`);

    res.status(201).json({ success: true, campaign, message: 'Campaign created successfully.' });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating campaign' });
  }
};

// 4. Update Campaign
export const updateAdminCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };

    if (updateData.startAt !== undefined) updateData.startAt = updateData.startAt ? new Date(updateData.startAt) : null;
    if (updateData.endAt !== undefined) updateData.endAt = updateData.endAt ? new Date(updateData.endAt) : null;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'UPDATE_CAMPAIGN', 'Campaign', `Updated campaign ${campaign.name}`);

    res.status(200).json({ success: true, campaign, message: 'Campaign updated successfully.' });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating campaign' });
  }
};

// 5. Send Test Campaign Email
export const sendTestCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ success: false, message: 'Recipient test email address is required.' });
    }

    await CampaignService.sendTestEmail(id, testEmail);

    res.status(200).json({ success: true, message: `Test email dispatched to ${testEmail}` });
  } catch (error: any) {
    console.error('Error sending test campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending test campaign' });
  }
};

// 6. Approve Campaign
export const approveCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminName = (req as any).user?.name || 'Admin';

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: adminName,
        approvedAt: new Date()
      }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'APPROVE_CAMPAIGN', 'Campaign', `Approved campaign ${campaign.name}`);

    res.status(200).json({ success: true, campaign, message: 'Campaign approved for launch.' });
  } catch (error) {
    console.error('Error approving campaign:', error);
    res.status(500).json({ success: false, message: 'Server error approving campaign' });
  }
};

// 7. Launch / Send Campaign
export const launchCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await CampaignService.executeCampaign(id);

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'LAUNCH_CAMPAIGN', 'Campaign', `Launched campaign execution for ${id}`);

    res.status(200).json({
      success: true,
      result,
      message: `Campaign delivery completed. Sent to ${result.delivered} recipients (${result.failed} failed).`
    });
  } catch (error: any) {
    console.error('Error launching campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error launching campaign' });
  }
};

// 8. Audience Preview & Suppression Count
export const getAudiencePreview = async (req: Request, res: Response) => {
  try {
    const { segment = 'ALL_CUSTOMERS' } = req.query;
    const audience = await CampaignService.buildAudience(segment as string);

    res.status(200).json({
      success: true,
      segment,
      totalEligible: audience.totalEligible,
      suppressedCount: audience.suppressedCount
    });
  } catch (error) {
    console.error('Error getting audience preview:', error);
    res.status(500).json({ success: false, message: 'Server error building audience' });
  }
};
