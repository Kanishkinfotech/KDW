import apiClient from './apiClient';

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
}

export const newsletterApi = {
  subscribe: async (email: string): Promise<NewsletterSubscriptionResponse> => {
    const response = await apiClient.post<NewsletterSubscriptionResponse>('/newsletter/subscribe', { email });
    return response.data;
  }
};
