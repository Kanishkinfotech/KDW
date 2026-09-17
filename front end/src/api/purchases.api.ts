import apiClient from './apiClient';

export interface CustomerPurchaseItem {
  id: string;
  productId?: string;
  bundleId?: string;
  type: 'PRODUCT' | 'BUNDLE';
  name: string;
  fileSize?: string;
  image?: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  currency: string;
  status: string;
  purchasedAt: string;
  downloadAvailable: boolean;
  licenseAvailable: boolean;
  invoiceAvailable: boolean;
  bundleProducts?: Array<{
    id: string;
    name: string;
    fileSize: string;
    productId: string;
  }>;
}

export interface CustomerInvoiceItem {
  id: string;
  orderNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
}

export const purchasesApi = {
  getPurchases: async (): Promise<{ success: boolean; purchases: CustomerPurchaseItem[] }> => {
    const response = await apiClient.get('/purchases');
    return response.data;
  },

  getInvoices: async (): Promise<{ success: boolean; invoices: CustomerInvoiceItem[] }> => {
    const response = await apiClient.get('/purchases/invoices');
    return response.data;
  },

  generateDownloadToken: async (productId: string): Promise<{ success: boolean; data: { downloadUrl: string }; message?: string }> => {
    const response = await apiClient.get(`/purchases/${productId}/download-token`);
    return response.data;
  },

  getInvoiceDownloadUrl: (orderId: string): string => {
    return `/api/purchases/invoices/${orderId}/download`;
  },

  resendDeliveryEmail: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/purchases/resend-email/${orderId}`);
    return response.data;
  },

  checkOwnership: async (productIds: string[]): Promise<{ success: boolean; data: { ownedProductIds: string[] } }> => {
    const response = await apiClient.post('/purchases/check-ownership', { productIds });
    return response.data;
  }
};
