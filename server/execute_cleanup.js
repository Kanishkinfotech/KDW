const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const PRESERVED_PRODUCT_IDS = [
  '3569efef-d1af-4a4c-ab98-23d78579dd42', // Healthcare Management Dashboard
  'c5e393f4-3eef-4eaf-8ce7-87b00c0e9315', // Clinic Appointment Website Kit
  '9c47e11b-c039-45ad-8d1d-709cf1776f8a', // Startup Business Proposal Pack
  '2baef9e5-6606-4ecc-b5d7-f3720cb120b7', // Business Finance Dashboard
  '24995acf-8e98-4cc9-b8c2-2f6a9e8dcf4f', // AI Workflow Automation Kit
  '732dddf7-9306-4a1f-b8a3-7b3c64f686ff', // Marketing Automation Suite
  'd6c45e05-9ce6-491a-b13b-baae5d5cdd1e', // Modern SaaS Website Kit
  'ef00a8f7-e41c-43ed-a5aa-73d1708bcd3e', // Creative Portfolio Website Kit
  'b0dc2787-56d0-4480-b1e0-f551d1830766', // Ultimate ChatGPT Prompt Library
  'c7dcce65-b690-4346-aadb-9c0cd3423eb6', // AI Business Prompt Collection
  '6108ed9b-49a2-442f-837b-c81bf58b4f53', // Complete Social Media Content Kit
  'e799f9e0-ab72-4fb0-bb5e-fcc64dc20e96', // Canva Marketing Bundle
  '22c9e297-aabe-4abd-8f03-9cc634b77507', // Agency Starter Pack
  '2d7a9b2d-8688-463f-a8db-702378f43429', // Client Management Suite
  'd94240e8-1906-4924-9317-412f7d7b08e9', // Instagram Growth Bundle
  '41760233-5a35-4589-bf08-edac9ed26152'  // Reels Creator Pack
];

const SOCIAL_MEDIA_CAT_ID = '657f2597-824a-4388-8d8b-464c090b9706';

async function cleanup() {
  console.log('Starting cleanup...');

  // 1. Move Instagram Growth Bundle & Reels Creator Pack to Social Media Bundles category
  await p.product.update({
    where: { id: 'd94240e8-1906-4924-9317-412f7d7b08e9' },
    data: { categoryId: SOCIAL_MEDIA_CAT_ID }
  });
  await p.product.update({
    where: { id: '41760233-5a35-4589-bf08-edac9ed26152' },
    data: { categoryId: SOCIAL_MEDIA_CAT_ID }
  });
  console.log('Updated category for Instagram products to social-media-bundles');

  // 2. Clear relations for non-preserved products
  const toDeleteProducts = await p.product.findMany({
    where: { id: { notIn: PRESERVED_PRODUCT_IDS } },
    select: { id: true }
  });
  const toDeleteIds = toDeleteProducts.map(x => x.id);
  console.log(`Found ${toDeleteIds.length} products to remove.`);

  if (toDeleteIds.length > 0) {
    // Delete any dependent records
    await p.orderItem.deleteMany({ where: { productId: { in: toDeleteIds } } });
    await p.review.deleteMany({ where: { productId: { in: toDeleteIds } } });
    await p.digitalEntitlement.deleteMany({ where: { productId: { in: toDeleteIds } } });
    
    // Delete the products
    const delRes = await p.product.deleteMany({
      where: { id: { in: toDeleteIds } }
    });
    console.log(`Deleted ${delRes.count} products.`);
  }

  // 3. Delete redundant/test categories: test-cat, instagram-bundles, video-editing-packs
  const redundantSlugs = ['test-cat', 'instagram-bundles', 'video-editing-packs'];
  const delCats = await p.category.deleteMany({
    where: { slug: { in: redundantSlugs } }
  });
  console.log(`Deleted ${delCats.count} redundant categories.`);

  // 4. Verify count
  const remainingProds = await p.product.findMany({
    select: { id: true, name: true, slug: true, category: { select: { name: true, slug: true } } }
  });
  const remainingCats = await p.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: 'asc' }
  });

  console.log(JSON.stringify({
    remainingProductsCount: remainingProds.length,
    remainingProducts: remainingProds.map(x => ({ name: x.name, category: x.category?.name })),
    remainingCategoriesCount: remainingCats.length,
    primaryCategories: remainingCats.filter(c => !c.parentId).map(c => c.name),
    subCategories: remainingCats.filter(c => c.parentId).map(c => c.name)
  }, null, 2));
}

cleanup().catch(console.error).finally(() => p.$disconnect());
