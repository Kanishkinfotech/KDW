import apiClient from './apiClient';

export interface CreateOrderPayload {
  items: Array<{
    id?: string;
    productId?: string;
    bundleId?: string;
    type?: 'product' | 'bundle';
    title?: string;
    name?: string;
    price: number;
    quantity: number;
    categoryId?: string;
  }>;
  customerId?: string;
  guestEmail: string;
  guestName?: string;
  guestMobile?: string;
  couponCode?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  isFree?: boolean;
  data: {
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    paymentMode: 'live' | 'mock' | 'free' | 'standard';
  };
}

export interface VerifyPaymentPayload {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  method?: string;
  paymentReference?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  orderId?: string;
  payment?: any;
}

export interface TrackCheckoutPayload {
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  cartData: any[];
  totalAmount: number;
  status?: string;
}

export interface RecordPaymentFailurePayload {
  orderId: string;
  failureReason?: string;
  failureCode?: string;
  failureCategory?: string;
  paymentId?: string;
}

export const paymentsApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<CreateOrderResponse>('/payments/create-order', payload);
    return response.data;
  },

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post<VerifyPaymentResponse>('/payments/verify-payment', payload);
    return response.data;
  },

  recordPaymentFailure: async (payload: RecordPaymentFailurePayload): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/payments/fail-order', payload);
    return response.data;
  },

  trackCheckout: async (payload: TrackCheckoutPayload): Promise<{ success: boolean; checkoutId?: string }> => {
    const response = await apiClient.post('/payments/track-checkout', payload);
    return response.data;
  },

  restoreCheckout: async (id: string): Promise<{ success: boolean; checkout?: any }> => {
    const response = await apiClient.get(`/payments/restore-checkout/${id}`);
    return response.data;
  },

  cleanupDuplicates: async (): Promise<{ success: boolean; message: string; cleanedPayments: number; cleanedOrders: number }> => {
    const response = await apiClient.post('/payments/cleanup-duplicates');
    return response.data;
  }
};
