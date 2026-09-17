const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bundles = [
  {
    title: 'The Ultimate Freelancer Bundle',
    slug: 'the-ultimate-freelancer-bundle',
    description: 'Get everything you need to start and scale your freelance business. Includes contracts, invoices, proposal templates, and client onboarding kits.',
    price: 1499.00,
    originalPrice: 2499.00,
    coverImage: '/images/products/freelancer_os_1786372803471.jpg',
    itemsIncluded: 5,
    rating: 5.0,
    featured: true
  },
  {
    title: 'Creator AI Mastery Bundle',
    slug: 'creator-ai-mastery-bundle',
    description: 'All our top-selling AI prompt packs, automation scripts, and Instagram marketing engines in one massively discounted bundle.',
    price: 1999.00,
    originalPrice: 3299.00,
    coverImage: '/images/products/ai_marketing_manager_1786372760826.jpg',
    itemsIncluded: 4,
    rating: 4.9,
    featured: true
  },
  {
    title: 'Digital Marketing Agency Starter Kit',
    slug: 'digital-marketing-agency-starter-kit',
    description: 'Complete client onboarding, contract templates, pitch decks, and delivery roadmaps for growing agencies.',
    price: 2499.00,
    originalPrice: 4199.00,
    coverImage: '/images/products/agency_os_1786372831343.jpg',
    itemsIncluded: 6,
    rating: 5.0,
    featured: true
  },
  {
    title: 'Local Business Social Media System',
    slug: 'local-business-social-media-system',
    description: 'High-converting social media creatives, Instagram carousels, and editable Canva assets for local businesses.',
    price: 699.00,
    originalPrice: 1299.00,
    coverImage: '/images/products/social_media_growth_1786372912072.jpg',
    itemsIncluded: 4,
    rating: 4.8,
    featured: true
  },
  {
    title: 'AI Content Creation Superpack',
    slug: 'ai-content-creation-superpack',
    description: 'Autonomous copywriting workflows, ChatGPT 4.5 prompt engineering frameworks, and video generation blueprints.',
    price: 1799.00,
    originalPrice: 2999.00,
    coverImage: '/images/products/ai_content_system_1786372871748.jpg',
    itemsIncluded: 5,
    rating: 5.0,
    featured: true
  },
  {
    title: 'Real Estate & Property Pro Toolkit',
    slug: 'real-estate-property-pro-toolkit',
    description: 'Lead magnets, luxury listing presentation decks, property brochures, and client intake workflows for real estate brokers.',
    price: 1899.00,
    originalPrice: 3199.00,
    coverImage: '/images/products/real_estate_business_kit_1786372940636.jpg',
    itemsIncluded: 4,
    rating: 4.9,
    featured: true
  },
  {
    title: 'UGC Creator & Influencer Engine',
    slug: 'ugc-creator-influencer-engine',
    description: 'Brand pitch email sequences, UGC rate cards, media kit templates, and usage rights agreements for content creators.',
    price: 1299.00,
    originalPrice: 2199.00,
    coverImage: '/images/products/ugc_creator_kit_1786372786640.jpg',
    itemsIncluded: 5,
    rating: 4.9,
    featured: true
  },
  {
    title: 'Canva & Social Media Mega Suite',
    slug: 'canva-social-media-mega-suite',
    description: '1,500+ aesthetic viral templates, carousel infographics, story highlights, and brand identity guidelines ready in Canva.',
    price: 1199.00,
    originalPrice: 1999.00,
    coverImage: '/images/products/canva_bundle.jpg',
    itemsIncluded: 7,
    rating: 5.0,
    featured: true
  }
];

async function seedBundles() {
  console.log('Seeding bundles...');
  for (const b of bundles) {
    await prisma.bundle.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        description: b.description,
        price: b.price,
        originalPrice: b.originalPrice,
        coverImage: b.coverImage,
        rating: b.rating,
        itemsIncluded: b.itemsIncluded,
        status: 'ACTIVE',
        featured: b.featured
      },
      create: {
        title: b.title,
        slug: b.slug,
        description: b.description,
        price: b.price,
        originalPrice: b.originalPrice,
        coverImage: b.coverImage,
        rating: b.rating,
        itemsIncluded: b.itemsIncluded,
        status: 'ACTIVE',
        featured: b.featured
      }
    });
    console.log(`✓ Seeded bundle: ${b.title}`);
  }
  console.log('Seeded all bundles successfully!');
}

seedBundles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
