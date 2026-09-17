// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

// Helper to calculate Category Quality Score (0-100%)
function calculateQualityScore(cat: any): number {
  let score = 0;
  // Name + Slug: 10%
  if (cat.name && cat.slug) score += 10;
  // Hierarchy: 10%
  score += 10;
  // Description: 15%
  if (cat.description && cat.description.length > 20) score += 15;
  else if (cat.shortDescription) score += 8;
  // Banner + Alt Text: 10%
  if (cat.banner || cat.image) score += 10;
  // Active Products: 15%
  const prodCount = cat.productCount || (cat._count?.products) || 0;
  if (prodCount > 0) score += 15;
  // Attribute Set: 15%
  if (cat.attributeConfig && Object.keys(cat.attributeConfig).length > 0) score += 15;
  // SEO Meta: 15%
  if (cat.seoTitle && cat.seoDescription) score += 15;
  else if (cat.seoTitle || cat.seoDescription) score += 8;
  // Breadcrumb + Canonical: 5%
  if (cat.canonicalUrl || cat.slug) score += 5;
  // Navigation: 5%
  score += 5;

  return Math.min(100, score);
}

// ============================================================================
// 1. PUBLIC CATEGORIES (Storefront Navigation & Catalog)
// ============================================================================
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCategories = await prisma.category.findMany({
      where: {
        status: { in: ['ACTIVE', 'PUBLISHED'] }
      },
      include: {
        parent: true,
        children: {
          where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
          include: {
            _count: { select: { products: true } }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: { select: { products: true } }
      },
      orderBy: { displayOrder: 'asc' }
    });

    const allProducts = await prisma.product.findMany({
      where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
      select: { 
        categoryId: true, 
        subcategoryId: true,
        subcategory: true, 
        placementType: true,
        category: { select: { name: true, slug: true } } 
      }
    });

    const mapped = rawCategories.map(cat => {
      const children = (cat.children || []).map(child => {
        const subCount = allProducts.filter(p => 
          p.subcategoryId === child.id ||
          p.subcategory?.toLowerCase() === child.name.toLowerCase() || 
          p.subcategory?.toLowerCase() === child.slug.toLowerCase() ||
          p.categoryId === child.id
        ).length;
        const totalSubCount = Math.max(child._count?.products || 0, subCount);
        return {
          ...child,
          count: totalSubCount,
          productCount: totalSubCount
        };
      });

      const parentDirectCount = allProducts.filter(p => 
        p.categoryId === cat.id && (!p.subcategoryId || p.placementType === 'PRIMARY')
      ).length || (cat._count?.products || 0);
      const subTotalCount = children.reduce((sum, c) => sum + (c.count || 0), 0);
      const totalParentCount = Math.max(parentDirectCount + subTotalCount, cat._count?.products || 0);

      return {
        ...cat,
        count: totalParentCount,
        productCount: totalParentCount,
        children
      };
    });

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. ADMIN CATEGORIES (Table with Advanced Filters, Pagination & Sorting)
// ============================================================================
export const getAdminCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      search, 
      parentId, 
      status, 
      hasProducts, 
      missingBanner, 
      seoIncomplete, 
      isFeatured,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      page = 1, 
      limit = 50 
    } = req.query;

    const whereClause: any = {};

    // Search by name, slug, or category code
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { categoryCode: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Filter by Parent Category
    if (parentId !== undefined && parentId !== '') {
      if (parentId === 'root' || parentId === 'null') {
        whereClause.parentId = null;
      } else {
        whereClause.parentId = String(parentId);
      }
    }

    // Filter by Status
    if (status && status !== 'all') {
      whereClause.status = String(status).toUpperCase();
    }

    // Filter by Banner Missing
    if (missingBanner === 'true') {
      whereClause.banner = null;
      whereClause.image = null;
    }

    // Filter by Featured
    if (isFeatured === 'true') {
      whereClause.featured = true;
    }

    // Filter by SEO incomplete
    if (seoIncomplete === 'true') {
      whereClause.OR = [
        { seoTitle: null },
        { seoDescription: null }
      ];
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, status: true, featured: true, image: true, banner: true, description: true } },
        _count: { select: { products: true, bundles: true } }
      },
      orderBy: { [String(sortBy)]: String(sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc' }
    });

    // Query all products for accurate status counts breakdown
    const allProducts = await prisma.product.findMany({
      select: { 
        categoryId: true, 
        subcategoryId: true,
        status: true,
        publishScheduledAt: true
      }
    });

    const now = new Date();

    let mapped = categories.map(cat => {
      const catProducts = allProducts.filter(p => p.categoryId === cat.id || p.subcategoryId === cat.id);
      
      const totalCount = catProducts.length + (cat._count?.bundles || 0);
      const activeCount = catProducts.filter(p => ['ACTIVE', 'PUBLISHED'].includes((p.status || '').toUpperCase())).length;
      const scheduledCount = catProducts.filter(p => (p.status || '').toUpperCase() === 'SCHEDULED' || (p.publishScheduledAt && new Date(p.publishScheduledAt) > now)).length;
      const draftCount = catProducts.filter(p => (p.status || '').toUpperCase() === 'DRAFT').length;
      const archivedCount = catProducts.filter(p => (p.status || '').toUpperCase() === 'ARCHIVED').length;

      const quality = calculateQualityScore({ ...cat, productCount: totalCount });

      return {
        ...cat,
        productCount: totalCount,
        total_product_count: totalCount,
        activeProductCount: activeCount,
        active_product_count: activeCount,
        scheduledProductCount: scheduledCount,
        scheduled_product_count: scheduledCount,
        draftProductCount: draftCount,
        draft_product_count: draftCount,
        archivedProductCount: archivedCount,
        archived_product_count: archivedCount,
        qualityScore: quality,
        level: cat.parentId ? 2 : 1
      };
    });

    // Post-query filtering for products count
    if (hasProducts === 'true') {
      mapped = mapped.filter(c => c.productCount > 0);
    } else if (hasProducts === 'false') {
      mapped = mapped.filter(c => c.productCount === 0);
    }

    const total = mapped.length;
    const p = Number(page) || 1;
    const l = Number(limit) || 50;
    const paginated = mapped.slice((p - 1) * l, p * l);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. GET CATEGORY BY ID (Full Hierarchy, Products, SEO, Attributes, Counts)
// ============================================================================
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        parent: { include: { parent: true } },
        children: { include: { _count: { select: { products: true, bundles: true } } } },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPrice: true,
            status: true,
            thumbnail: true,
            featured: true,
            googleDriveFileId: true,
            googleDriveLinks: true,
            publishScheduledAt: true,
            createdAt: true
          }
        },
        bundles: {
          where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            status: true,
            coverImage: true,
            featured: true,
            itemsIncluded: true
          }
        },
        _count: { select: { products: true, bundles: true } }
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const childIds = (category.children || []).map(c => c.id);
    const categoryProducts = await prisma.product.findMany({
      where: {
        OR: [
          { categoryId: category.id },
          { subcategoryId: category.id },
          ...(childIds.length > 0 ? [{ subcategoryId: { in: childIds } }, { categoryId: { in: childIds } }] : [])
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        discountPrice: true,
        status: true,
        thumbnail: true,
        googleDriveFileId: true,
        googleDriveLinks: true,
        publishScheduledAt: true,
        createdAt: true
      }
    });

    const now = new Date();
    const totalCount = categoryProducts.length + category.bundles.length;
    const activeCount = categoryProducts.filter(p => ['ACTIVE', 'PUBLISHED'].includes((p.status || '').toUpperCase())).length;
    const scheduledCount = categoryProducts.filter(p => (p.status || '').toUpperCase() === 'SCHEDULED' || (p.publishScheduledAt && new Date(p.publishScheduledAt) > now)).length;
    const draftCount = categoryProducts.filter(p => (p.status || '').toUpperCase() === 'DRAFT').length;
    const archivedCount = categoryProducts.filter(p => (p.status || '').toUpperCase() === 'ARCHIVED').length;

    const quality = calculateQualityScore({ ...category, productCount: totalCount });

    res.json({
      success: true,
      data: {
        ...category,
        products: categoryProducts,
        productCount: totalCount,
        total_product_count: totalCount,
        activeProductCount: activeCount,
        active_product_count: activeCount,
        scheduledProductCount: scheduledCount,
        scheduled_product_count: scheduledCount,
        draftProductCount: draftCount,
        draft_product_count: draftCount,
        archivedProductCount: archivedCount,
        archived_product_count: archivedCount,
        qualityScore: quality
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3B. GET CATEGORY PRODUCTS (Dedicated Paginated Product List with Filters)
// ============================================================================
export const getCategoryProductsList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { search, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, categoryCode: true }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const whereClause: any = { categoryId: id };

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'ALL') {
      whereClause.status = String(status).toUpperCase();
    }

    const p = Number(page) || 1;
    const l = Number(limit) || 20;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          productCode: true,
          name: true,
          slug: true,
          price: true,
          discountPrice: true,
          status: true,
          thumbnail: true,
          coverImage: true,
          googleDriveFileId: true,
          googleDriveLinks: true,
          productType: true,
          totalUnitsSold: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { [String(sortBy)]: String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc' },
        skip: (p - 1) * l,
        take: l
      }),
      prisma.product.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        category,
        products,
        pagination: {
          total,
          page: p,
          limit: l,
          totalPages: Math.ceil(total / l)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. CREATE CATEGORY (8-Step Wizard Payload Support)
// ============================================================================
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      categoryCode,
      slug,
      description,
      shortDescription,
      internalNote,
      image,
      icon,
      banner,
      bannerConfig,
      buyingGuide,
      faqs,
      ctaText,
      attributeConfig,
      displayOrder = 0,
      status = 'ACTIVE',
      featured = false,
      featuredPlacement,
      featuredPriority = 0,
      featuredStartDate,
      featuredEndDate,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
      noindex = false,
      includeInSitemap = true,
      parentId,
      publishScheduledAt
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // Clean & validate slug
    let finalSlug = (slug && slug.trim() !== '')
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check slug collision
    const existingSlug = await prisma.category.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    // Auto-generate Category Code if omitted (e.g. CAT-TEMPL-01)
    let finalCode = categoryCode && categoryCode.trim() !== ''
      ? categoryCode.trim().toUpperCase()
      : `CAT-${name.trim().substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Validate unique displayOrder
    let finalDisplayOrder = Number(displayOrder) || 0;
    if (finalDisplayOrder > 0) {
      const conflictingCat = await prisma.category.findFirst({
        where: { displayOrder: finalDisplayOrder }
      });
      if (conflictingCat) {
        return res.status(400).json({
          success: false,
          message: `Display sort order #${finalDisplayOrder} is already in use by category "${conflictingCat.name}". Each category must have a unique sort order.`
        });
      }
    } else {
      const maxOrderCat = await prisma.category.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true }
      });
      finalDisplayOrder = (maxOrderCat?.displayOrder || 0) + 1;
    }

    const quality = calculateQualityScore({
      name,
      slug: finalSlug,
      description,
      shortDescription,
      banner,
      image,
      seoTitle,
      seoDescription,
      attributeConfig
    });

    const categoryImage = image || banner || null;
    const finalDescription = description || shortDescription || null;
    const finalShortDescription = shortDescription || (description ? description.substring(0, 160) : null);

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        categoryCode: finalCode,
        slug: finalSlug,
        description: finalDescription,
        shortDescription: finalShortDescription,
        internalNote: internalNote || null,
        image: categoryImage,
        icon: icon || null,
        banner: categoryImage,
        bannerConfig: bannerConfig || null,
        buyingGuide: buyingGuide || null,
        faqs: faqs || null,
        ctaText: ctaText || null,
        attributeConfig: attributeConfig || null,
        displayOrder: finalDisplayOrder,
        status: status || 'ACTIVE',
        featured: !!featured,
        featuredPlacement: featuredPlacement || null,
        featuredPriority: Number(featuredPriority) || 0,
        featuredStartDate: featuredStartDate ? new Date(featuredStartDate) : null,
        featuredEndDate: featuredEndDate ? new Date(featuredEndDate) : null,
        seoTitle: seoTitle || `${name.trim()} | KDW Digital Store`,
        seoDescription: seoDescription || finalShortDescription || finalDescription || null,
        seoKeywords: seoKeywords || null,
        canonicalUrl: canonicalUrl || `/categories/${finalSlug}`,
        ogImage: ogImage || categoryImage || null,
        noindex: !!noindex,
        includeInSitemap: includeInSitemap !== false,
        parentId: parentId && parentId !== '' && parentId !== 'root' ? parentId : null,
        publishScheduledAt: publishScheduledAt ? new Date(publishScheduledAt) : null,
        qualityScore: quality
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. UPDATE CATEGORY
// ============================================================================
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.slug !== undefined) {
      dataToUpdate.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (body.description !== undefined) {
      dataToUpdate.description = body.description;
      if (body.shortDescription === undefined && (!existing.shortDescription || existing.shortDescription === '')) {
        dataToUpdate.shortDescription = body.description ? body.description.substring(0, 160) : '';
      }
    }
    if (body.shortDescription !== undefined) dataToUpdate.shortDescription = body.shortDescription;
    if (body.internalNote !== undefined) dataToUpdate.internalNote = body.internalNote;
    if (body.image !== undefined) {
      dataToUpdate.image = body.image;
      if (body.banner === undefined) dataToUpdate.banner = body.image;
    }
    if (body.banner !== undefined) {
      dataToUpdate.banner = body.banner;
      if (body.image === undefined) dataToUpdate.image = body.banner;
    }
    if (body.bannerConfig !== undefined) dataToUpdate.bannerConfig = body.bannerConfig;
    if (body.buyingGuide !== undefined) dataToUpdate.buyingGuide = body.buyingGuide;
    if (body.faqs !== undefined) dataToUpdate.faqs = body.faqs;
    if (body.ctaText !== undefined) dataToUpdate.ctaText = body.ctaText;
    if (body.attributeConfig !== undefined) dataToUpdate.attributeConfig = body.attributeConfig;
    if (body.displayOrder !== undefined) {
      const parsedOrder = Number(body.displayOrder);
      if (parsedOrder > 0 && parsedOrder !== existing.displayOrder) {
        const conflictingCat = await prisma.category.findFirst({
          where: { displayOrder: parsedOrder, id: { not: id } }
        });
        if (conflictingCat) {
          return res.status(400).json({
            success: false,
            message: `Display sort order #${parsedOrder} is already in use by category "${conflictingCat.name}". Each category must have a unique sort order.`
          });
        }
      }
      dataToUpdate.displayOrder = parsedOrder;
    }
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.featured !== undefined) dataToUpdate.featured = !!body.featured;
    if (body.featuredPlacement !== undefined) dataToUpdate.featuredPlacement = body.featuredPlacement;
    if (body.featuredPriority !== undefined) dataToUpdate.featuredPriority = Number(body.featuredPriority);
    if (body.featuredStartDate !== undefined) dataToUpdate.featuredStartDate = body.featuredStartDate ? new Date(body.featuredStartDate) : null;
    if (body.featuredEndDate !== undefined) dataToUpdate.featuredEndDate = body.featuredEndDate ? new Date(body.featuredEndDate) : null;
    if (body.seoTitle !== undefined) dataToUpdate.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) dataToUpdate.seoDescription = body.seoDescription;
    if (body.seoKeywords !== undefined) dataToUpdate.seoKeywords = body.seoKeywords;
    if (body.canonicalUrl !== undefined) dataToUpdate.canonicalUrl = body.canonicalUrl;
    if (body.ogImage !== undefined) dataToUpdate.ogImage = body.ogImage;
    if (body.noindex !== undefined) dataToUpdate.noindex = !!body.noindex;
    if (body.includeInSitemap !== undefined) dataToUpdate.includeInSitemap = !!body.includeInSitemap;
    if (body.parentId !== undefined) {
      dataToUpdate.parentId = body.parentId && body.parentId !== '' && body.parentId !== 'root' ? body.parentId : null;
    }

    // Re-calculate quality score
    dataToUpdate.qualityScore = calculateQualityScore({ ...existing, ...dataToUpdate });

    const updated = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
      include: {
        parent: true,
        children: true
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. DELETE / ARCHIVE CATEGORY
// ============================================================================
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, forceDelete } = req.body || {};

    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Default to safe archive instead of hard destructive delete
    if (!forceDelete) {
      const archived = await prisma.category.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          internalNote: reason ? `Archived: ${reason}` : 'Archived by administrator'
        }
      });
      return res.json({ success: true, message: 'Category archived successfully', data: archived });
    }

    // Unlink products to Uncategorized fallback category
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      let uncategorized = await prisma.category.findUnique({ where: { slug: 'uncategorized' } });
      if (!uncategorized) {
        uncategorized = await prisma.category.create({
          data: {
            name: 'Uncategorized',
            slug: 'uncategorized',
            description: 'Default category for unassigned products',
            status: 'ACTIVE'
          }
        });
      }
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: uncategorized.id }
      });
    }

    // Move child subcategories to root
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category removed successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. CATEGORY TREE (Hierarchical Nodes with Cycle Prevention)
// ============================================================================
export const getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allCategories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { displayOrder: 'asc' }
    });

    // Build recursive tree
    const categoryMap: Record<string, any> = {};
    allCategories.forEach(c => {
      categoryMap[c.id] = {
        ...c,
        productCount: c._count?.products || 0,
        children: []
      };
    });

    const rootNodes: any[] = [];
    allCategories.forEach(c => {
      if (c.parentId && categoryMap[c.parentId]) {
        categoryMap[c.parentId].children.push(categoryMap[c.id]);
      } else {
        rootNodes.push(categoryMap[c.id]);
      }
    });

    res.json({ success: true, data: rootNodes });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. MOVE CATEGORY (Hierarchy Relocation with 301 Redirect Generation)
// ============================================================================
export const moveCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newParentId } = req.body;

    if (id === newParentId) {
      return res.status(400).json({ success: false, message: 'A category cannot be its own parent.' });
    }

    // Check if new parent is a descendant of current category (cycle prevention)
    const allCategories = await prisma.category.findMany({});
    
    function isDescendant(targetId: string, parentIdToCheck: string): boolean {
      const children = allCategories.filter(c => c.parentId === targetId);
      for (const child of children) {
        if (child.id === parentIdToCheck) return true;
        if (isDescendant(child.id, parentIdToCheck)) return true;
      }
      return false;
    }

    if (newParentId && isDescendant(id, newParentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Circular relationship: A category cannot be moved inside its own descendant.' 
      });
    }

    const oldCategory = await prisma.category.findUnique({ where: { id } });
    if (!oldCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const targetParent = newParentId ? await prisma.category.findUnique({ where: { id: newParentId } }) : null;

    // Transaction to update parent and create 301 redirect
    const updated = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.update({
        where: { id },
        data: { parentId: newParentId || null },
        include: { parent: true, children: true }
      });

      // If URL structure changed, record 301 redirect
      const oldPath = `/categories/${oldCategory.slug}`;
      const newPath = targetParent 
        ? `/categories/${targetParent.slug}/${oldCategory.slug}`
        : `/categories/${oldCategory.slug}`;

      if (oldPath !== newPath) {
        await tx.categoryRedirect.upsert({
          where: { oldPath },
          update: { newPath, isActive: true },
          create: {
            oldPath,
            newPath,
            redirectType: '301_PERMANENT',
            reason: `Category moved under ${targetParent ? targetParent.name : 'Root'}`
          }
        });
      }

      return cat;
    });

    res.json({ success: true, message: 'Category moved successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. REORDER CATEGORIES (Batch Display Order Update)
// ============================================================================
export const reorderCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body; // Array of { id: string, displayOrder: number, parentId?: string }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: items array required.' });
    }

    await prisma.$transaction(
      items.map(item => 
        prisma.category.update({
          where: { id: item.id },
          data: {
            displayOrder: Number(item.displayOrder),
            ...(item.parentId !== undefined ? { parentId: item.parentId || null } : {})
          }
        })
      )
    );

    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. MERGE CATEGORIES (Source -> Target Product & Subcategory Migration)
// ============================================================================
export const mergeCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceCategoryId, targetCategoryId, createRedirect = true } = req.body;

    if (sourceCategoryId === targetCategoryId) {
      return res.status(400).json({ success: false, message: 'Source and target categories must be distinct.' });
    }

    const [source, target] = await Promise.all([
      prisma.category.findUnique({ where: { id: sourceCategoryId } }),
      prisma.category.findUnique({ where: { id: targetCategoryId } })
    ]);

    if (!source || !target) {
      return res.status(404).json({ success: false, message: 'Source or Target category not found.' });
    }

    // Execute merge in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Move all products
      const updatedProducts = await tx.product.updateMany({
        where: { categoryId: sourceCategoryId },
        data: { categoryId: targetCategoryId }
      });

      // 2. Move child categories
      await tx.category.updateMany({
        where: { parentId: sourceCategoryId },
        data: { parentId: targetCategoryId }
      });

      // 3. Create 301 redirect from source -> target
      if (createRedirect) {
        await tx.categoryRedirect.upsert({
          where: { oldPath: `/categories/${source.slug}` },
          update: { newPath: `/categories/${target.slug}`, isActive: true },
          create: {
            oldPath: `/categories/${source.slug}`,
            newPath: `/categories/${target.slug}`,
            redirectType: '301_PERMANENT',
            reason: `Merged '${source.name}' into '${target.name}'`
          }
        });
      }

      // 4. Archive source category
      await tx.category.update({
        where: { id: sourceCategoryId },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          internalNote: `Merged into '${target.name}' (${target.id})`
        }
      });

      return {
        productsMigrated: updatedProducts.count,
        targetName: target.name,
        sourceName: source.name
      };
    });

    res.json({ 
      success: true, 
      message: `Successfully merged '${result.sourceName}' into '${result.targetName}'. ${result.productsMigrated} products migrated.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 11. DUPLICATE CATEGORY
// ============================================================================
export const duplicateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const original = await prisma.category.findUnique({ where: { id } });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const newSlug = `${original.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;
    const newCode = `CAT-${original.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const duplicate = await prisma.category.create({
      data: {
        name: `${original.name} (Copy)`,
        categoryCode: newCode,
        slug: newSlug,
        description: original.description,
        shortDescription: original.shortDescription,
        image: original.image,
        icon: original.icon,
        banner: original.banner,
        bannerConfig: original.bannerConfig,
        attributeConfig: original.attributeConfig,
        faqs: original.faqs,
        buyingGuide: original.buyingGuide,
        status: 'DRAFT',
        parentId: original.parentId,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        displayOrder: original.displayOrder + 1
      }
    });

    res.json({ success: true, message: 'Category duplicated as draft', data: duplicate });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 12. ASSIGN / UNASSIGN PRODUCTS TO CATEGORY
// ============================================================================
export const assignProductsToCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { productIds, isPrimary = true } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs array required.' });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (isPrimary) {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { categoryId: id }
      });
    }

    res.json({ 
      success: true, 
      message: `Assigned ${productIds.length} products to ${category.name}` 
    });
  } catch (error) {
    next(error);
  }
};

export const unassignProductFromCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, productId } = req.params;

    let uncategorized = await prisma.category.findUnique({ where: { slug: 'uncategorized' } });
    if (!uncategorized) {
      uncategorized = await prisma.category.create({
        data: {
          name: 'Uncategorized',
          slug: 'uncategorized',
          description: 'Default category for unassigned products',
          status: 'ACTIVE'
        }
      });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { categoryId: uncategorized.id }
    });

    res.json({ success: true, message: 'Product unassigned from category' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 13. CATEGORY ANALYTICS & HEALTH
// ============================================================================
export const getCategoryAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } }
      }
    });

    const products = await prisma.product.findMany({
      select: {
        id: true,
        categoryId: true,
        name: true,
        price: true,
        totalUnitsSold: true,
        totalDownloads: true,
        status: true
      }
    });

    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
      include: { items: true }
    });

    const analytics = categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const activeCount = catProducts.filter(p => p.status === 'ACTIVE' || p.status === 'PUBLISHED').length;
      
      const unitsSold = catProducts.reduce((sum, p) => sum + (p.totalUnitsSold || 0), 0);
      const revenue = catProducts.reduce((sum, p) => sum + ((p.totalUnitsSold || 0) * (p.price || 0)), 0);
      
      // Estimated views & clicks based on sales activity
      const estViews = Math.max(unitsSold * 12 + activeCount * 45, 10);
      const estClicks = Math.max(unitsSold * 3 + activeCount * 15, 2);
      const conversionRate = estViews > 0 ? ((unitsSold / estViews) * 100).toFixed(1) : '0.0';

      const healthWarnings: string[] = [];
      if (activeCount === 0) healthWarnings.push('No active published products.');
      if (cat.qualityScore !== null && cat.qualityScore < 50) healthWarnings.push('Low quality score (< 50%). Missing SEO or banner.');
      if (estViews > 100 && unitsSold === 0) healthWarnings.push('High traffic with zero purchases.');

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        categoryCode: cat.categoryCode,
        productCount: catProducts.length,
        activeProductCount: activeCount,
        unitsSold,
        revenue,
        views: estViews,
        clicks: estClicks,
        conversionRate: `${conversionRate}%`,
        qualityScore: cat.qualityScore || calculateQualityScore(cat),
        healthWarnings
      };
    });

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 14. CATEGORY REDIRECTS (301 Migration Manager)
// ============================================================================
export const checkCategoryRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path } = req.query;
    if (!path) return res.json({ success: true, redirect: null });
    const redirect = await prisma.categoryRedirect.findFirst({
      where: {
        oldPath: path as string,
        isActive: true
      }
    });
    res.json({ success: true, redirect });
  } catch (error) {
    next(error);
  }
};

export const getCategoryRedirects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redirects = await prisma.categoryRedirect.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: redirects });
  } catch (error) {
    next(error);
  }
};

export const createCategoryRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldPath, newPath, redirectType = '301_PERMANENT', reason } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, message: 'Old Path and New Path are required.' });
    }

    if (oldPath === newPath) {
      return res.status(400).json({ success: false, message: 'Redirect loop: Old Path cannot match New Path.' });
    }

    const redirect = await prisma.categoryRedirect.upsert({
      where: { oldPath },
      update: { newPath, redirectType, reason, isActive: true },
      create: { oldPath, newPath, redirectType, reason, isActive: true }
    });

    res.status(201).json({ success: true, data: redirect });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.categoryRedirect.delete({ where: { id } });
    res.json({ success: true, message: 'Redirect deleted' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 15. CATEGORY RULES (Auto-Assignment Engine)
// ============================================================================
export const getCategoryRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await prisma.categoryRule.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

export const createCategoryRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, conditionField, operator, conditionValue, targetCategoryId, isPrimary = true, priority = 0 } = req.body;

    if (!name || !conditionField || !conditionValue || !targetCategoryId) {
      return res.status(400).json({ success: false, message: 'Missing mandatory rule fields.' });
    }

    const rule = await prisma.categoryRule.create({
      data: {
        name,
        conditionField,
        operator: operator || 'CONTAINS',
        conditionValue,
        targetCategoryId,
        isPrimary: !!isPrimary,
        priority: Number(priority) || 0,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const previewCategoryRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conditionField, operator, conditionValue } = req.body;

    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, productType: true, tags: true, categoryId: true, category: { select: { name: true } } }
    });

    const matching = allProducts.filter(p => {
      const val = String((p as any)[conditionField] || '').toLowerCase();
      const target = String(conditionValue).toLowerCase();

      if (operator === 'EQUALS') return val === target;
      if (operator === 'STARTS_WITH') return val.startsWith(target);
      return val.includes(target);
    });

    res.json({ success: true, count: matching.length, products: matching.slice(0, 20) });
  } catch (error) {
    next(error);
  }
};

export const executeCategoryRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const rule = await prisma.categoryRule.findUnique({ where: { id } });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found.' });
    }

    const allProducts = await prisma.product.findMany({});
    const matching = allProducts.filter(p => {
      const val = String((p as any)[rule.conditionField] || '').toLowerCase();
      const target = String(rule.conditionValue).toLowerCase();

      if (rule.operator === 'EQUALS') return val === target;
      if (rule.operator === 'STARTS_WITH') return val.startsWith(target);
      return val.includes(target);
    });

    const ids = matching.map(p => p.id);
    if (ids.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { categoryId: rule.targetCategoryId }
      });
    }

    await prisma.categoryRule.update({
      where: { id },
      data: { executionCount: { increment: 1 } }
    });

    res.json({ success: true, message: `Rule executed. Updated ${ids.length} products.` });
  } catch (error) {
    next(error);
  }
};
