import { Request, Response } from 'express';
import { prisma } from '../database/db';

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'DEFAULT' } });
    
    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          support_email: 'support@kanishkdigital.com',
          support_email_description: 'Our primary support channel.',
          support_phone: '+91 98765 43210',
          support_phone_description: 'Call us during business hours for urgent assistance.',
          business_hours: 'Mon–Fri, 9:00 AM – 6:00 PM IST',
          business_hours_description: 'Our support team is available during these hours.',
          office_location: 'Bangalore, India',
          office_location_description: 'Our primary office and support operations location.',
          faq_link: '/faq',
          kb_link: '/docs'
        }
      });
    }

    let extra: any = {};
    try {
      if (settings.socialLinks) extra = JSON.parse(settings.socialLinks);
    } catch (e) {}

    const publicSettings = {
      support_email: settings.supportEmail || 'support@kanishkdigital.com',
      support_email_description: extra.support_email_description || 'Our primary support channel.',
      support_phone: settings.phone || '+91 98765 43210',
      support_phone_description: extra.support_phone_description || 'Call us during business hours for urgent assistance.',
      business_hours: extra.business_hours || 'Mon–Fri, 9:00 AM – 6:00 PM IST',
      business_hours_description: extra.business_hours_description || 'Our support team is available during these hours.',
      office_location: extra.office_location || 'Bangalore, India',
      office_location_description: extra.office_location_description || 'Our primary office and support operations location.',
      faq_link: extra.faq_link || '/faq',
      kb_link: extra.kb_link || '/docs'
    };

    res.status(200).json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};
