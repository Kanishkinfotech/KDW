import apiClient from '../apiClient';

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const adminSystemApi = {
  getInventory: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/inventory-alerts');
    return response.data;
  },

  updateInventory: async (type: 'product' | 'bundle', id: string, payload: { sku?: string; stock?: number | null; minStock?: number }): Promise<any> => {
    const response = await apiClient.patch(`/admin/inventory/${type}/${id}`, payload);
    return response.data;
  },

  getAuditLogs: async (params?: any): Promise<{ success: boolean; logs: AuditLogItem[]; total?: number }> => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  getGeneralSettings: async (): Promise<any> => {
    const response = await apiClient.get('/settings/general');
    return response.data;
  },

  updateGeneralSettings: async (payload: any): Promise<any> => {
    const response = await apiClient.patch('/settings/general', payload);
    return response.data;
  },

  getCurrencyTaxSettings: async (): Promise<any> => {
    const response = await apiClient.get('/settings/currency-tax');
    return response.data;
  },

  updateCurrencyTaxSettings: async (payload: any): Promise<any> => {
    const response = await apiClient.patch('/settings/currency-tax', payload);
    return response.data;
  },

  getSystemHealth: async (): Promise<any> => {
    const response = await apiClient.get('/admin/health');
    return response.data;
  }
};
