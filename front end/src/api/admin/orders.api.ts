import apiClient from '../apiClient';

export interface AdminOrderFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

export const adminOrdersApi = {
  getOrders: async (params?: AdminOrderFilterParams): Promise<any> => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<any> => {
    const response = await apiClient.put(`/admin/orders/${id}/status`, { status });
    return response.data;
  },

  refundOrder: async (id: string, amount?: number, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/refund`, { amount, reason });
    return response.data;
  },

  retryFulfilment: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/retry-fulfilment`);
    return response.data;
  },

  resendAccess: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/resend-access`);
    return response.data;
  },

  extendAccess: async (id: string, additionalDays: number = 30): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/extend-access`, { additionalDays });
    return response.data;
  },

  resetDownloads: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/reset-downloads`);
    return response.data;
  },

  revokeAccess: async (id: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/revoke-access`, { reason });
    return response.data;
  },

  addNote: async (id: string, note: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${id}/notes`, { note });
    return response.data;
  }
};
