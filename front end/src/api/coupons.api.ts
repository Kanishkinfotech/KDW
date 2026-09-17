import apiClient from './apiClient';

export interface CustomerCoupon {
  id: string;
  code: string;
  internalName?: string;
  description?: string;
  discountType: string;
  discountValue: number;
  formattedDiscount: string;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  startAt?: string | null;
  endAt?: string | null;
  isPermanent: boolean;
  durationBadge: string;
  durationLabel: string;
  daysRemaining?: number | null;
  isFirstOrder: boolean;
  isEligible: boolean;
  ineligibilityReason?: string;
  perCustomerLimit: number;
}

export interface CouponValidationPayload {
  code: string;
  cartTotal?: number;
  customerId?: string;
  guestEmail?: string;
  guestPhone?: string;
  cartItems?: Array<{
    productId?: string;
    bundleId?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CouponValidationResponse {
  success: boolean;
  message?: string;
  data?: {
    couponId?: string;
    code: string;
    discountType: string;
    discountValue: number;
    calculatedDiscount: number;
    discountPercentage?: number;
    durationBadge?: string;
    durationLabel?: string;
    isPermanent?: boolean;
    isFirstOrder?: boolean;
    minOrderValue?: number;
  };
  valid?: boolean;
  calculatedDiscount?: number;
  discountType?: string;
  discountValue?: number;
}

export const couponsApi = {
  validateCoupon: async (payload: CouponValidationPayload): Promise<CouponValidationResponse> => {
    const response = await apiClient.post<CouponValidationResponse>('/coupons/validate', payload);
    return response.data;
  },

  getMyCoupons: async (params?: { customerId?: string; email?: string }): Promise<{ success: boolean; coupons: CustomerCoupon[]; data: CustomerCoupon[] }> => {
    const response = await apiClient.get('/coupons/my-coupons', { params });
    return response.data;
  }
};
