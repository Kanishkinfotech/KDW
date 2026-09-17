import apiClient, { getAuthToken } from '../utils/api/apiClient';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amount: number;
  currency: string;
  method?: string | null;
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'CANCELLED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'DISPUTED';
  verificationStatus: 'NOT_VERIFIED' | 'SIGNATURE_VERIFIED' | 'WEBHOOK_VERIFIED' | 'FULLY_VERIFIED' | 'VERIFICATION_FAILED';
  fulfilmentStatus: 'NOT_STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  refundStatus: 'NOT_REFUNDED' | 'REFUND_REQUESTED' | 'REFUND_PENDING' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'REFUND_FAILED';
  disputeStatus: string;
  reconciliationStatus: string;
  signatureVerified: boolean;
  signatureVerifiedAt?: string | null;
  webhookVerified: boolean;
  webhookVerifiedAt?: string | null;
  capturedAt?: string | null;
  failedAt?: string | null;
  failureCode?: string | null;
  failureCategory?: string | null;
  failureDescription?: string | null;
  refundedAmount: number;
  riskScore?: string | null;
  riskReason?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    customerEmail?: string | null;
    customerName?: string | null;
    guestEmail?: string | null;
    guestName?: string | null;
    totalAmount: number;
  } | null;
  customer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface PaymentCounters {
  attempts: number;
  successful: number;
  successRate: number;
  capturedValue: number;
  failedCount: number;
  failedValue: number;
  pendingVerification: number;
  refundedValue: number;
  activeDisputes: number;
  webhookFailures: number;
  unreconciledCount: number;
}

export interface PaymentAnalytics {
  totalAttempts: number;
  capturedCount: number;
  failedCount: number;
  capturedValue: number;
  failedValue: number;
  refundValue: number;
  netCapturedValue: number;
  successRate: number;
  failureRate: number;
  refundRate: number;
  reconciliationRate: number;
  fulfilmentRate: number;
  methods: Array<{ method: string; count: number; value: number }>;
  failureCategories: Array<{ category: string; count: number }>;
}

export interface GatewayStatus {
  name: string;
  engineMode: 'MOCK' | 'TEST' | 'LIVE';
  isConnected: boolean;
  keyIdMasked: string;
  currency: string;
  webhookHealth: 'HEALTHY' | 'DEGRADED' | 'IDLE';
  lastWebhookAt?: string | null;
}

export interface WebhookEventItem {
  id: string;
  externalEventId?: string | null;
  paymentId?: string | null;
  orderId?: string | null;
  eventType: string;
  rawPayload: string;
  signatureValid: boolean;
  receivedAt: string;
  processedAt?: string | null;
  status: 'RECEIVED' | 'SIGNATURE_FAILED' | 'STORED' | 'PROCESSING' | 'PROCESSED' | 'DUPLICATE' | 'FAILED' | 'DEAD_LETTER' | 'REPLAYED';
  failureReason?: string | null;
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
    razorpayPaymentId: string;
    verificationStatus: string;
  } | null;
}

export interface RefundItem {
  id: string;
  orderId: string;
  paymentId?: string | null;
  razorpayRefundId?: string | null;
  amount: number;
  currency: string;
  reason?: string | null;
  rejectionReason?: string | null;
  status: 'REQUESTED' | 'PENDING_APPROVAL' | 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  requestedBy?: string | null;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  accessRevoked: boolean;
  licenceRevoked: boolean;
  createdAt: string;
  completedAt?: string | null;
  order?: {
    id?: string;
    orderNumber: string;
    totalAmount?: number;
    guestEmail?: string | null;
    guestName?: string | null;
    customerEmail?: string | null;
    customerName?: string | null;
    paymentStatus?: string;
    items?: Array<{
      id: string;
      product?: { id: string; name: string; thumbnail?: string } | null;
      bundle?: { id: string; title: string; coverImage?: string } | null;
    }>;
  } | null;
  payment?: {
    id: string;
    amount: number;
    status: string;
    verificationStatus?: string;
    method?: string;
    razorpayPaymentId?: string;
  } | null;
}

export interface DisputeItem {
  id: string;
  paymentId?: string | null;
  orderId: string;
  razorpayDisputeId?: string | null;
  amount: number;
  currency: string;
  reason?: string | null;
  status: 'CREATED' | 'UNDER_REVIEW' | 'EVIDENCE_PENDING' | 'EVIDENCE_SUBMITTED' | 'WON' | 'LOST' | 'CLOSED';
  deadlineAt?: string | null;
  evidenceStatus: string;
  outcome?: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    guestEmail?: string | null;
  } | null;
}

export interface SettlementItem {
  id: string;
  razorpaySettlementId: string;
  settlementDate: string;
  grossAmount: number;
  feeAmount: number;
  taxAmount: number;
  refundAdjustment: number;
  netAmount: number;
  bankReference?: string | null;
  status: string;
  capturedPaymentsCount: number;
  createdAt: string;
}

export interface ReconciliationItem {
  id: string;
  internalRecordType: string;
  internalRecordId: string;
  externalRecordType: string;
  externalRecordId: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  status: 'UNMATCHED' | 'MATCHED' | 'AMOUNT_MISMATCH' | 'CURRENCY_MISMATCH' | 'DUPLICATE' | 'MISSING_GATEWAY_RECORD' | 'MISSING_INTERNAL_RECORD' | 'RESOLVED';
  differenceReason?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  payment?: PaymentTransaction | null;
}

export interface PaymentMethodItem {
  method: string;
  totalCount: number;
  totalValue: number;
  capturedCount: number;
  capturedValue: number;
  successRate: number;
}

export interface GatewaySettingsData {
  id?: string;
  gatewayName: string;
  keyId?: string;
  keySecret?: string;
  keySecretMasked?: string;
  webhookSecret?: string;
  webhookSecretMasked?: string;
  hasKeySecret?: boolean;
  hasWebhookSecret?: boolean;
  environment: string;
  currency: string;
  captureMode: string;
  retryPolicyMaxAttempts?: number;
  reconciliationSchedule?: string;
  notificationEmails?: string | null;
  verifyBeforeSave?: boolean;
  updatedAt?: string;
}

export const paymentApi = {
  // 1. Transactions & Overview
  getPayments: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments', {
      params: { ...params, _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    return res.data;
  },

  getPaymentById: async (id: string) => {
    const res = await apiClient.get(`/admin/payments/${id}`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    return res.data;
  },

  getAnalytics: async () => {
    const res = await apiClient.get('/admin/payments/analytics', {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    return res.data;
  },

  // 2. Gateway Status & Connectivity Testing
  getGatewayStatus: async () => {
    const res = await apiClient.get('/admin/payments/gateway/status');
    return res.data;
  },

  testGatewayConnection: async (data?: { keyId?: string; keySecret?: string }) => {
    const res = await apiClient.post('/admin/payments/gateway/test', data || {});
    return res.data;
  },

  // 3. Operational Actions: Retry, Reverification
  retryPaymentAttempt: async (id: string) => {
    const res = await apiClient.post(`/admin/payments/${id}/retry-attempt`);
    return res.data;
  },

  retryFulfilment: async (id: string) => {
    const res = await apiClient.post(`/admin/payments/${id}/retry-fulfilment`);
    return res.data;
  },

  // 4. Webhooks
  getWebhooks: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/webhooks', { params });
    return res.data;
  },

  replayWebhook: async (id: string) => {
    const res = await apiClient.post(`/admin/payments/webhooks/${id}/replay`);
    return res.data;
  },

  testWebhook: async (orderId?: string) => {
    const res = await apiClient.post('/admin/payments/webhooks/test', { orderId });
    return res.data;
  },

  clearWebhooks: async () => {
    const res = await apiClient.delete('/admin/payments/webhooks/clear');
    return res.data;
  },

  // 5. Refunds
  getRefunds: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/refunds', { params });
    return res.data;
  },

  createRefund: async (data: { paymentId: string; amount?: number; reason: string; accessRevoked?: boolean; licenceRevoked?: boolean }) => {
    const res = await apiClient.post('/admin/payments/refunds', data);
    return res.data;
  },

  approveRefund: async (id: string, amount?: number) => {
    const res = await apiClient.post(`/admin/payments/refunds/${id}/approve`, amount !== undefined ? { amount } : {});
    return res.data;
  },

  rejectRefund: async (id: string, reason: string) => {
    const res = await apiClient.post(`/admin/payments/refunds/${id}/reject`, { reason });
    return res.data;
  },

  // Customer Facing Refunds
  getCustomerRefunds: async () => {
    const res = await apiClient.get('/purchases/refunds');
    return res.data;
  },

  submitRefundRequest: async (data: { orderId: string; reason: string; note?: string; productName?: string }) => {
    const res = await apiClient.post('/purchases/refund-request', data);
    return res.data;
  },

  // 6. Disputes
  getDisputes: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/disputes', { params });
    return res.data;
  },

  getDisputeEvidence: async (id: string) => {
    const res = await apiClient.get(`/admin/payments/disputes/${id}/evidence`);
    return res.data;
  },

  submitDisputeEvidence: async (id: string, data: { evidence: any; notes?: string }) => {
    const res = await apiClient.post(`/admin/payments/disputes/${id}/submit-evidence`, data);
    return res.data;
  },

  // 7. Settlements
  getSettlements: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/settlements', { params });
    return res.data;
  },

  syncSettlements: async () => {
    const res = await apiClient.post('/admin/payments/settlements/sync');
    return res.data;
  },

  // 8. Reconciliation
  getReconciliation: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/reconciliation', { params });
    return res.data;
  },

  runAutoReconciliation: async () => {
    const res = await apiClient.post('/admin/payments/reconciliation/auto');
    return res.data;
  },

  resolveReconciliationManually: async (id: string, data: { status: string; notes?: string }) => {
    const res = await apiClient.post(`/admin/payments/reconciliation/${id}/resolve`, data);
    return res.data;
  },

  // 9. Payment Methods Analytics
  getPaymentMethods: async () => {
    const res = await apiClient.get('/admin/payments/methods/analytics');
    return res.data;
  },

  // 10. Fraud & Risk
  getFraudList: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/fraud-risk', { params });
    return res.data;
  },

  updateRiskState: async (id: string, riskScore: string) => {
    const res = await apiClient.post(`/admin/payments/fraud-risk/${id}/state`, { riskScore });
    return res.data;
  },

  // 11. Gateway Settings
  getGatewaySettings: async () => {
    const res = await apiClient.get('/admin/payments/settings');
    return res.data;
  },

  updateGatewaySettings: async (settings: Partial<GatewaySettingsData>) => {
    const res = await apiClient.put('/admin/payments/settings', settings);
    return res.data;
  },

  // 12. CSV Export
  getExportUrl: (type: string = 'transactions', params?: Record<string, any>) => {
    const token = getAuthToken();
    const query = new URLSearchParams({
      ...(params || {}),
      ...(token ? { token } : {})
    }).toString();
    return `/api/admin/payments/export?type=${type}${query ? `&${query}` : ''}`;
  },

  downloadExport: async (type: string = 'transactions', params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/payments/export', {
      params: { type, ...(params || {}) },
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kwd_${type}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // 13. Cleanup Duplicate / Unverified Failed Attempts
  cleanupDuplicates: async () => {
    const res = await apiClient.post('/admin/payments/cleanup-duplicates');
    return res.data;
  }
};

export default paymentApi;
