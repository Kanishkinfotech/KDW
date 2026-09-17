import apiClient from './apiClient';

export interface ReviewItem {
  id: string;
  productId: string;
  productVersion?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  verifiedPurchase: boolean;
  verificationMethod?: string;
  status: string;
  reportCount?: number;
  images?: string[];
  videos?: string[];
  createdAt: string;
  replies?: Array<{
    id: string;
    authorName: string;
    message: string;
    createdAt: string;
  }>;
}

export interface ReviewSummary {
  averageRating: number;
  total: number;
  histogram: { [key: number]: number };
  verifiedPercentage: number;
  recommendPercentage: number;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  images?: string[];
  videos?: string[];
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface ReportReviewPayload {
  reason: 'SPAM' | 'PROFANITY' | 'IRRELEVANT' | 'PERSONAL_INFO' | 'COMPETITOR_PROMO' | 'FAKE_REVIEW' | 'OTHER';
  details?: string;
  reporterEmail?: string;
}

export const reviewsApi = {
  getReviewsByProduct: async (productId: string, params?: { sort?: string; rating?: number }): Promise<{ success: boolean; reviews: ReviewItem[]; summary: ReviewSummary }> => {
    const response = await apiClient.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },

  createReview: async (payload: CreateReviewPayload): Promise<{ success: boolean; message: string; review: ReviewItem }> => {
    const response = await apiClient.post('/reviews', payload);
    return response.data;
  },

  reportReview: async (reviewId: string, payload: ReportReviewPayload): Promise<{ success: boolean; message: string; reportId?: string }> => {
    const response = await apiClient.post(`/reviews/${reviewId}/report`, payload);
    return response.data;
  },

  voteReview: async (reviewId: string, vote: 'UP' | 'DOWN' = 'UP'): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/reviews/${reviewId}/vote`, { vote });
    return response.data;
  }
};
