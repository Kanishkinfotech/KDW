// @ts-nocheck
import { prisma } from './db';

async function seedCategoriesAndDeliveries() {
  console.log('Seeding Master Category Structure & Deliveries...');

  const categoryTree = [
    {
      name: 'Business Templates',
      slug: 'business-templates',
      categoryCode: 'CAT-BUS-001',
      description: 'Professional business documentation, quotation sheets, contracts, client onboarding workflows, and finance templates.',
      status: 'ACTIVE',
      displayOrder: 1,
      featured: true,
      children: [
        { name: 'Proposal & Quotation Templates', slug: 'proposal-quotation-templates', categoryCode: 'CAT-BUS-002' },
        { name: 'Client Onboarding', slug: 'client-onboarding', categoryCode: 'CAT-BUS-003' },
        { name: 'HR Documents', slug: 'hr-documents', categoryCode: 'CAT-BUS-004' },
        { name: 'SOPs & Checklists', slug: 'sops-checklists', categoryCode: 'CAT-BUS-005' },
        { name: 'Finance Templates', slug: 'finance-templates', categoryCode: 'CAT-BUS-006' }
      ]
    },
    {
      name: 'Social Media Bundles',
      slug: 'social-media-bundles',
      categoryCode: 'CAT-SOC-001',
      description: 'High-converting social media creatives, Instagram carousels, Canva editable assets for real estate, healthcare, education, and festival designs.',
      status: 'ACTIVE',
      displayOrder: 2,
      featured: true,
      children: [
        { name: 'Real Estate', slug: 'real-estate', categoryCode: 'CAT-SOC-002' },
        { name: 'Healthcare', slug: 'healthcare', categoryCode: 'CAT-SOC-003' },
        { name: 'Restaurants', slug: 'restaurants', categoryCode: 'CAT-SOC-004' },
        { name: 'Education', slug: 'education', categoryCode: 'CAT-SOC-005' },
        { name: 'Festival Designs', slug: 'festival-designs', categoryCode: 'CAT-SOC-006' }
      ]
    },
    {
      name: 'Automation Workflows',
      slug: 'automation-workflows',
      categoryCode: 'CAT-AUT-001',
      description: 'Pre-built n8n, Zapier, Make.com, and Google Sheets automations for lead generation, CRM pipelines, and WhatsApp outreach.',
      status: 'ACTIVE',
      displayOrder: 3,
      featured: true,
      children: [
        { name: 'Lead Generation', slug: 'lead-generation', categoryCode: 'CAT-AUT-002' },
        { name: 'CRM Automation', slug: 'crm-automation', categoryCode: 'CAT-AUT-003' },
        { name: 'Email Automation', slug: 'email-automation', categoryCode: 'CAT-AUT-004' },
        { name: 'WhatsApp Automation', slug: 'whatsapp-automation', categoryCode: 'CAT-AUT-005' },
        { name: 'Google Sheets Automation', slug: 'google-sheets-automation', categoryCode: 'CAT-AUT-006' }
      ]
    },
    {
      name: 'Website Kits',
      slug: 'website-kits',
      categoryCode: 'CAT-WEB-001',
      description: 'Production-ready Tailwind, Framer, Next.js, and WordPress landing pages and business website UI templates.',
      status: 'ACTIVE',
      displayOrder: 4,
      featured: true,
      children: [
        { name: 'Landing Pages', slug: 'landing-pages', categoryCode: 'CAT-WEB-002' },
        { name: 'Business Websites', slug: 'business-websites', categoryCode: 'CAT-WEB-003' },
        { name: 'Portfolio Websites', slug: 'portfolio-websites', categoryCode: 'CAT-WEB-004' },
        { name: 'Agency Websites', slug: 'agency-websites', categoryCode: 'CAT-WEB-005' }
      ]
    },
    {
      name: 'AI Prompt Packs',
      slug: 'ai-prompt-packs',
      categoryCode: 'CAT-AIP-001',
      description: 'Curated ChatGPT, Claude, and Midjourney prompt engineering packs for marketing campaigns, sales sequences, and business operations.',
      status: 'ACTIVE',
      displayOrder: 5,
      featured: true,
      children: [
        { name: 'Marketing Prompts', slug: 'marketing-prompts', categoryCode: 'CAT-AIP-002' },
        { name: 'Sales Prompts', slug: 'sales-prompts', categoryCode: 'CAT-AIP-003' },
        { name: 'Customer Support Prompts', slug: 'customer-support-prompts', categoryCode: 'CAT-AIP-004' },
        { name: 'Business Operations Prompts', slug: 'business-operations-prompts', categoryCode: 'CAT-AIP-005' }
      ]
    },
    {
      name: 'Learning Resources',
      slug: 'learning-resources',
      categoryCode: 'CAT-LRN-001',
      description: 'Expert digital marketing, coding, prompt engineering, and e-commerce growth PDFs, video masterclasses, and mini courses.',
      status: 'ACTIVE',
      displayOrder: 6,
      featured: true,
      children: [
        { name: 'PDFs and Guides', slug: 'pdfs-and-guides', categoryCode: 'CAT-LRN-002' },
        { name: 'Video Tutorials', slug: 'video-tutorials', categoryCode: 'CAT-LRN-003' },
        { name: 'Checklists', slug: 'learning-checklists', categoryCode: 'CAT-LRN-004' },
        { name: 'Mini Courses', slug: 'mini-courses', categoryCode: 'CAT-LRN-005' }
      ]
    }
  ];

  for (const rootCat of categoryTree) {
    const existing = await prisma.category.findUnique({ where: { slug: rootCat.slug } });
    let rootId = '';

    if (existing) {
      rootId = existing.id;
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: rootCat.name,
          categoryCode: rootCat.categoryCode,
          description: rootCat.description,
          displayOrder: rootCat.displayOrder,
          featured: rootCat.featured,
          status: rootCat.status,
          qualityScore: 95
        }
      });
    } else {
      const created = await prisma.category.create({
        data: {
          name: rootCat.name,
          slug: rootCat.slug,
          categoryCode: rootCat.categoryCode,
          description: rootCat.description,
          displayOrder: rootCat.displayOrder,
          featured: rootCat.featured,
          status: rootCat.status,
          qualityScore: 95
        }
      });
      rootId = created.id;
    }

    // Seed Children
    if (rootCat.children) {
      let childOrder = 1;
      for (const child of rootCat.children) {
        const existingChild = await prisma.category.findUnique({ where: { slug: child.slug } });
        if (existingChild) {
          await prisma.category.update({
            where: { id: existingChild.id },
            data: {
              name: child.name,
              categoryCode: child.categoryCode,
              parentId: rootId,
              displayOrder: childOrder++,
              status: 'ACTIVE',
              qualityScore: 90
            }
          });
        } else {
          await prisma.category.create({
            data: {
              name: child.name,
              slug: child.slug,
              categoryCode: child.categoryCode,
              parentId: rootId,
              displayOrder: childOrder++,
              status: 'ACTIVE',
              qualityScore: 90
            }
          });
        }
      }
    }
  }

  // Backfill DigitalDelivery records for all existing paid orders
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID' },
    include: {
      items: {
        include: { product: true }
      },
      customer: true
    }
  });

  console.log(`Backfilling digital delivery records for ${paidOrders.length} paid orders...`);

  for (const o of paidOrders) {
    const email = o.customer?.email || o.guestEmail || 'customer@kwd-store.com';

    for (const item of o.items) {
      if (item.productId && item.product) {
        const p = item.product;
        const driveUrl = p.googleDriveFileId 
          ? `https://drive.google.com/file/d/${p.googleDriveFileId}/view?usp=sharing` 
          : 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ';

        await prisma.digitalDelivery.upsert({
          where: {
            orderId_productId: {
              orderId: o.id,
              productId: p.id
            }
          },
          update: {
            deliveryLink: driveUrl,
            deliveryStatus: 'SENT',
            emailStatus: 'SENT',
            sentAt: o.paidAt || o.createdAt
          },
          create: {
            orderId: o.id,
            productId: p.id,
            customerId: o.customerId,
            customerEmail: email,
            deliveryType: 'GOOGLE_DRIVE',
            deliveryLink: driveUrl,
            deliveryStatus: 'SENT',
            emailStatus: 'SENT',
            paymentVerifiedAt: o.paidAt || o.createdAt,
            sentAt: o.paidAt || o.createdAt
          }
        });
      }
    }
  }

  console.log('✓ Seeding completed successfully!');
}

seedCategoriesAndDeliveries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
