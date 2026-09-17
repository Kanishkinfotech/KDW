import apiClient from './apiClient';

export interface AffiliateStats {
  referralCode: string;
  referralLink: string;
  qrCodeData: string;
  status: 'ACTIVE' | 'APPROVED' | 'PENDING' | 'REJECTED';
  commissionRate: string;
  clicks: number;
  conversions: number;
  conversionRate: string;
  totalSalesVolume: number;
  totalEarnings: number;
  availableBalance: number;
  minimumPayout: number;
}

export interface AffiliateApplyPayload {
  promotionalMethod?: string;
  website?: string;
  upiId?: string;
}

export const affiliatesApi = {
  getStats: async (): Promise<{ success: boolean; stats: AffiliateStats }> => {
    const response = await apiClient.get('/affiliates/stats');
    return response.data;
  },

  apply: async (payload: AffiliateApplyPayload): Promise<{ success: boolean; message: string; referralCode: string; discountOffered: string; commissionRate: string }> => {
    const response = await apiClient.post('/affiliates/apply', payload);
    return response.data;
  },

  requestPayout: async (payload: { amount: number; payoutMethod?: string; upiId?: string; bankAccountNumber?: string; ifscCode?: string }): Promise<{ success: boolean; message: string; status: string }> => {
    const response = await apiClient.post('/affiliates/payout-request', payload);
    return response.data;
  }
};
