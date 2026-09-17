import apiClient from './apiClient';

export interface BlogCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

export interface ContentBlock {
  type: string;
  level?: number;
  text?: string;
  title?: string;
  content?: string;
  caption?: string;
  url?: string;
  code?: string;
  language?: string;
  items?: string[];
  price?: string;
  ctaLabel?: string;
  ctaLink?: string;
  [key: string]: any;
}

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  contentJson?: ContentBlock[] | any;
  authorId?: string | null;
  authorName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  category?: BlogCategoryItem | null;
  tags?: string[] | any;
  coverImage?: string | null;
  readingTimeMinutes?: number;
  readingTime?: string;
  status: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  relatedProductIds?: string[] | any;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  viewsCount?: number;
  [key: string]: any;
}

export interface BlogListResponse {
  success: boolean;
  blogs: BlogPostItem[];
  featuredBlog?: BlogPostItem | null;
  categories: BlogCategoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BlogDetailResponse {
  success: boolean;
  post: BlogPostItem;
  relatedProducts: any[];
  relatedArticles: BlogPostItem[];
}

export const blogApi = {
  // 1. Fetch articles with filters
  getBlogs: async (params?: { category?: string; search?: string; q?: string; isFeatured?: boolean | string; page?: number; limit?: number }): Promise<BlogListResponse> => {
    const res = await apiClient.get<BlogListResponse>('/content/blogs', { params });
    return res.data;
  },

  // 2. Fetch categories
  getCategories: async (): Promise<{ success: boolean; categories: BlogCategoryItem[] }> => {
    const res = await apiClient.get<{ success: boolean; categories: BlogCategoryItem[] }>('/content/blogs/categories');
    return res.data;
  },

  // 3. Fetch single article by slug
  getBlogBySlug: async (slug: string): Promise<BlogDetailResponse> => {
    const res = await apiClient.get<BlogDetailResponse>(`/content/blogs/${encodeURIComponent(slug)}`);
    return res.data;
  }
};

export default blogApi;
