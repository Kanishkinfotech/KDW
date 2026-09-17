import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { CampaignService } from '../services/campaignService';
import { logAdminAction } from '../utils/auditLogger';

// 1. Get All Campaigns with multi-filter subviews, search, and live KPIs (Admin)
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
        { emailSubject: { contains: search as string, mode: 'insensitive' } },
        { utmCampaign: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const channelWhere = where.channel ? { channel: where.channel } : {};

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
      prisma.campaign.count({ where: { ...channelWhere, status: 'RUNNING' } }),
      prisma.campaign.count({ where: { ...channelWhere, status: 'SCHEDULED' } }),
      prisma.campaign.count({ where: { ...channelWhere, status: 'DRAFT' } }),
      prisma.campaign.count({ where: { ...channelWhere, status: 'COMPLETED' } })
    ]);

    // Live aggregated metrics across matching campaigns
    const metricsAgg = await prisma.campaign.aggregate({
      where: channelWhere,
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

// 2. Get Single Campaign Detail
export const getAdminCampaignById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        coupons: true,
        offers: true,
        recipients: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { id: true, name: true, email: true, mobile: true } } }
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

// 3. Create Campaign (Admin)
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
      senderEmail,
      senderPhone,
      whatsAppSenderName,
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

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Campaign name is required.' });
    }

    const audience = await CampaignService.buildAudience(audienceSegment || 'ALL_CUSTOMERS');

    const isWhatsApp = channel === 'WHATSAPP';
    const effectiveSender = isWhatsApp ? (senderPhone || senderEmail || '+91 98765 43210') : (senderEmail || 'support@kdw.in');
    const effectiveSenderName = isWhatsApp ? (whatsAppSenderName || emailFromName || 'KDW Official Updates') : (emailFromName || 'KDW Digital World');

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        campaignType: campaignType || 'SALE_CAMPAIGN',
        channel: channel || 'EMAIL',
        audienceSegment: audienceSegment || 'ALL_CUSTOMERS',
        audienceCount: audience.totalEligible,
        suppressedCount: audience.suppressedCount,
        offerId: offerId || null,
        couponId: couponId || null,
        productId: productId || null,
        landingPageUrl,
        utmCampaign: utmCampaign || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        emailSubject,
        emailPreviewText,
        emailFromName: effectiveSenderName,
        senderEmail: effectiveSender,
        emailReplyTo: emailReplyTo || effectiveSender,
        emailBodyHtml,
        emailBodyPlain,
        whatsAppTemplateName,
        whatsAppLanguage: 'en',
        whatsAppParameters: isWhatsApp ? { senderPhone: effectiveSender, senderName: effectiveSenderName } : undefined,
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

// 4. Update Campaign (Admin)
export const updateAdminCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };

    if (updateData.startAt !== undefined) updateData.startAt = updateData.startAt ? new Date(updateData.startAt) : null;
    if (updateData.endAt !== undefined) updateData.endAt = updateData.endAt ? new Date(updateData.endAt) : null;

    if (updateData.channel === 'WHATSAPP' || updateData.senderPhone) {
      const phone = updateData.senderPhone || updateData.senderEmail || '+91 98765 43210';
      const name = updateData.whatsAppSenderName || updateData.emailFromName || 'KDW Official Updates';
      updateData.senderEmail = phone;
      updateData.emailFromName = name;
      updateData.whatsAppLanguage = 'en';
      updateData.whatsAppParameters = { senderPhone: phone, senderName: name };
    }
    delete updateData.senderPhone;
    delete updateData.whatsAppSenderName;

    if (updateData.audienceSegment) {
      const audience = await CampaignService.buildAudience(updateData.audienceSegment);
      updateData.audienceCount = audience.totalEligible;
      updateData.suppressedCount = audience.suppressedCount;
    }

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

// 5. Send Test Preview Message (Email or WhatsApp)
export const sendTestCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { testEmail, testMobile } = req.body;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.channel === 'WHATSAPP') {
      if (!testMobile) {
        return res.status(400).json({ success: false, message: 'Test mobile number is required for WhatsApp.' });
      }
      await CampaignService.sendTestWhatsApp(id, testMobile);
      return res.status(200).json({ success: true, message: `Test WhatsApp message sent to ${testMobile}` });
    } else {
      if (!testEmail) {
        return res.status(400).json({ success: false, message: 'Test email address is required.' });
      }
      await CampaignService.sendTestEmail(id, testEmail);
      return res.status(200).json({ success: true, message: `Test email dispatched to ${testEmail}` });
    }
  } catch (error: any) {
    console.error('Error sending test campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending test campaign' });
  }
};

// 6. Approve Campaign for Broadcast / Launch
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

// 7. Launch / Execute Campaign
export const launchCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deliveryResult = await CampaignService.executeCampaign(id);

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'LAUNCH_CAMPAIGN', 'Campaign', `Launched campaign execution for ${id}`);

    res.status(200).json({
      success: true,
      deliveryResult,
      message: `Campaign delivery completed. Dispatched to ${deliveryResult.delivered} recipients (${deliveryResult.failed} failed).`
    });
  } catch (error: any) {
    console.error('Error launching campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error launching campaign' });
  }
};

// 8. Audience Reach Preview & Suppression Breakdown
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
    res.status(500).json({ success: false, message: 'Server error building audience preview' });
  }
};

// 9. Open Tracking Pixel (Public Tracking Endpoint)
export const trackCampaignOpen = async (req: Request, res: Response) => {
  try {
    const recipientId = req.params.recipientId as string;

    if (recipientId) {
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { id: recipientId }
      });

      if (recipient && !recipient.openedAt) {
        await prisma.$transaction([
          prisma.campaignRecipient.update({
            where: { id: recipientId },
            data: {
              deliveryStatus: 'OPENED',
              openedAt: new Date()
            }
          }),
          prisma.campaign.update({
            where: { id: recipient.campaignId },
            data: { openedCount: { increment: 1 } }
          })
        ]);
      }
    }

    // Return 1x1 transparent GIF image
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': transparentGif.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(transparentGif);
  } catch (e) {
    console.error('Error tracking campaign open:', e);
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(transparentGif);
  }
};

// 10. Click Redirect Tracker (Public Tracking Endpoint)
export const trackCampaignClick = async (req: Request, res: Response) => {
  try {
    const recipientId = req.params.recipientId as string;
    const targetUrl = (req.query.url as string) || '/';

    if (recipientId) {
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { id: recipientId }
      });

      if (recipient) {
        if (!recipient.clickedAt) {
          await prisma.$transaction([
            prisma.campaignRecipient.update({
              where: { id: recipientId },
              data: {
                deliveryStatus: 'CLICKED',
                clickedAt: new Date()
              }
            }),
            prisma.campaign.update({
              where: { id: recipient.campaignId },
              data: { clickedCount: { increment: 1 } }
            })
          ]);
        }
      }
    }

    return res.redirect(targetUrl);
  } catch (e) {
    console.error('Error tracking campaign click:', e);
    return res.redirect((req.query.url as string) || '/');
  }
};

// 11. Server-Side CSV Streaming Export
export const exportCampaignsCSV = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        coupons: true,
        offers: true,
        _count: { select: { recipients: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Campaign ID',
      'Campaign Name',
      'Channel',
      'Type',
      'Status',
      'Audience Segment',
      'Eligible Audience',
      'Suppressed Count',
      'Sent Count',
      'Delivered Count',
      'Opened Count',
      'Clicked Count',
      'Converted Orders',
      'Attributed Revenue (INR)',
      'UTM Campaign',
      'Created At'
    ];

    const rows = campaigns.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.channel,
      c.campaignType,
      c.status,
      c.audienceSegment || 'ALL_CUSTOMERS',
      c.audienceCount,
      c.suppressedCount,
      c.sentCount,
      c.deliveredCount,
      c.openedCount,
      c.clickedCount,
      c.convertedOrdersCount,
      c.revenueGenerated,
      c.utmCampaign || '',
      c.createdAt.toISOString()
    ]);

    const csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=kdw_campaigns_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting campaigns CSV:', error);
    res.status(500).json({ success: false, message: 'Server error exporting campaigns' });
  }
};

// 12. Detailed Recipient Delivery & Read Analysis Drilldown
export const getCampaignRecipients = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, search, limit = '100', page = '1' } = req.query;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        channel: true,
        campaignType: true,
        status: true,
        senderEmail: true,
        whatsAppParameters: true,
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        revenueGenerated: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const where: any = { campaignId: id };
    if (status && status !== 'ALL') {
      if (status === 'READ' || status === 'OPENED') {
        where.deliveryStatus = { in: ['OPENED', 'CLICKED', 'REPLIED', 'CONVERTED'] };
      } else if (status === 'REPLIED') {
        where.deliveryStatus = 'REPLIED';
      } else if (status === 'CLICKED') {
        where.deliveryStatus = { in: ['CLICKED', 'CONVERTED'] };
      } else if (status === 'PURCHASED' || status === 'CONVERTED') {
        where.deliveryStatus = 'CONVERTED';
      } else if (status === 'DELIVERED') {
        where.deliveryStatus = { in: ['DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'CONVERTED'] };
      } else if (status === 'UNREAD') {
        where.deliveryStatus = 'DELIVERED';
        where.openedAt = null;
      } else if (status === 'FAILED') {
        where.deliveryStatus = { in: ['FAILED', 'BOUNCED'] };
      } else {
        where.deliveryStatus = status as string;
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { customer: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skipNum = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const takeNum = parseInt(limit as string, 10);

    const [recipients, total, allRecipients] = await Promise.all([
      prisma.campaignRecipient.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true, mobile: true } }
        },
        orderBy: [{ openedAt: 'desc' }, { deliveredAt: 'desc' }, { createdAt: 'desc' }],
        skip: skipNum,
        take: takeNum
      }),
      prisma.campaignRecipient.count({ where }),
      prisma.campaignRecipient.findMany({
        where: { campaignId: id },
        select: { deliveryStatus: true, openedAt: true, clickedAt: true, convertedRevenue: true }
      })
    ]);

    let deliveredCount = 0;
    let openedCount = 0;
    let clickedCount = 0;
    let repliedCount = 0;
    let convertedCount = 0;
    let failedCount = 0;

    allRecipients.forEach(r => {
      if (['DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'CONVERTED'].includes(r.deliveryStatus)) deliveredCount++;
      if (['OPENED', 'CLICKED', 'REPLIED', 'CONVERTED'].includes(r.deliveryStatus) || r.openedAt) openedCount++;
      if (['CLICKED', 'CONVERTED'].includes(r.deliveryStatus) || r.clickedAt) clickedCount++;
      if (r.deliveryStatus === 'REPLIED') repliedCount++;
      if (r.deliveryStatus === 'CONVERTED' || (r.convertedRevenue && r.convertedRevenue > 0)) convertedCount++;
      if (['FAILED', 'BOUNCED'].includes(r.deliveryStatus)) failedCount++;
    });

    res.status(200).json({
      success: true,
      campaign,
      recipients,
      total,
      summary: {
        totalRecipients: allRecipients.length,
        delivered: Math.max(campaign.deliveredCount, deliveredCount),
        opened: Math.max(campaign.openedCount, openedCount),
        clicked: Math.max(campaign.clickedCount, clickedCount),
        replied: repliedCount,
        converted: convertedCount,
        failed: Math.max(campaign.bouncedCount, failedCount),
        unread: Math.max(0, Math.max(campaign.deliveredCount, deliveredCount) - Math.max(campaign.openedCount, openedCount))
      }
    });
  } catch (error: any) {
    console.error('Error fetching campaign recipients:', error);
    res.status(500).json({ success: false, message: 'Server error fetching recipients' });
  }
};

// 13. Pause Campaign
export const pauseCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' }
    });
    res.status(200).json({ success: true, campaign, message: 'Campaign paused.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error pausing campaign' });
  }
};

// 14. Resume Campaign
export const resumeCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'RUNNING' }
    });
    res.status(200).json({ success: true, campaign, message: 'Campaign resumed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error resuming campaign' });
  }
};

// 15. Delete Campaign
export const deleteAdminCampaign = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Campaign and recipient logs deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, message: 'Server error deleting campaign' });
  }
};

