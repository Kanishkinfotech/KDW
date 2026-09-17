import apiClient from '../apiClient';

export interface AdminBundlePayload {
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPercentage?: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  coverImage?: string;
  productIds: string[];
  features?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export const adminBundlesApi = {
  getBundles: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/bundles', { params });
    return response.data;
  },

  getBundleById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/bundles/${id}`);
    return response.data;
  },

  createBundle: async (payload: AdminBundlePayload): Promise<any> => {
    const response = await apiClient.post('/bundles', payload);
    return response.data;
  },

  updateBundle: async (id: string, payload: Partial<AdminBundlePayload>): Promise<any> => {
    const response = await apiClient.put(`/bundles/${id}`, payload);
    return response.data;
  },

  deleteBundle: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/bundles/${id}`);
    return response.data;
  }
};
