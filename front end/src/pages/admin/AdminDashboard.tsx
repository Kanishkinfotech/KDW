import React, { useEffect, useState, useCallback, useRef } from 'react';
import SEO from '../../components/SEO';
import { toast } from 'react-hot-toast';
import type { DashboardResponse } from '../../services/adminDashboardService';
import { AdminDashboardService } from '../../services/adminDashboardService';

import DashboardHeader from '../../components/admin/dashboard/DashboardHeader';
import DashboardKpiGrid from '../../components/admin/dashboard/DashboardKpiGrid';
import RevenueAnalyticsSection from '../../components/admin/dashboard/RevenueAnalyticsSection';
import RecentOrdersSection from '../../components/admin/dashboard/RecentOrdersSection';
import TopProductsSection from '../../components/admin/dashboard/TopProductsSection';
import CustomerActivitySection from '../../components/admin/dashboard/CustomerActivitySection';
import DigitalDeliveryHealthSection from '../../components/admin/dashboard/DigitalDeliveryHealthSection';
import SupportAutomationSection from '../../components/admin/dashboard/SupportAutomationSection';
import SystemHealthSection from '../../components/admin/dashboard/SystemHealthSection';
import QuickActionsBar from '../../components/admin/dashboard/QuickActionsBar';
import ExportModal from '../../components/admin/dashboard/ExportModal';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [customStartDate, setCustomStartDate] = useState<string | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<string | undefined>(undefined);
  const [comparePeriod, setComparePeriod] = useState('previous_period');

  const [isLive, setIsLive] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [showExportModal, setShowExportModal] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      setError(null);

      const res = await AdminDashboardService.getDashboard({
        range: dateRange,
        startDate: customStartDate,
        endDate: customEndDate,
        compare: comparePeriod
      });

      setData(res);
      setLastSyncedTime(new Date());

      if (!silent && !loading) {
        toast.success('Dashboard data synchronized with PostgreSQL', { id: 'dash-sync' });
      }
    } catch (err: any) {
      console.error('[AdminDashboard] Fetch error:', err);
      setError(err.message || 'Failed to synchronize dashboard metrics');
      if (!silent) {
        toast.error('Some dashboard data could not be synchronized.', { id: 'dash-err' });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange, customStartDate, customEndDate, comparePeriod, loading]);

  // Initial Load & On Parameter / Compare Period Change
  useEffect(() => {
    fetchDashboardData(false);
  }, [dateRange, customStartDate, customEndDate, comparePeriod]);

  // Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    let reconnectTimeout: any;

    const connectSSE = () => {
      try {
        const token = localStorage.getItem('token');
        const sseUrl = `/api/admin/live-stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const es = new EventSource(sseUrl, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsLive(true);
        };

        es.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.event === 'order.paid' || parsed.event === 'payment.captured') {
              toast.success(`Live: New order ${parsed.data?.orderNumber || ''} received!`, { id: 'live-order' });
              fetchDashboardData(true);
            } else if (parsed.event === 'payment.failed' || parsed.event === 'refund.processed') {
              fetchDashboardData(true);
            }
          } catch (jsonErr) {
            // Heartbeat comment
          }
        };

        es.onerror = () => {
          setIsLive(false);
          es.close();
          // Attempt reconnection after 5 seconds
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        setIsLive(false);
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    // Fallback polling interval (every 20 seconds) in case SSE is blocked by client proxy
    const pollInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 20000);

    // Refresh when user returns to browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  // Formatted last synced text
  const getLastSyncedText = () => {
    const secondsAgo = Math.floor((Date.now() - lastSyncedTime.getTime()) / 1000);
    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return lastSyncedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <SEO 
        title="Overview Dashboard | KDW Admin" 
        description="Live operational control center for Kanishk Digital World." 
      />

      {/* 1. Header with Live Status, Date Filter, Sync, & Export */}
      <DashboardHeader
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          if (r !== 'Custom Range') {
            setCustomStartDate(undefined);
            setCustomEndDate(undefined);
          }
        }}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(s, e) => {
          setCustomStartDate(s);
          setCustomEndDate(e);
        }}
        isLive={isLive}
        lastSyncedText={getLastSyncedText()}
        isRefreshing={isRefreshing}
        onSynchronize={() => fetchDashboardData(false)}
        onOpenExport={() => setShowExportModal(true)}
      />

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchDashboardData(false)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold font-sans"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Key Performance Indicators Grid (8 Premium Cards) */}
      <DashboardKpiGrid 
        kpis={data?.kpis} 
        periodInfo={data?.period}
        rangeKey={dateRange}
        loading={loading} 
      />

      {/* 3. Revenue & Orders Trajectory Analytics Chart */}
      <RevenueAnalyticsSection
        analytics={data?.analytics}
        periodLabel={data?.period?.label || dateRange}
        loading={loading}
      />

      {/* 5. Top Products & Customer Activity Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsSection
          productsData={data?.products}
          loading={loading}
        />
        <CustomerActivitySection
          customersData={data?.customers}
          loading={loading}
        />
      </div>

      {/* 6. Digital Delivery Health & Support / Automation Desk */}
      <DigitalDeliveryHealthSection
        deliveryData={data?.digitalDelivery}
        loading={loading}
      />

      <SupportAutomationSection
        supportData={data?.support}
        automationData={data?.automation}
        loading={loading}
      />

      {/* 7. Recent Transactions Table */}
      <RecentOrdersSection
        ordersData={data?.orders}
        loading={loading}
      />

      {/* 8. Operational Infrastructure Health */}
      <SystemHealthSection
        healthData={data?.systemHealth}
        loading={loading}
      />

      {/* 9. Workflow Launchpad Quick Actions */}
      <QuickActionsBar />

      {/* 10. Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        dashboardData={data}
      />
    </div>
  );
}
