import apiClient from '../apiClient';

export interface AdminProductPayload {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  categoryId: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SCHEDULED';
  featured?: boolean;
  bestSeller?: boolean;
  thumbnail?: string;
  previewImages?: string[];
  features?: string[];
  tags?: string[];
  sku?: string;
  stock?: number | null;
  minStock?: number;
  googleDriveFileId?: string;
  googleDriveLinks?: string[];
  licenceKeyRequired?: boolean;
  licenceType?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export const adminProductsApi = {
  getProducts: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (payload: AdminProductPayload): Promise<any> => {
    const response = await apiClient.post('/products', payload);
    return response.data;
  },

  updateProduct: async (id: string, payload: Partial<AdminProductPayload>): Promise<any> => {
    const response = await apiClient.put(`/products/${id}`, payload);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  uploadFile: async (file: File, type: string = 'general'): Promise<{ success: boolean; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
