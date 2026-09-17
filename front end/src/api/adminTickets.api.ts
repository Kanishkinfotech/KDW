import apiClient from './apiClient';

export interface TicketCustomer {
  id?: string | null;
  name: string;
  email: string;
  createdAt?: string;
}

export interface TicketAgent {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface TicketMessageItem {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  sender?: {
    id?: string | null;
    name: string;
    role?: string;
  };
  attachments?: any[];
}

export interface RelatedTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  updatedAt: string;
}

export interface AdminTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  type?: string;
  category?: string;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: TicketCustomer;
  user?: TicketCustomer;
  assignedAgent?: TicketAgent | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  product?: { id: string; name: string } | null;
  order?: { id: string; orderNumber: string; totalAmount?: number; orderStatus?: string } | null;
  messageCount?: number;
  messages?: TicketMessageItem[];
  relatedTickets?: RelatedTicketItem[];
}

export interface TicketStats {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  unassigned: number;
  urgent: number;
  mine: number;
}

export interface GetTicketsParams {
  status?: string;
  priority?: string;
  categoryId?: string;
  assignedAgentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetTicketsResponse {
  success: boolean;
  data: AdminTicket[];
  tickets: AdminTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminTicketsApi = {
  getTickets: async (params?: GetTicketsParams): Promise<GetTicketsResponse> => {
    const res = await apiClient.get<GetTicketsResponse>('/admin/tickets', { params });
    return res.data;
  },

  getStats: async (): Promise<{ success: boolean; stats: TicketStats }> => {
    const res = await apiClient.get<{ success: boolean; stats: TicketStats }>('/admin/tickets/stats');
    return res.data;
  },

  getAgents: async (): Promise<{ success: boolean; agents: TicketAgent[] }> => {
    const res = await apiClient.get<{ success: boolean; agents: TicketAgent[] }>('/admin/tickets/agents');
    return res.data;
  },

  getTicketById: async (id: string): Promise<{ success: boolean; ticket: AdminTicket }> => {
    const res = await apiClient.get<{ success: boolean; ticket: AdminTicket }>(`/admin/tickets/${id}`);
    return res.data;
  },

  replyTicket: async (
    id: string,
    data: { message: string; isInternal?: boolean; attachments?: any[] }
  ): Promise<{ success: boolean; message: string; reply: TicketMessageItem }> => {
    const res = await apiClient.post(`/admin/tickets/${id}/reply`, data);
    return res.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; ticket: AdminTicket }> => {
    const res = await apiClient.patch(`/admin/tickets/${id}/status`, { status, reason });
    return res.data;
  },

  updatePriority: async (
    id: string,
    priority: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; ticket: AdminTicket }> => {
    const res = await apiClient.patch(`/admin/tickets/${id}/priority`, { priority, reason });
    return res.data;
  },

  assignTicket: async (
    id: string,
    agentId: string | null
  ): Promise<{ success: boolean; message: string; ticket: AdminTicket; assignedAgent: TicketAgent | null }> => {
    const res = await apiClient.patch(`/admin/tickets/${id}/assign`, { agentId });
    return res.data;
  }
};
