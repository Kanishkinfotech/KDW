import axios from 'axios';

export interface DashboardKpiData {
  todayRevenue: number;
  todayRevenueGrowth: number | null;
  ordersToday: number;
  todayOrdersGrowth: number;
  totalCustomers: number;
  newCustomersToday: number;
  returningCustomers: number;
  customerGrowth: number | null;
  productsCount?: number;
  bundlesCount?: number;
  catalogItems: number;
  averageOrderValue: number;
  aovGrowth: number | null;
  periodRevenue: number;
  revenueGrowth: number | null;
  periodOrders: number;
  ordersGrowth: number | null;
  downloadsToday: number;
  successfulDownloads: number;
  failedDownloads: number;
  openSupportTickets: number;
  unassignedTickets: number;
  highPriorityTickets: number;
  slaAtRiskTickets: number;
  overdueTickets: number;
  activeWorkflowRules: number;
}

export interface RevenueSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
  aov: number;
}

export interface DashboardAnalyticsData {
  revenueSeries: RevenueSeriesPoint[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface DashboardOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  productName: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  status: string;
  customerType: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  createdAt: string;
  itemsCount: number;
}

export interface DashboardOrdersData {
  recentOrders: DashboardOrderItem[];
  statusCounts: {
    new: number;
    pending: number;
    paid: number;
    processing: number;
    completed: number;
    refunded: number;
    failed: number;
    total: number;
  };
}

export interface DashboardTopProduct {
  id: string;
  name: string;
  category: string;
  thumbnail?: string;
  unitsSold: number;
  revenue: number;
  price: number;
}

export interface DashboardProductsData {
  topProducts: DashboardTopProduct[];
  totalActiveProducts: number;
  totalActiveBundles: number;
  totalCategories: number;
}

export interface DashboardCustomersData {
  total: number;
  newToday: number;
  newThisWeek: number;
  returning: number;
  guestPurchases: number;
  verifiedAccounts: number;
}

export interface DashboardDeliveryData {
  downloadsToday: number;
  successRate: number;
  failedDownloads: number;
  activeEntitlements: number;
  expiringAccess: number;
  licenceIssues: number;
}

export interface DashboardSupportData {
  open: number;
  unassigned: number;
  highPriority: number;
  slaAtRisk: number;
  overdue: number;
}

export interface DashboardAutomationData {
  activeRules: number;
  runsToday: number;
  successfulRuns: number;
  failedRuns: number;
  retryingRuns: number;
  deadLetterJobs: number;
}

export interface SystemHealthItem {
  status: 'Healthy' | 'Warning' | 'Disconnected' | 'Disabled' | 'Unknown';
  latency?: string;
  label: string;
}

export interface DashboardSystemHealthData {
  api: SystemHealthItem;
  database: SystemHealthItem;
  paymentGateway: SystemHealthItem;
  email: SystemHealthItem;
  googleDrive: SystemHealthItem;
  workers: SystemHealthItem;
  cache: SystemHealthItem;
}

export interface DashboardResponse {
  period: {
    label: string;
    rangeKey: string;
    compareMode?: string;
    compareLabel?: string;
    startDate: string;
    endDate: string;
    compareStartDate: string;
    compareEndDate: string;
  };
  kpis: DashboardKpiData;
  analytics: DashboardAnalyticsData;
  orders: DashboardOrdersData;
  products: DashboardProductsData;
  customers: DashboardCustomersData;
  digitalDelivery: DashboardDeliveryData;
  support: DashboardSupportData;
  automation: DashboardAutomationData;
  systemHealth: DashboardSystemHealthData;
  lastUpdated: string;
}

export interface GlobalSearchResults {
  customers: Array<{ id: string; name: string; email: string; customerCode?: string; createdAt: string }>;
  orders: Array<{ id: string; orderNumber: string; customerName: string; email: string; amount: number; paymentStatus: string; orderStatus: string; date: string }>;
  products: Array<{ id: string; name: string; price: number; category?: { name: string }; thumbnail?: string }>;
  bundles: Array<{ id: string; title: string; price: number; itemsIncluded?: number }>;
  categories: Array<{ id: string; name: string; type: string }>;
  tickets?: Array<{ id: string; ticketNumber: string; subject: string; status: string; priority: string; customerEmail?: string }>;
  licences?: Array<{ id: string; keyMasked: string; licenceType: string; status: string; orderId?: string }>;
}

export class AdminDashboardService {
  private static getHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Fetch consolidated production dashboard metrics
   */
  static async getDashboard(params?: { range?: string; startDate?: string; endDate?: string; compare?: string }): Promise<DashboardResponse> {
    const queryParams = new URLSearchParams();
    if (params?.range) queryParams.set('range', params.range);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.compare) queryParams.set('compare', params.compare);

    const url = `/api/admin/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await axios.get(url, {
      headers: this.getHeaders(),
      withCredentials: true
    });

    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to fetch dashboard data');
    }

    return res.data.data;
  }

  /**
   * Search across all admin entities
   */
  static async searchGlobal(query: string): Promise<GlobalSearchResults> {
    if (!query || query.trim().length < 2) {
      return { customers: [], orders: [], products: [], bundles: [], categories: [], tickets: [], licences: [] };
    }

    const res = await axios.get(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, {
      headers: this.getHeaders(),
      withCredentials: true
    });

    if (!res.data.success) {
      throw new Error(res.data.message || 'Search failed');
    }

    return res.data.data;
  }

  /**
   * Export dashboard summary to CSV
   */
  static exportToCSV(data: DashboardResponse, fileNamePrefix: string = 'kdw_dashboard') {
    const lines: string[] = [];

    // Header info
    lines.push(`"KANISHK DIGITAL WORLD — ADMIN OPERATIONS REPORT"`);
    lines.push(`"Period:","${data.period.label} (${new Date(data.period.startDate).toLocaleDateString()} - ${new Date(data.period.endDate).toLocaleDateString()})"`);
    lines.push(`"Generated At:","${new Date().toLocaleString('en-IN')}"`);
    lines.push(``);

    // Section 1: KPIs
    lines.push(`"KEY PERFORMANCE INDICATORS"`);
    lines.push(`"Metric","Value","Growth vs Comparison"`);
    lines.push(`"Today's Revenue","₹${data.kpis.todayRevenue}","${data.kpis.todayRevenueGrowth ?? 0}%"`);
    lines.push(`"Orders Today","${data.kpis.ordersToday}","${data.kpis.todayOrdersGrowth >= 0 ? '+' : ''}${data.kpis.todayOrdersGrowth} vs yesterday"`);
    lines.push(`"Period Revenue","₹${data.kpis.periodRevenue}","${data.kpis.revenueGrowth ?? 0}%"`);
    lines.push(`"Period Orders","${data.kpis.periodOrders}","${data.kpis.ordersGrowth ?? 0}%"`);
    lines.push(`"Average Order Value","₹${data.kpis.averageOrderValue}","${data.kpis.aovGrowth ?? 0}%"`);
    lines.push(`"Registered Customers","${data.kpis.totalCustomers}","${data.customers.newToday} new today"`);
    lines.push(`"Catalog Items","${data.kpis.catalogItems}","${data.products.totalActiveProducts} Products, ${data.products.totalActiveBundles} Bundles"`);
    lines.push(`"Digital Downloads","${data.kpis.downloadsToday}","${data.digitalDelivery.successRate}% success rate"`);
    lines.push(`"Open Support Tickets","${data.kpis.openSupportTickets}","${data.support.highPriority} high priority"`);
    lines.push(`"Active Automation Rules","${data.kpis.activeWorkflowRules}","${data.automation.runsToday} runs today"`);
    lines.push(``);

    // Section 2: Recent Orders
    lines.push(`"RECENT TRANSACTIONS"`);
    lines.push(`"Order ID","Customer Name","Email","Product / Items","Amount (INR)","Payment Status","Order Status","Date"`);
    data.orders.recentOrders.forEach(o => {
      lines.push(`"${o.orderNumber}","${o.customerName}","${o.customerEmail}","${o.productName}","${o.totalAmount}","${o.paymentStatus}","${o.orderStatus}","${new Date(o.createdAt).toLocaleDateString()}"`);
    });
    lines.push(``);

    // Section 3: Top Products
    lines.push(`"TOP PERFORMING PRODUCTS"`);
    lines.push(`"Product Name","Category","Units Sold","Revenue (INR)"`);
    data.products.topProducts.forEach(p => {
      lines.push(`"${p.name}","${p.category}","${p.unitsSold}","${p.revenue}"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileNamePrefix}_${data.period.rangeKey.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
