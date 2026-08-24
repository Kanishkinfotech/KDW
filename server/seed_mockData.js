const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Raw data from mockData.ts
const categories = [
  { "id": "1", "name": "Healthcare", "slug": "healthcare", "description": "Medical dashboards and clinic websites", "image": "/images/products/healthcare_dashboard.jpg", "displayOrder": 1 },
  { "id": "2", "name": "Business Templates", "slug": "business-templates", "description": "Proposals and finance dashboards", "image": "/images/products/finance_dashboard.jpg", "displayOrder": 2 },
  { "id": "3", "name": "Automation", "slug": "automation", "description": "Workflows and CRM integrations", "image": "/images/products/ai_workflow.jpg", "displayOrder": 3 },
  { "id": "4", "name": "Website Kits", "slug": "website-kits", "description": "Complete React and HTML website templates", "image": "/images/products/saas_website.jpg", "displayOrder": 4 },
  { "id": "5", "name": "AI Prompt Bundles", "slug": "ai-prompt-bundles", "description": "Prompts for ChatGPT and AI tools", "image": "/images/products/chatgpt_library.jpg", "displayOrder": 5 },
  { "id": "6", "name": "Social Media Bundles", "slug": "social-media-bundles", "description": "Canva templates and social kits", "image": "/images/products/social_media_kit.jpg", "displayOrder": 6 },
  { "id": "7", "name": "Agency Kits", "slug": "agency-kits", "description": "Contracts, proposals, and CRM", "image": "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=800", "displayOrder": 7 },
  { "id": "8", "name": "Instagram Bundles", "slug": "instagram-bundles", "description": "Grow your Instagram account", "image": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800", "displayOrder": 8 }
];

const products = [
  { "title": "Healthcare Management Dashboard", "slug": "healthcare-management-dashboard", "description": "Complete healthcare admin dashboard for hospitals, clinics, and medical startups featuring appointment tracking, patient analytics, revenue monitoring, and responsive layouts.", "price": 2999, "category": "Healthcare", "coverImage": "/images/products/healthcare_dashboard.jpg", "tags": ["Healthcare", "Dashboard", "Admin", "Medical"], "isBestSeller": true },
  { "title": "Clinic Appointment Website Kit", "slug": "clinic-appointment-website-kit", "description": "Professional healthcare website kit including doctor profiles, appointment booking pages, service sections, testimonials, FAQs, and contact forms.", "price": 1999, "category": "Healthcare", "coverImage": "/images/products/clinic_website.jpg", "tags": ["Healthcare", "Website", "Clinic"], "isFeatured": true },
  { "title": "Startup Business Proposal Pack", "slug": "startup-business-proposal-pack", "description": "Professional proposal templates for startups, agencies, and enterprises including editable presentations, pricing sheets, and project timelines.", "price": 1499, "category": "Business Templates", "coverImage": "/images/products/startup_proposal.jpg", "tags": ["Business", "Proposal", "Startup"] },
  { "title": "Business Finance Dashboard", "slug": "business-finance-dashboard", "description": "Interactive finance dashboard for businesses featuring sales analytics, expenses, revenue forecasting, and performance metrics.", "price": 2499, "category": "Business Templates", "coverImage": "/images/products/finance_dashboard.jpg", "tags": ["Finance", "Dashboard", "Analytics"] },
  { "title": "AI Workflow Automation Kit", "slug": "ai-workflow-automation-kit", "description": "Ready-to-use automation workflows for productivity, CRM, customer support, and AI-powered business processes.", "price": 2799, "category": "Automation", "coverImage": "/images/products/ai_workflow.jpg", "tags": ["AI", "Automation", "Workflow"] },
  { "title": "Marketing Automation Suite", "slug": "marketing-automation-suite", "description": "Automate email marketing, lead generation, CRM synchronization, and customer engagement with no-code workflows.", "price": 2299, "category": "Automation", "coverImage": "/images/products/marketing_automation.jpg", "tags": ["Marketing", "Automation", "CRM"] },
  { "title": "Modern SaaS Website Kit", "slug": "modern-saas-website-kit", "description": "Professional React website template optimized for startups, SaaS products, and software businesses.", "price": 3499, "category": "Website Kits", "coverImage": "/images/products/saas_website.jpg", "tags": ["SaaS", "Website", "React"] },
  { "title": "Creative Portfolio Website Kit", "slug": "creative-portfolio-website-kit", "description": "Responsive portfolio template for designers, developers, photographers, and freelancers.", "price": 2199, "category": "Website Kits", "coverImage": "/images/products/portfolio_website.jpg", "tags": ["Portfolio", "Website", "Creative"] },
  { "title": "Ultimate ChatGPT Prompt Library", "slug": "ultimate-chatgpt-prompt-library", "description": "2,000+ optimized prompts for marketing, coding, business, education, productivity, and content creation.", "price": 999, "category": "AI Prompt Bundles", "coverImage": "/images/products/chatgpt_library.jpg", "tags": ["ChatGPT", "Prompts", "AI"] },
  { "title": "AI Business Prompt Collection", "slug": "ai-business-prompt-collection", "description": "Premium prompts designed for entrepreneurs, consultants, agencies, and AI-powered businesses.", "price": 799, "category": "AI Prompt Bundles", "coverImage": "/images/products/ai_business.jpg", "tags": ["Business", "Prompts", "AI"] },
  { "title": "Complete Social Media Content Kit", "slug": "complete-social-media-content-kit", "description": "500+ editable social media templates for marketing, branding, promotions, and engagement.", "price": 1299, "category": "Social Media Bundles", "coverImage": "/images/products/social_media_kit.jpg", "tags": ["Social Media", "Templates", "Marketing"] },
  { "title": "Canva Marketing Bundle", "slug": "canva-marketing-bundle", "description": "Professional editable Canva templates for social campaigns, ads, stories, and promotions.", "price": 899, "category": "Social Media Bundles", "coverImage": "/images/products/canva_bundle.jpg", "tags": ["Canva", "Marketing", "Templates"] },
  { "title": "Agency Starter Pack", "slug": "agency-starter-pack", "description": "Complete toolkit for digital agencies including CRM, proposals, invoices, onboarding, and client management.", "price": 3299, "category": "Agency Kits", "coverImage": "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=800", "tags": ["Agency", "Toolkit", "Management"] },
  { "title": "Client Management Suite", "slug": "client-management-suite", "description": "Professional client management system for agencies with project tracking and invoicing.", "price": 2899, "category": "Agency Kits", "coverImage": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", "tags": ["Client", "Management", "System"] },
  { "title": "Instagram Growth Bundle", "slug": "instagram-growth-bundle", "description": "Premium collection of editable Instagram templates to increase engagement and brand visibility.", "price": 999, "category": "Instagram Bundles", "coverImage": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800", "tags": ["Instagram", "Growth", "Templates"] },
  { "title": "Reels Creator Pack", "slug": "reels-creator-pack", "description": "High-converting Instagram Reels templates optimized for creators, influencers, and businesses.", "price": 799, "category": "Instagram Bundles", "coverImage": "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800", "tags": ["Reels", "Instagram", "Creator"] }
];

async function seed() {
  console.log('Seeding original mock data...');

  // 1. Delete all existing products and categories to avoid duplicates
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  
  // 2. Insert Categories
  const categoryMap = {};
  for (const cat of categories) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        displayOrder: cat.displayOrder,
        status: 'ACTIVE'
      }
    });
    categoryMap[cat.name] = createdCat.id;
  }
  console.log(`Inserted ${categories.length} categories.`);

  // 3. Insert Products
  for (const prod of products) {
    const categoryId = categoryMap[prod.category];
    if (!categoryId) {
      console.warn(`Category ${prod.category} not found for product ${prod.title}`);
      continue;
    }

    await prisma.product.create({
      data: {
        categoryId,
        name: prod.title,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        thumbnail: prod.coverImage,
        tags: JSON.stringify(prod.tags),
        bestSeller: prod.isBestSeller || false,
        featured: prod.isFeatured || false,
        status: 'ACTIVE'
      }
    });
  }
  console.log(`Inserted ${products.length} products.`);
  
  console.log('Seeding complete!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
