import apiClient from '../apiClient';

export interface AdminCouponPayload {
  code: string;
  name?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'AFFILIATE' | 'FIRST_ORDER';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DEPLETED';
  affiliateId?: string;
}

export const adminCouponsApi = {
  getCoupons: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/coupons/admin', { params });
    return response.data;
  },

  getCouponById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/coupons/admin/${id}`);
    return response.data;
  },

  createCoupon: async (payload: AdminCouponPayload): Promise<any> => {
    const response = await apiClient.post('/coupons/admin', payload);
    return response.data;
  },

  updateCoupon: async (id: string, payload: Partial<AdminCouponPayload>): Promise<any> => {
    const response = await apiClient.put(`/coupons/admin/${id}`, payload);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<any> => {
    const response = await apiClient.patch(`/coupons/admin/${id}/status`, { status });
    return response.data;
  },

  getRedemptions: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/coupons/admin/${id}/redemptions`);
    return response.data;
  }
};
