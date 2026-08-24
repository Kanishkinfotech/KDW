// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCategories = await prisma.category.findMany({
      include: {
        parent: true,
        children: {
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
      select: { 
        categoryId: true, 
        subcategory: true, 
        category: { select: { name: true, slug: true } } 
      }
    });

    // Separate top-level categories and subcategories
    const mapped = rawCategories.map(cat => {
      const children = (cat.children || []).map(child => {
        const subCount = allProducts.filter(p => 
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

      const parentDirectCount = cat._count?.products || 0;
      const subTotalCount = children.reduce((sum, c) => sum + (c.count || 0), 0);
      const totalParentCount = Math.max(parentDirectCount, parentDirectCount + subTotalCount);

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

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, image, banner, displayOrder, status, featured, parentId } = req.body;
    
    const categorySlug = slug && slug.trim() !== '' 
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        description,
        image,
        banner,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
        status: status || 'ACTIVE',
        featured: !!featured,
        parentId: parentId && parentId !== '' ? parentId : null
      },
      include: {
        children: true,
        parent: true
      }
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, banner, displayOrder, status, featured, parentId } = req.body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (slug !== undefined) {
      dataToUpdate.slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (description !== undefined) dataToUpdate.description = description;
    if (image !== undefined) dataToUpdate.image = image;
    if (banner !== undefined) dataToUpdate.banner = banner;
    if (displayOrder !== undefined) dataToUpdate.displayOrder = Number(displayOrder);
    if (status !== undefined) dataToUpdate.status = status;
    if (featured !== undefined) dataToUpdate.featured = !!featured;
    if (parentId !== undefined) {
      dataToUpdate.parentId = parentId && parentId !== '' ? parentId : null;
    }

    const category = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
      include: {
        children: true,
        parent: true
      }
    });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Unlink products before deleting category
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      let uncategorized = await prisma.category.findUnique({ where: { slug: 'uncategorized' } });
      if (!uncategorized) {
        uncategorized = await prisma.category.create({
          data: {
            name: 'Uncategorized',
            slug: 'uncategorized',
            description: 'Default category for uncategorized items',
            status: 'ACTIVE'
          }
        });
      }
      if (id !== uncategorized.id) {
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: uncategorized.id }
        });
      }
    }

    // If subcategories exist, set their parentId to null
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
