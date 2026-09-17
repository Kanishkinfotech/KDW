import apiClient from './apiClient';

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  order?: { orderNumber: string };
  messages?: Array<{
    id: string;
    senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
    senderName: string;
    senderEmail?: string;
    message: string;
    createdAt: string;
    attachmentsJson?: any;
  }>;
}

export interface SubmitContactQueryPayload {
  name: string;
  email: string;
  phone?: string;
  queryType?: 'GENERAL' | 'DOWNLOAD_ISSUE' | 'LICENCE_ISSUE' | 'REFUND_REQUEST' | 'PAYMENT_QUERY';
  orderNumber?: string;
  subject?: string;
  message: string;
  attachments?: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  displayOrder?: number;
}

export const supportApi = {
  submitContactQuery: async (payload: SubmitContactQueryPayload): Promise<{ success: boolean; message: string; ticketNumber: string; expectedResponseTime: string }> => {
    const response = await apiClient.post('/support/contact', payload);
    return response.data;
  },

  getMyTickets: async (): Promise<{ success: boolean; data: SupportTicketItem[] }> => {
    const response = await apiClient.get('/support/my-tickets');
    return response.data;
  },

  getTicketDetail: async (id: string): Promise<{ success: boolean; ticket: SupportTicketItem }> => {
    const response = await apiClient.get(`/support/tickets/${id}`);
    return response.data;
  },

  replyTicket: async (id: string, payload: { message: string; attachments?: string[] }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/support/tickets/${id}/reply`, payload);
    return response.data;
  },

  submitSatisfactionSurvey: async (payload: { ticketId: string; rating: number; comment?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/support/satisfaction', payload);
    return response.data;
  },

  getFaqs: async (params?: { scope?: string; productId?: string }): Promise<{ success: boolean; faqs: FaqItem[] }> => {
    const response = await apiClient.get('/content/faqs', { params });
    return response.data;
  }
};
