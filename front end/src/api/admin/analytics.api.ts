import apiClient from '../apiClient';

export interface DashboardKPIs {
  financial: {
    todayRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    averageOrderValue: number;
    financialGrowth: {
      monthlyVsLastMonth: number | null;
      todayVsLastMonth: number;
      yearlyVsLastMonth: number;
      aovVsLastMonth: number | null;
    };
  };
  orders: {
    ordersToday: number;
    completedOrders: number;
    pendingOrders: number;
    currentMonthOrderCount: number;
    refundRequests: number;
  };
  catalog?: {
    totalProducts: number;
    categoriesCount: number;
    totalDownloads: number;
  };
  audience?: {
    totalCustomers: number;
    guestCustomers: number;
  };
}

export interface RevenueChartPoint {
  name: string;
  revenue: number;
}

export const adminAnalyticsApi = {
  getDashboardAnalytics: async (range?: string): Promise<DashboardKPIs> => {
    const response = await apiClient.get('/analytics/dashboard', { params: { range } });
    return response.data;
  },

  getRevenueChart: async (days?: number): Promise<{ data: RevenueChartPoint[]; total: number }> => {
    const response = await apiClient.get('/analytics/revenue-chart', { params: { days } });
    return response.data;
  },

  getDailyRevenue: async (days?: number): Promise<{ data: RevenueChartPoint[]; total: number }> => {
    const response = await apiClient.get('/analytics/daily-revenue', { params: { days } });
    return response.data;
  },

  getTopProducts: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/top-products');
    return response.data;
  },

  getRecentOrders: async (limit: number = 5): Promise<any> => {
    const response = await apiClient.get('/analytics/recent-orders', { params: { limit } });
    return response.data;
  },

  getInventoryAlerts: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/inventory-alerts');
    return response.data;
  }
};
