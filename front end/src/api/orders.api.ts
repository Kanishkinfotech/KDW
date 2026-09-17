import apiClient from './apiClient';

export interface OrderItem {
  id: string;
  productId?: string;
  bundleId?: string;
  productName: string;
  productTypeSnapshot?: string;
  productVersionSnapshot?: string;
  licenceSnapshot?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  totalAmount: number;
  subtotal: number;
  discountTotal: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  accessStatus: string;
  fulfilmentStatus: string;
  customerEmail?: string;
  guestEmail?: string;
  guestName?: string;
  guestMobile?: string;
  createdAt: string;
  items: OrderItem[];
  payment?: any;
}

export const ordersApi = {
  getMyOrders: async (): Promise<{ success: boolean; data: OrderDetail[] }> => {
    const response = await apiClient.get('/orders/my-orders');
    return response.data;
  },

  getOrderById: async (id: string): Promise<{ success: boolean; data: OrderDetail }> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  lookupOrder: async (query: string): Promise<{ success: boolean; data: OrderDetail }> => {
    const response = await apiClient.get(`/orders/lookup?query=${encodeURIComponent(query)}`);
    return response.data;
  }
};
