import apiClient from './apiClient';

export interface ProductQueryParams {
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  status?: string;
  productType?: string;
  featured?: boolean | string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface ProductItem {
  id: string;
  name: string;
  title?: string;
  slug: string;
  productCode?: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number | null;
  compareAtPrice?: number | null;
  category?: string | any;
  categorySlug?: string;
  subcategory?: string | null;
  productType?: string;
  thumbnail?: string | null;
  coverImage?: string | null;
  previewImages?: string | string[] | null;
  features?: string | string[] | null;
  whatsIncluded?: string | string[] | null;
  requirements?: any;
  attributes?: any;
  faqs?: any;
  version?: string;
  fileSize?: string | null;
  tags?: string | string[] | null;
  status?: string;
  featured?: boolean;
  bestSeller?: boolean;
  rating?: number | null;
  reviews?: number;
  totalUnitsSold?: number;
  totalDownloads?: number;
  [key: string]: any;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: string | null;
  icon?: string | null;
  banner?: string | null;
  displayOrder?: number;
  status?: string;
  featured?: boolean;
  parentId?: string | null;
  children?: CategoryItem[];
  faqs?: any;
  buyingGuide?: string | null;
  [key: string]: any;
}

export interface BundleItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  coverImage: string;
  itemsIncluded?: number;
  rating?: number;
  status?: string;
  [key: string]: any;
}

export const productsApi = {
  // 1. Fetch products list with multi-criteria filters
  getProducts: async (params?: ProductQueryParams): Promise<{ success: boolean; data: ProductItem[]; total: number; summary?: any }> => {
    const res = await apiClient.get<{ success: boolean; data: ProductItem[]; total: number; summary?: any }>('/products', { params });
    return res.data;
  },

  // 2. Fetch single product by UUID or slug
  getProductByIdOrSlug: async (idOrSlug: string): Promise<{ success: boolean; data: ProductItem }> => {
    const res = await apiClient.get<{ success: boolean; data: ProductItem }>(`/products/${encodeURIComponent(idOrSlug)}`);
    return res.data;
  },

  // 3. Fetch related products for product details page
  getRelatedProducts: async (idOrSlug: string): Promise<{ success: boolean; data: ProductItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: ProductItem[] }>(`/products/${encodeURIComponent(idOrSlug)}/related`);
    return res.data;
  },

  // 4. Fetch category tree taxonomy
  getCategories: async (): Promise<{ success: boolean; data: CategoryItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: CategoryItem[] }>('/categories');
    return res.data;
  },

  // 5. Fetch single category with details by ID or slug
  getCategoryByIdOrSlug: async (idOrSlug: string): Promise<{ success: boolean; data: CategoryItem }> => {
    const res = await apiClient.get<{ success: boolean; data: CategoryItem }>(`/categories/${encodeURIComponent(idOrSlug)}`);
    return res.data;
  },

  // 6. Fetch bundles list (storefront default: only ACTIVE/PUBLISHED)
  getBundles: async (params?: { status?: string; [key: string]: any }): Promise<{ success: boolean; data: BundleItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: BundleItem[] }>('/bundles', {
      params: { status: 'ACTIVE', ...params }
    });
    return res.data;
  },

  // 7. Fetch single bundle details
  getBundleByIdOrSlug: async (idOrSlug: string): Promise<{ success: boolean; data: BundleItem }> => {
    const res = await apiClient.get<{ success: boolean; data: BundleItem }>(`/bundles/${encodeURIComponent(idOrSlug)}`);
    return res.data;
  }
};

export default productsApi;
