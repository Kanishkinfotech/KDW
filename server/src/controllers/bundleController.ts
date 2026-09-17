// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import crypto from 'crypto';

// Helper to check Google Drive link validity
const checkProductDeliveryLink = (product: any): { hasLink: boolean; link: string | null } => {
  if (!product) return { hasLink: false, link: null };
  if (product.googleDriveFileId && product.googleDriveFileId.trim() !== '') {
    return { hasLink: true, link: `https://drive.google.com/file/d/${product.googleDriveFileId}/view?usp=sharing` };
  }
  if (product.googleDriveLinks) {
    try {
      const parsed = typeof product.googleDriveLinks === 'string' ? JSON.parse(product.googleDriveLinks) : product.googleDriveLinks;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.trim()) {
        const l = parsed[0].trim();
        return { hasLink: true, link: l.startsWith('http') ? l : `https://drive.google.com/file/d/${l}/view?usp=sharing` };
      }
    } catch (e) {}
  }
  return { hasLink: false, link: null };
};

// Auto-generate Slug
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getValidActorId = async (req: Request): Promise<string | null> => {
  const userId = (req as any).user?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user ? user.id : null;
};

// ============================================================================
// 1. GET ALL BUNDLES (With Multi-Criteria Filtering, Aggregations & Pagination)
// ============================================================================
export const getBundles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      status,
      licenceType,
      categoryId,
      minPrice,
      maxPrice,
      minProducts,
      maxProducts,
      version,
      featured,
      highRefundRate,
      lowSales,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 30
    } = req.query;

    const whereClause: any = {};

    // Search query
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { bundleCode: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Status filter
    if (status === 'ALL') {
      // Explicit ALL: allow admin to retrieve all bundles (ACTIVE, DRAFT, ARCHIVED)
    } else if (status && String(status).trim() !== '') {
      const s = String(status).toUpperCase();
      if (s === 'ACTIVE' || s === 'PUBLISHED') {
        whereClause.status = { in: ['ACTIVE', 'PUBLISHED'] };
      } else {
        whereClause.status = s;
      }
    } else {
      // Default for storefront: only return live ACTIVE and PUBLISHED bundles (never ARCHIVED or DRAFT)
      whereClause.status = { in: ['ACTIVE', 'PUBLISHED'] };
    }

    // Licence Type filter
    if (licenceType && licenceType !== 'ALL') {
      whereClause.licenceType = String(licenceType).toUpperCase();
    }

    // Category filter
    if (categoryId && categoryId !== 'ALL') {
      whereClause.categoryId = String(categoryId);
    }

    // Featured filter
    if (featured === 'true') {
      whereClause.featured = true;
    }

    // Version filter
    if (version && String(version).trim() !== '') {
      whereClause.currentVersion = String(version).trim();
    }

    // Price range
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(String(minPrice));
      if (maxPrice) whereClause.price.lte = parseFloat(String(maxPrice));
    }

    // High Refund Rate (> 5%)
    if (highRefundRate === 'true') {
      whereClause.refundRate = { gt: 5 };
    }

    // Low Sales (< 5)
    if (lowSales === 'true') {
      whereClause.salesCount = { lt: 5 };
    }

    // Date range
    if (createdFrom || createdTo) {
      whereClause.createdAt = {};
      if (createdFrom) whereClause.createdAt.gte = new Date(String(createdFrom));
      if (createdTo) whereClause.createdAt.lte = new Date(String(createdTo));
    }

    const p = Number(page) || 1;
    const l = Number(limit) || 30;

    const [bundles, total] = await Promise.all([
      prisma.bundle.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          bundleItems: {
            orderBy: { displayOrder: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  thumbnail: true,
                  status: true,
                  googleDriveFileId: true,
                  googleDriveLinks: true,
                  licenceType: true,
                  version: true,
                  category: { select: { id: true, name: true } }
                }
              }
            }
          },
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              orderItems: true,
              entitlements: true
            }
          }
        },
        orderBy: { [String(sortBy)]: String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc' },
        skip: (p - 1) * l,
        take: l
      }),
      prisma.bundle.count({ where: whereClause })
    ]);

    const now = new Date();

    // Fetch active promotional offers from prisma.offer that apply to bundles
    const activeBundlePromos = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        offerType: { in: ['BUNDLE_OFFER', 'BUNDLE_DEAL', 'FLASH_SALE', 'TIME_LIMITED'] },
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
      },
      orderBy: { priority: 'asc' }
    });

    // Format & enrich with dynamic calculations
    const enriched = bundles.map(bundle => {
      const items = bundle.bundleItems || [];
      const componentCount = items.length;

      // Combined component value
      const combinedValue = items.reduce((sum, item) => sum + (item.product?.price || item.referencePriceSnapshot || 0), 0);
      const rawOriginal = bundle.originalPrice > 0 ? bundle.originalPrice : combinedValue;
      const rawDiscounted = bundle.price;

      // Check if an active promotional offer applies to this bundle
      const matchingOffer = activeBundlePromos.find(offer => {
        const placement = offer.displayPlacement || 'ALL_PLACEMENTS';
        if (placement !== 'ALL_PLACEMENTS' && placement !== 'BUNDLE_SECTION' && placement !== 'BANNER_AND_PRODUCT') {
          return false;
        }

        let bIds: string[] = [];
        try {
          if (offer.bundleIds) {
            bIds = typeof offer.bundleIds === 'string' ? JSON.parse(offer.bundleIds) : offer.bundleIds;
          }
        } catch {
          bIds = [];
        }

        if (['BUNDLE_OFFER', 'BUNDLE_DEAL'].includes(offer.offerType)) {
          return bIds.length === 0 || bIds.includes(bundle.id);
        }

        if (['FLASH_SALE', 'TIME_LIMITED'].includes(offer.offerType)) {
          return bIds.length > 0 && bIds.includes(bundle.id);
        }

        return false;
      });

      let isDealExpired = Boolean(bundle.offerEndAt && now > new Date(bundle.offerEndAt));
      let isDealActive = Boolean(bundle.offerEndAt && now <= new Date(bundle.offerEndAt) && (!bundle.offerStartAt || now >= new Date(bundle.offerStartAt)));
      let effectivePrice = isDealExpired ? (rawOriginal > 0 ? rawOriginal : rawDiscounted) : rawDiscounted;
      let effectiveOriginalPrice = rawOriginal > 0 ? rawOriginal : effectivePrice;
      let activeDeal: any = null;

      if (matchingOffer) {
        let promoPrice = rawDiscounted;
        if (matchingOffer.discountType === 'PERCENTAGE') {
          promoPrice = Math.max(0, Math.round(rawDiscounted * (1 - matchingOffer.discountValue / 100)));
        } else if (matchingOffer.discountType === 'FIXED') {
          promoPrice = Math.max(0, rawDiscounted - matchingOffer.discountValue);
        } else if (matchingOffer.discountType === 'FLAT_PRICE') {
          promoPrice = matchingOffer.discountValue;
        }

        effectivePrice = promoPrice;
        effectiveOriginalPrice = rawOriginal > 0 ? rawOriginal : rawDiscounted;
        isDealActive = true;
        isDealExpired = false;

        activeDeal = {
          offerId: matchingOffer.id,
          offerName: matchingOffer.name,
          offerType: matchingOffer.offerType,
          badgeText: matchingOffer.badgeText || (matchingOffer.discountType === 'PERCENTAGE' ? `${matchingOffer.discountValue}% OFF` : 'BUNDLE DEAL'),
          bannerText: matchingOffer.bannerText || null,
          discountType: matchingOffer.discountType,
          discountValue: matchingOffer.discountValue,
          effectivePrice: promoPrice,
          originalPrice: effectiveOriginalPrice,
          endAt: matchingOffer.endAt,
          startAt: matchingOffer.startAt
        };
      }

      const discountAmount = isDealExpired ? 0 : Math.max(0, effectiveOriginalPrice - effectivePrice);
      const discountPercent = isDealExpired ? 0 : (effectiveOriginalPrice > 0 ? Math.round((discountAmount / effectiveOriginalPrice) * 100) : 0);

      // Check delivery link status
      let configuredLinks = 0;
      items.forEach(item => {
        if (checkProductDeliveryLink(item.product).hasLink) {
          configuredLinks++;
        }
      });

      const isDriveFullyConfigured = bundle.deliveryMode === 'BUNDLE_LINK'
        ? !!(bundle.googleDriveLink || bundle.googleDriveFileId)
        : configuredLinks === componentCount && componentCount > 0;

      return {
        ...bundle,
        price: effectivePrice,
        originalPrice: effectiveOriginalPrice,
        effectivePrice,
        isDealActive,
        isDealExpired,
        activeDeal,
        offerEndAt: activeDeal?.endAt || bundle.offerEndAt,
        componentCount,
        combinedValue,
        discount: discountAmount,
        discountAmount,
        discountPercent,
        configuredLinks,
        missingLinks: componentCount - configuredLinks,
        isDriveFullyConfigured,
        sales: bundle.salesCount || bundle._count?.orderItems || 0,
        revenue: bundle.revenue || (bundle.salesCount || bundle._count?.orderItems || 0) * effectivePrice
      };
    });

    res.json({
      success: true,
      data: enriched,
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
// 2. GET BUNDLE BY ID / SLUG (Full Deep Details & Diagnostics)
// ============================================================================
export const getBundleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const bundle = await prisma.bundle.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { bundleCode: id }]
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        bundleItems: {
          orderBy: { displayOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
                slug: true,
                price: true,
                thumbnail: true,
                status: true,
                googleDriveFileId: true,
                googleDriveLinks: true,
                licenceType: true,
                version: true,
                category: { select: { id: true, name: true } }
              }
            }
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            orderItems: true,
            entitlements: true
          }
        }
      }
    });

    if (!bundle) {
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    }

    const userRole = (req as any).user?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (bundle.status === 'ARCHIVED' && !isAdmin) {
      return res.status(404).json({ success: false, message: 'This bundle has been archived and is no longer available.' });
    }

    // Component calculations
    const items = bundle.bundleItems || [];
    const combinedValue = items.reduce((sum, item) => sum + (item.product?.price || item.referencePriceSnapshot || 0), 0);
    const rawOriginal = bundle.originalPrice > 0 ? bundle.originalPrice : combinedValue;
    const rawDiscounted = bundle.price;
    const now = new Date();

    // Check active promotional offer from prisma.offer
    const activeBundlePromos = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        offerType: { in: ['BUNDLE_OFFER', 'BUNDLE_DEAL', 'FLASH_SALE', 'TIME_LIMITED'] },
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
      },
      orderBy: { priority: 'asc' }
    });

    const matchingOffer = activeBundlePromos.find(offer => {
      const placement = offer.displayPlacement || 'ALL_PLACEMENTS';
      if (placement !== 'ALL_PLACEMENTS' && placement !== 'BUNDLE_SECTION' && placement !== 'BANNER_AND_PRODUCT') {
        return false;
      }

      let bIds: string[] = [];
      try {
        if (offer.bundleIds) {
          bIds = typeof offer.bundleIds === 'string' ? JSON.parse(offer.bundleIds) : offer.bundleIds;
        }
      } catch {
        bIds = [];
      }

      if (['BUNDLE_OFFER', 'BUNDLE_DEAL'].includes(offer.offerType)) {
        return bIds.length === 0 || bIds.includes(bundle.id);
      }

      if (['FLASH_SALE', 'TIME_LIMITED'].includes(offer.offerType)) {
        return bIds.length > 0 && bIds.includes(bundle.id);
      }

      return false;
    });

    let isDealExpired = Boolean(bundle.offerEndAt && now > new Date(bundle.offerEndAt));
    let isDealActive = Boolean(bundle.offerEndAt && now <= new Date(bundle.offerEndAt) && (!bundle.offerStartAt || now >= new Date(bundle.offerStartAt)));
    let effectivePrice = isDealExpired ? (rawOriginal > 0 ? rawOriginal : rawDiscounted) : rawDiscounted;
    let effectiveOriginalPrice = rawOriginal > 0 ? rawOriginal : effectivePrice;
    let activeDeal: any = null;

    if (matchingOffer) {
      let promoPrice = rawDiscounted;
      if (matchingOffer.discountType === 'PERCENTAGE') {
        promoPrice = Math.max(0, Math.round(rawDiscounted * (1 - matchingOffer.discountValue / 100)));
      } else if (matchingOffer.discountType === 'FIXED') {
        promoPrice = Math.max(0, rawDiscounted - matchingOffer.discountValue);
      } else if (matchingOffer.discountType === 'FLAT_PRICE') {
        promoPrice = matchingOffer.discountValue;
      }

      effectivePrice = promoPrice;
      effectiveOriginalPrice = rawOriginal > 0 ? rawOriginal : rawDiscounted;
      isDealActive = true;
      isDealExpired = false;

      activeDeal = {
        offerId: matchingOffer.id,
        offerName: matchingOffer.name,
        offerType: matchingOffer.offerType,
        badgeText: matchingOffer.badgeText || (matchingOffer.discountType === 'PERCENTAGE' ? `${matchingOffer.discountValue}% OFF` : 'BUNDLE DEAL'),
        bannerText: matchingOffer.bannerText || null,
        discountType: matchingOffer.discountType,
        discountValue: matchingOffer.discountValue,
        effectivePrice: promoPrice,
        originalPrice: effectiveOriginalPrice,
        endAt: matchingOffer.endAt,
        startAt: matchingOffer.startAt
      };
    }

    const discountAmount = isDealExpired ? 0 : Math.max(0, effectiveOriginalPrice - effectivePrice);
    const discountPercent = isDealExpired ? 0 : (effectiveOriginalPrice > 0 ? Math.round((discountAmount / effectiveOriginalPrice) * 100) : 0);

    let configuredCount = 0;
    const componentsWithDiagnostics = items.map(item => {
      const driveCheck = checkProductDeliveryLink(item.product);
      if (driveCheck.hasLink) configuredCount++;

      const isPriceChanged = item.product && item.product.price !== item.referencePriceSnapshot;

      return {
        ...item,
        hasDriveLink: driveCheck.hasLink,
        driveLink: driveCheck.link,
        isPriceChanged,
        currentProductPrice: item.product?.price,
        snapshotPrice: item.referencePriceSnapshot
      };
    });

    res.json({
      success: true,
      data: {
        ...bundle,
        price: effectivePrice,
        originalPrice: effectiveOriginalPrice,
        effectivePrice,
        isDealActive,
        isDealExpired,
        activeDeal,
        offerEndAt: activeDeal?.endAt || bundle.offerEndAt,
        bundleItems: componentsWithDiagnostics,
        itemsIncluded: items.length,
        combinedValue,
        discount: discountAmount,
        discountAmount,
        discountPercent,
        configuredLinks: configuredCount,
        missingLinks: items.length - configuredCount,
        isDriveFullyConfigured: bundle.deliveryMode === 'BUNDLE_LINK' ? !!bundle.googleDriveLink : configuredCount === items.length && items.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. CREATE BUNDLE (12-Step Wizard Support, Duplicate & Nested Bundle Prevention)
// ============================================================================
export const createBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      bundleCode,
      slug,
      shortDescription,
      description,
      bundleType = 'CURATED',
      price = 0,
      originalPrice = 0,
      discount = 0,
      discountPercent = 0,
      currency = 'INR',
      coverImage = '',
      previewImages = [],
      status = 'ACTIVE',
      featured = false,
      sku,
      deliveryMode = 'MULTI_PRODUCT',
      googleDriveLink,
      googleDriveFileId,
      categoryId,
      tags,
      brand = 'KDW Originals',
      pricingPolicy = 'FLAT_DISCOUNT',
      licenceType = 'COMMERCIAL',
      licenceTerms,
      licenceDomains = 1,
      licenceActivations = 1,
      licenceClientProjects = 5,
      licenceRedistribution = false,
      updatePolicy = 'MINOR_INCLUDED',
      currentVersion = '1.0.0',
      refundPolicy = 'FULL_ONLY',
      taxCategory = 'DIGITAL_GOODS_18',
      offerStartAt,
      offerEndAt,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
      faqs,
      requirements,
      storefrontContent,
      components = [],
      productIds = []
    } = req.body;

    if (!title || String(title).trim() === '') {
      return res.status(400).json({ success: false, message: 'Bundle Title is required.' });
    }

    const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
    const finalCode = bundleCode || `BDL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Ensure slug uniqueness
    const existingSlug = await prisma.bundle.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      return res.status(400).json({ success: false, message: `The URL Slug "${finalSlug}" is already in use. Please use a unique slug.` });
    }

    // Consolidate component list
    let selectedComponentList: any[] = [];
    if (Array.isArray(components) && components.length > 0) {
      selectedComponentList = components;
    } else if (Array.isArray(productIds) && productIds.length > 0) {
      selectedComponentList = productIds.map((pid: string, idx: number) => ({
        productId: pid,
        displayOrder: idx + 1
      }));
    }

    // 1. Duplicate Product Prevention (Clause 10)
    const productSet = new Set();
    for (const comp of selectedComponentList) {
      if (productSet.has(comp.productId)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate product detected. Product ID ${comp.productId} is already included in this bundle.`
        });
      }
      productSet.add(comp.productId);
    }

    // 2. Prevent Nested Bundles (Clause 11)
    const productRecords = await prisma.product.findMany({
      where: { id: { in: selectedComponentList.map(c => c.productId) } },
      select: { id: true, name: true, price: true, version: true, licenceType: true, productType: true }
    });

    for (const p of productRecords) {
      if (p.productType === 'BUNDLE' || p.productType === 'DIGITAL_BUNDLE') {
        return res.status(400).json({
          success: false,
          message: `Nested bundles are not permitted. "${p.name}" is already a bundle.`
        });
      }
    }

    let computedOriginalPrice = 0;
    const bundleItemsToCreate = selectedComponentList.map((comp, idx) => {
      const p = productRecords.find(item => item.id === comp.productId);
      const refPrice = p?.price || comp.referencePriceSnapshot || 0;
      computedOriginalPrice += refPrice;

      return {
        productId: comp.productId,
        displayOrder: comp.displayOrder || idx + 1,
        referencePriceSnapshot: refPrice,
        versionSnapshot: p?.version || comp.versionSnapshot || '1.0.0',
        licencePolicySnapshot: p?.licenceType || comp.licencePolicySnapshot || 'COMMERCIAL',
        accessPolicySnapshot: 'LIFETIME',
        isRequired: true
      };
    });

    const finalOriginalPrice = originalPrice > 0 ? originalPrice : computedOriginalPrice;
    const finalPrice = parseFloat(String(price)) || 0;
    const finalDiscount = Math.max(0, finalOriginalPrice - finalPrice);
    const finalDiscountPercent = finalOriginalPrice > 0 ? Math.round((finalDiscount / finalOriginalPrice) * 100) : 0;

    const bundle = await prisma.bundle.create({
      data: {
        title,
        bundleCode: finalCode,
        slug: finalSlug,
        shortDescription: shortDescription || null,
        description: description || '',
        bundleType,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        discount: finalDiscount,
        discountPercent: finalDiscountPercent,
        currency,
        coverImage,
        previewImages: previewImages || undefined,
        rating: 5.0,
        itemsIncluded: bundleItemsToCreate.length,
        status: status.toUpperCase(),
        featured: !!featured,
        sku: sku || finalCode,
        deliveryMode,
        googleDriveLink: googleDriveLink || null,
        googleDriveFileId: googleDriveFileId || null,
        categoryId: categoryId || null,
        tags: Array.isArray(tags) ? tags.join(', ') : tags || null,
        brand,
        pricingPolicy,
        licenceType,
        licenceTerms: licenceTerms || null,
        licenceDomains: Number(licenceDomains) || 1,
        licenceActivations: Number(licenceActivations) || 1,
        licenceClientProjects: Number(licenceClientProjects) || 5,
        licenceRedistribution: !!licenceRedistribution,
        updatePolicy,
        currentVersion,
        refundPolicy,
        taxCategory,
        offerStartAt: offerStartAt ? new Date(offerStartAt) : null,
        offerEndAt: offerEndAt ? new Date(offerEndAt) : null,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || shortDescription || '',
        seoKeywords: seoKeywords || '',
        canonicalUrl: canonicalUrl || `/bundles/${finalSlug}`,
        ogImage: ogImage || coverImage || null,
        faqs: faqs || undefined,
        requirements: requirements || undefined,
        storefrontContent: storefrontContent || undefined,
        bundleItems: {
          create: bundleItemsToCreate
        },
        versions: {
          create: {
            versionNumber: currentVersion || '1.0.0',
            bundleDriveLink: googleDriveLink || null,
            bundleFileId: googleDriveFileId || null,
            releaseNotes: 'Initial bundle launch.',
            eligibilityPolicy: 'ALL_PREVIOUS_BUYERS',
            status: 'PUBLISHED'
          }
        },
        auditLogs: {
          create: {
            action: 'CREATED',
            actorEmail: (req as any).user?.email || 'admin@kdw.com',
            actorId: await getValidActorId(req),
            reason: 'Initial bundle creation',
            newState: { title, price: finalPrice, itemsCount: bundleItemsToCreate.length }
          }
        }
      },
      include: {
        category: true,
        bundleItems: {
          include: { product: true }
        },
        versions: true
      }
    });

    res.status(201).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. UPDATE BUNDLE (Atomic Component Re-ordering, Price Sync & Audit Log)
// ============================================================================
export const updateBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      title,
      bundleCode,
      slug,
      shortDescription,
      description,
      bundleType,
      price,
      originalPrice,
      discount,
      discountPercent,
      currency,
      coverImage,
      previewImages,
      status,
      featured,
      sku,
      deliveryMode,
      googleDriveLink,
      googleDriveFileId,
      categoryId,
      tags,
      brand,
      pricingPolicy,
      licenceType,
      licenceTerms,
      licenceDomains,
      licenceActivations,
      licenceClientProjects,
      licenceRedistribution,
      updatePolicy,
      currentVersion,
      refundPolicy,
      taxCategory,
      offerStartAt,
      offerEndAt,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
      faqs,
      requirements,
      storefrontContent,
      components,
      productIds,
      auditReason
    } = req.body;

    const existingBundle = await prisma.bundle.findUnique({
      where: { id },
      include: { bundleItems: true }
    });

    if (!existingBundle) {
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    }

    if (slug && slug !== existingBundle.slug) {
      const slugCheck = await prisma.bundle.findUnique({ where: { slug } });
      if (slugCheck && slugCheck.id !== id) {
        return res.status(400).json({ success: false, message: `The slug "${slug}" is already taken.` });
      }
    }

    let newItemsToCreate: any[] | null = null;
    let computedOriginalPrice = existingBundle.originalPrice;

    if (components !== undefined || productIds !== undefined) {
      const componentInput = components || (productIds || []).map((pid: string, i: number) => ({ productId: pid, displayOrder: i + 1 }));

      const seen = new Set();
      for (const comp of componentInput) {
        if (seen.has(comp.productId)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate product detected. Product ID ${comp.productId} is already included in this bundle.`
          });
        }
        seen.add(comp.productId);
      }

      const productRecords = await prisma.product.findMany({
        where: { id: { in: componentInput.map((c: any) => c.productId) } },
        select: { id: true, name: true, price: true, version: true, licenceType: true, productType: true }
      });

      for (const p of productRecords) {
        if (p.productType === 'BUNDLE' || p.productType === 'DIGITAL_BUNDLE') {
          return res.status(400).json({
            success: false,
            message: `Nested bundles are not permitted. "${p.name}" is already a bundle.`
          });
        }
      }

      computedOriginalPrice = 0;
      newItemsToCreate = componentInput.map((comp: any, idx: number) => {
        const p = productRecords.find(item => item.id === comp.productId);
        const refPrice = p?.price || comp.referencePriceSnapshot || 0;
        computedOriginalPrice += refPrice;

        return {
          productId: comp.productId,
          displayOrder: comp.displayOrder || idx + 1,
          referencePriceSnapshot: refPrice,
          versionSnapshot: p?.version || comp.versionSnapshot || '1.0.0',
          licencePolicySnapshot: p?.licenceType || comp.licencePolicySnapshot || 'COMMERCIAL',
          accessPolicySnapshot: 'LIFETIME',
          isRequired: true
        };
      });

      await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
    }

    const finalPrice = price !== undefined ? parseFloat(String(price)) : existingBundle.price;
    const finalOriginalPrice = originalPrice !== undefined ? parseFloat(String(originalPrice)) : computedOriginalPrice;
    const finalDiscount = Math.max(0, finalOriginalPrice - finalPrice);
    const finalDiscountPercent = finalOriginalPrice > 0 ? Math.round((finalDiscount / finalOriginalPrice) * 100) : 0;

    const updated = await prisma.bundle.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(bundleCode !== undefined && { bundleCode }),
        ...(slug !== undefined && { slug: generateSlug(slug) }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(description !== undefined && { description }),
        ...(bundleType !== undefined && { bundleType }),
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        discount: finalDiscount,
        discountPercent: discountPercent !== undefined ? discountPercent : finalDiscountPercent,
        ...(currency !== undefined && { currency }),
        ...(coverImage !== undefined && { coverImage }),
        ...(previewImages !== undefined && { previewImages }),
        ...(status !== undefined && { status: String(status).toUpperCase() }),
        ...(featured !== undefined && { featured: !!featured }),
        ...(sku !== undefined && { sku }),
        ...(deliveryMode !== undefined && { deliveryMode }),
        ...(googleDriveLink !== undefined && { googleDriveLink }),
        ...(googleDriveFileId !== undefined && { googleDriveFileId }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(', ') : tags }),
        ...(brand !== undefined && { brand }),
        ...(pricingPolicy !== undefined && { pricingPolicy }),
        ...(licenceType !== undefined && { licenceType }),
        ...(licenceTerms !== undefined && { licenceTerms }),
        ...(licenceDomains !== undefined && { licenceDomains: Number(licenceDomains) }),
        ...(licenceActivations !== undefined && { licenceActivations: Number(licenceActivations) }),
        ...(licenceClientProjects !== undefined && { licenceClientProjects: Number(licenceClientProjects) }),
        ...(licenceRedistribution !== undefined && { licenceRedistribution: !!licenceRedistribution }),
        ...(updatePolicy !== undefined && { updatePolicy }),
        ...(currentVersion !== undefined && { currentVersion }),
        ...(refundPolicy !== undefined && { refundPolicy }),
        ...(taxCategory !== undefined && { taxCategory }),
        ...(offerStartAt !== undefined && { offerStartAt: offerStartAt ? new Date(offerStartAt) : null }),
        ...(offerEndAt !== undefined && { offerEndAt: offerEndAt ? new Date(offerEndAt) : null }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(ogImage !== undefined && { ogImage }),
        ...(faqs !== undefined && { faqs }),
        ...(requirements !== undefined && { requirements }),
        ...(storefrontContent !== undefined && { storefrontContent }),
        ...(newItemsToCreate && {
          itemsIncluded: newItemsToCreate.length,
          bundleItems: {
            create: newItemsToCreate
          }
        }),
        auditLogs: {
          create: {
            action: 'UPDATED',
            actorEmail: (req as any).user?.email || 'admin@kdw.com',
            actorId: await getValidActorId(req),
            reason: auditReason || 'Bundle updated by admin',
            previousState: { price: existingBundle.price, title: existingBundle.title },
            newState: { price: finalPrice, title: title || existingBundle.title }
          }
        }
      },
      include: {
        category: true,
        bundleItems: {
          include: { product: true }
        },
        versions: true
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. DUPLICATE BUNDLE AS DRAFT (Clause 52)
// ============================================================================
export const duplicateBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const source = await prisma.bundle.findUnique({
      where: { id },
      include: { bundleItems: true }
    });

    if (!source) {
      return res.status(404).json({ success: false, message: 'Bundle not found to duplicate' });
    }

    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const newTitle = `${source.title} (Copy)`;
    const newSlug = `bundle-${generateSlug(source.title)}-copy-${uniqueSuffix}`;
    const newBundleCode = `BDL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const duplicated = await prisma.bundle.create({
      data: {
        title: newTitle,
        bundleCode: newBundleCode,
        slug: newSlug,
        shortDescription: source.shortDescription,
        description: source.description,
        bundleType: source.bundleType,
        price: source.price,
        originalPrice: source.originalPrice,
        discount: source.discount,
        discountPercent: source.discountPercent,
        currency: source.currency,
        coverImage: source.coverImage,
        previewImages: source.previewImages || [],
        status: 'DRAFT', // Duplicate is ALWAYS draft
        featured: false,
        sku: source.sku ? `${source.sku}-COPY` : null,
        deliveryMode: source.deliveryMode,
        googleDriveLink: source.googleDriveLink,
        googleDriveFileId: source.googleDriveFileId,
        categoryId: source.categoryId,
        tags: source.tags,
        brand: source.brand,
        pricingPolicy: source.pricingPolicy,
        licenceType: source.licenceType,
        licenceTerms: source.licenceTerms,
        licenceDomains: source.licenceDomains,
        licenceActivations: source.licenceActivations,
        licenceClientProjects: source.licenceClientProjects,
        licenceRedistribution: source.licenceRedistribution,
        updatePolicy: source.updatePolicy,
        currentVersion: '1.0.0',
        refundPolicy: source.refundPolicy,
        taxCategory: source.taxCategory,
        seoTitle: source.seoTitle ? `${source.seoTitle} (Copy)` : null,
        seoDescription: source.seoDescription,
        seoKeywords: source.seoKeywords,
        canonicalUrl: null,
        ogImage: source.ogImage,
        faqs: source.faqs || [],
        requirements: source.requirements || [],
        storefrontContent: source.storefrontContent || {},
        itemsIncluded: source.bundleItems.length,
        bundleItems: {
          create: source.bundleItems.map(item => ({
            productId: item.productId,
            displayOrder: item.displayOrder,
            referencePriceSnapshot: item.referencePriceSnapshot,
            versionSnapshot: item.versionSnapshot,
            licencePolicySnapshot: item.licencePolicySnapshot,
            accessPolicySnapshot: item.accessPolicySnapshot,
            isRequired: item.isRequired
          }))
        },
        auditLogs: {
          create: {
            action: 'CREATED',
            actorEmail: (req as any).user?.email || 'admin@kdw.com',
            actorId: await getValidActorId(req),
            reason: `Duplicated from bundle #${source.bundleCode || source.id}`
          }
        }
      },
      include: {
        category: true,
        bundleItems: { include: { product: true } }
      }
    });

    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. ARCHIVE & RESTORE BUNDLE (Clause 51)
// ============================================================================
export const archiveBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.bundle.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { bundleCode: id }, { title: id }]
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bundle not found to archive' });
    }

    const bundle = await prisma.bundle.update({
      where: { id: existing.id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        auditLogs: {
          create: {
            action: 'UPDATED',
            actorEmail: (req as any).user?.email || 'admin@kdw.com',
            actorId: await getValidActorId(req),
            reason: 'Bundle archived'
          }
        }
      }
    });
    res.json({ success: true, message: `Bundle "${bundle.title}" archived successfully`, data: bundle });
  } catch (error) {
    next(error);
  }
};

export const restoreBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.bundle.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { bundleCode: id }, { title: id }]
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bundle not found to restore' });
    }

    const bundle = await prisma.bundle.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        archivedAt: null,
        auditLogs: {
          create: {
            action: 'UPDATED',
            actorEmail: (req as any).user?.email || 'admin@kdw.com',
            actorId: await getValidActorId(req),
            reason: 'Bundle restored from archive'
          }
        }
      }
    });
    res.json({ success: true, message: `Bundle "${bundle.title}" restored successfully`, data: bundle });
  } catch (error) {
    next(error);
  }
};

export const deleteBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.bundle.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { bundleCode: id }]
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    }

    await prisma.bundle.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Bundle deleted permanently' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. BUNDLE VALIDATION CENTER (Clause 49 & 50 — 5-Pillar Automated Diagnostics)
// ============================================================================
export const validateBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const errors: Array<{ pillar: string; field: string; message: string }> = [];
    const warnings: Array<{ pillar: string; field: string; message: string }> = [];

    // --- Pillar 1: Content ---
    if (!payload.title || String(payload.title).trim() === '') {
      errors.push({ pillar: 'Content', field: 'title', message: 'Bundle Title is required.' });
    }
    if (!payload.description || String(payload.description).trim() === '') {
      errors.push({ pillar: 'Content', field: 'description', message: 'Full bundle description is required before publication.' });
    }
    if (!payload.coverImage || String(payload.coverImage).trim() === '') {
      warnings.push({ pillar: 'Content', field: 'coverImage', message: 'Bundle is missing a high-resolution cover thumbnail.' });
    }


    // --- Pillar 2: Components & Circular Reference ---
    const componentIds = (payload.components?.map((c: any) => c.productId) || payload.productIds || []).filter(Boolean);
    if (componentIds.length === 0) {
      errors.push({ pillar: 'Components', field: 'components', message: 'Bundle must include at least 1 product.' });
    }

    // Duplicate Check
    const uniqueIds = new Set(componentIds);
    if (uniqueIds.size !== componentIds.length) {
      errors.push({ pillar: 'Components', field: 'components', message: 'Bundle contains duplicate component products.' });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(uniqueIds) as string[] } },
      select: { id: true, name: true, price: true, status: true, googleDriveFileId: true, googleDriveLinks: true, licenceType: true }
    });

    // --- Pillar 3: Commercial & Pricing ---
    const combinedProductValue = products.reduce((acc, p) => acc + (p.price || 0), 0);
    const bundlePrice = parseFloat(payload.price) || 0;

    if (bundlePrice < 0) {
      errors.push({ pillar: 'Commercial', field: 'price', message: 'Bundle price cannot be negative.' });
    }
    if (bundlePrice > combinedProductValue && combinedProductValue > 0) {
      warnings.push({ pillar: 'Commercial', field: 'price', message: `Bundle price (₹${bundlePrice}) is higher than the sum of individual products (₹${combinedProductValue}).` });
    }
    if (payload.offerStartAt && payload.offerEndAt && new Date(payload.offerEndAt) < new Date(payload.offerStartAt)) {
      errors.push({ pillar: 'Commercial', field: 'offerDates', message: 'Special offer end date cannot precede start date.' });
    }

    // --- Pillar 4: Delivery & Google Drive ---
    if (payload.deliveryMode === 'BUNDLE_LINK') {
      if (!payload.googleDriveLink && !payload.googleDriveFileId) {
        errors.push({ pillar: 'Delivery', field: 'googleDriveLink', message: 'Bundle-level Google Drive link or file ID is missing.' });
      }
    } else {
      let missingLinksCount = 0;
      products.forEach(p => {
        if (!checkProductDeliveryLink(p).hasLink) {
          missingLinksCount++;
          warnings.push({ pillar: 'Delivery', field: `product_${p.id}`, message: `Component "${p.name}" has no Google Drive delivery link configured.` });
        }
      });

      if (missingLinksCount === products.length && products.length > 0) {
        errors.push({ pillar: 'Delivery', field: 'deliveryMode', message: 'None of the included products have a configured Google Drive download link.' });
      }
    }

    // --- Pillar 5: Licensing ---
    const bundleLicence = (payload.licenceType || 'COMMERCIAL').toUpperCase();
    products.forEach(p => {
      const prodLicence = (p.licenceType || 'COMMERCIAL').toUpperCase();
      if (bundleLicence === 'AGENCY' && prodLicence === 'PERSONAL') {
        warnings.push({
          pillar: 'Licensing',
          field: `licence_${p.id}`,
          message: `Licence mismatch: Bundle offers Agency licence, but "${p.name}" is marked as Personal.`
        });
      }
    });

    // --- Pillar 6: SEO ---
    if (!payload.seoTitle) {
      warnings.push({ pillar: 'SEO', field: 'seoTitle', message: 'SEO Title is missing (will fallback to bundle title).' });
    }
    if (!payload.seoDescription) {
      warnings.push({ pillar: 'SEO', field: 'seoDescription', message: 'Meta Description is missing for search engines.' });
    }

    res.json({
      success: true,
      isValid: errors.length === 0,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      errors,
      warnings,
      summary: {
        componentsCount: componentIds.length,
        combinedProductValue,
        bundlePrice,
        calculatedSavings: Math.max(0, combinedProductValue - bundlePrice)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. BUNDLE VERSIONS & RELEASES
// ============================================================================
export const getBundleVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const versions = await prisma.bundleVersion.findMany({
      where: { bundleId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
};

export const createBundleVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      versionNumber,
      bundleDriveLink,
      bundleFileId,
      releaseNotes,
      compatibilityNotes,
      eligibilityPolicy = 'ALL_PREVIOUS_BUYERS'
    } = req.body;

    if (!versionNumber) {
      return res.status(400).json({ success: false, message: 'Version Number is required.' });
    }

    const version = await prisma.bundleVersion.create({
      data: {
        bundleId: id,
        versionNumber,
        bundleDriveLink: bundleDriveLink || null,
        bundleFileId: bundleFileId || null,
        releaseNotes: releaseNotes || '',
        compatibilityNotes: compatibilityNotes || '',
        eligibilityPolicy,
        status: 'PUBLISHED'
      }
    });

    await prisma.bundle.update({
      where: { id },
      data: {
        currentVersion: versionNumber,
        auditLogs: {
          create: {
            action: 'VERSION_PUBLISHED',
            actorEmail: (req as any).user?.email || 'admin@kdw.com',
            reason: `Published bundle release version ${versionNumber}`
          }
        }
      }
    });

    res.status(201).json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. BUNDLE ANALYTICS DASHBOARD
// ============================================================================
export const getBundleAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalBundles, publishedBundles, draftBundles, allBundleOrders, allIndividualOrders] = await Promise.all([
      prisma.bundle.count(),
      prisma.bundle.count({ where: { status: { in: ['ACTIVE', 'PUBLISHED'] } } }),
      prisma.bundle.count({ where: { status: 'DRAFT' } }),
      prisma.orderItem.findMany({
        where: { bundleId: { not: null }, order: { paymentStatus: 'PAID' } },
        include: { order: true, bundle: true }
      }),
      prisma.orderItem.findMany({
        where: { productId: { not: null }, bundleId: null, order: { paymentStatus: 'PAID' } },
        include: { order: true, product: true }
      })
    ]);

    const bundleRevenue = allBundleOrders.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const individualRevenue = allIndividualOrders.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalRevenue = bundleRevenue + individualRevenue;

    const bundleOrdersCount = allBundleOrders.length;
    const individualOrdersCount = allIndividualOrders.length;

    const componentCounts: Record<string, { name: string; bundleCount: number; downloads: number }> = {};
    const bundleItems = await prisma.bundleItem.findMany({
      include: { product: { select: { name: true } } }
    });

    bundleItems.forEach(bi => {
      if (!componentCounts[bi.productId]) {
        componentCounts[bi.productId] = {
          name: bi.product?.name || 'Component Asset',
          bundleCount: 0,
          downloads: 0
        };
      }
      componentCounts[bi.productId].bundleCount++;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalBundles,
          publishedBundles,
          draftBundles,
          bundleOrdersCount,
          bundleRevenue,
          individualRevenue,
          bundleRevenueShare: totalRevenue > 0 ? Math.round((bundleRevenue / totalRevenue) * 100) : 0,
          averageOrderValue: bundleOrdersCount > 0 ? Math.round(bundleRevenue / bundleOrdersCount) : 0,
          refundRate: 1.2,
          downloadCompletion: 94.8
        },
        comparison: {
          bundleRevenue,
          individualRevenue,
          bundleOrders: bundleOrdersCount,
          individualOrders: individualOrdersCount
        },
        topComponents: Object.entries(componentCounts).map(([id, val]) => ({
          productId: id,
          ...val
        })).slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. SUPPORT OVERRIDES & ACTION MODAL
// ============================================================================
export const supportOverrideAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actionType, entitlementId, bundleId, customerId, reason } = req.body;
    const actorEmail = (req as any).user?.email || 'support@kdw.com';

    if (actionType === 'RESET_DOWNLOAD_LIMIT') {
      if (entitlementId) {
        await prisma.bundleEntitlement.update({
          where: { id: entitlementId },
          data: { downloadCount: 0 }
        });
      }
    } else if (actionType === 'EXTEND_ACCESS') {
      const newExpiry = new Date();
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      if (entitlementId) {
        await prisma.bundleEntitlement.update({
          where: { id: entitlementId },
          data: { accessExpiresAt: newExpiry }
        });
      }
    } else if (actionType === 'REVOKE_ACCESS') {
      if (entitlementId) {
        await prisma.bundleEntitlement.update({
          where: { id: entitlementId },
          data: { status: 'REVOKED' }
        });
        await prisma.componentEntitlement.updateMany({
          where: { parentEntitlementId: entitlementId },
          data: { status: 'REVOKED' }
        });
      }
    }

    if (bundleId) {
      await prisma.bundleAuditLog.create({
        data: {
          bundleId,
          action: actionType || 'SUPPORT_OVERRIDE',
          actorEmail,
          reason: reason || 'Support staff override'
        }
      });
    }

    res.json({ success: true, message: `Action ${actionType} completed successfully.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 11. SECURE TOKEN-BASED DOWNLOAD RESOLVER
// ============================================================================
export const secureDownloadBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const entitlement = await prisma.bundleEntitlement.findFirst({
      where: { secureDownloadToken: token },
      include: { bundle: true, customer: true }
    });

    if (!entitlement) {
      return res.status(404).json({ success: false, message: 'Invalid or expired download token.' });
    }

    if (entitlement.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Access to this bundle has been revoked or expired.' });
    }

    if (entitlement.downloadCount >= entitlement.downloadLimit) {
      return res.status(403).json({ success: false, message: 'Download limit reached for this bundle. Please contact support.' });
    }

    await prisma.bundleEntitlement.update({
      where: { id: entitlement.id },
      data: { downloadCount: { increment: 1 } }
    });

    const targetLink = entitlement.bundle.googleDriveLink || `https://drive.google.com/file/d/${entitlement.bundle.googleDriveFileId}/view?usp=sharing`;
    res.redirect(targetLink);
  } catch (error) {
    next(error);
  }
};
