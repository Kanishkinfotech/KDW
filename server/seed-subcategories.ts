import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedSubcategories() {
  try {
    console.log('Seeding subcategories...');

    // Find or create parent categories
    let templatesCat = await prisma.category.findFirst({
      where: { name: { equals: 'Templates', mode: 'insensitive' } }
    });
    if (!templatesCat) {
      templatesCat = await prisma.category.create({
        data: {
          name: 'Templates',
          slug: 'templates',
          description: 'Ready-to-use digital website & application templates',
          status: 'ACTIVE'
        }
      });
    }

    let graphicsCat = await prisma.category.findFirst({
      where: { name: { equals: 'Graphics', mode: 'insensitive' } }
    });
    if (!graphicsCat) {
      graphicsCat = await prisma.category.create({
        data: {
          name: 'Graphics',
          slug: 'graphics',
          description: 'High-quality 3D assets, icon packs, and social media designs',
          status: 'ACTIVE'
        }
      });
    }

    let toolsCat = await prisma.category.findFirst({
      where: { name: { equals: 'Tools', mode: 'insensitive' } }
    });
    if (!toolsCat) {
      toolsCat = await prisma.category.create({
        data: {
          name: 'Tools',
          slug: 'tools',
          description: 'Developer utilities, AI prompt kits, and plugins',
          status: 'ACTIVE'
        }
      });
    }

    // Subcategories for Templates
    const templatesSubs = [
      { name: 'UI Kits', slug: 'ui-kits', description: 'Figma and React UI component kits' },
      { name: 'Dashboard Kits', slug: 'dashboard-kits', description: 'Admin overview and analytics dashboards' },
      { name: 'Landing Pages', slug: 'landing-pages', description: 'High converting landing page templates' }
    ];

    for (const sub of templatesSubs) {
      const existing = await prisma.category.findFirst({ where: { slug: sub.slug } });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            parentId: templatesCat.id,
            status: 'ACTIVE'
          }
        });
        console.log(`Created subcategory: ${sub.name} under Templates`);
      } else if (!existing.parentId) {
        await prisma.category.update({
          where: { id: existing.id },
          data: { parentId: templatesCat.id }
        });
        console.log(`Updated parent of: ${sub.name} to Templates`);
      }
    }

    // Subcategories for Graphics
    const graphicsSubs = [
      { name: '3D Assets', slug: '3d-assets', description: '3D renders and Blender graphic models' },
      { name: 'Icon Packs', slug: 'icon-packs', description: 'Vector icons and custom icon sets' },
      { name: 'Social Posts', slug: 'social-posts', description: 'Canva & Photoshop social media bundles' }
    ];

    for (const sub of graphicsSubs) {
      const existing = await prisma.category.findFirst({ where: { slug: sub.slug } });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            parentId: graphicsCat.id,
            status: 'ACTIVE'
          }
        });
        console.log(`Created subcategory: ${sub.name} under Graphics`);
      } else if (!existing.parentId) {
        await prisma.category.update({
          where: { id: existing.id },
          data: { parentId: graphicsCat.id }
        });
        console.log(`Updated parent of: ${sub.name} to Graphics`);
      }
    }

    // Assign subcategory names to existing products if empty
    const products = await prisma.product.findMany();
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.subcategory) {
        const sampleSub = i % 2 === 0 ? 'UI Kits' : '3D Assets';
        await prisma.product.update({
          where: { id: p.id },
          data: { subcategory: sampleSub }
        });
      }
    }

    console.log('Subcategories seeded successfully!');
  } catch (err) {
    console.error('Error seeding subcategories:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedSubcategories();
