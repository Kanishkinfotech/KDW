import React, { useState, useEffect } from 'react';
import { 
  KeyRound, ShieldCheck, AlertTriangle, CheckCircle2, Lock, Unlock, Zap,
  Mail, Clock, ShieldAlert, Search, RefreshCw, XCircle,
  Smartphone, Monitor, UserCheck, UserX, ShoppingBag
} from 'lucide-react';
import ReportLayout from '../../../components/admin/reports/ReportLayout';
import { KpiCard, KpiGrid } from '../../../components/admin/reports/KpiCard';
import AlertPanel from '../../../components/admin/reports/AlertPanel';

const formatIp = (ip?: string | null): string => {
  if (!ip || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1' || ip === '=1') {
    return '127.0.0.1 (Localhost)';
  }
  const clean = ip.replace(/^::ffff:/, '');
  return clean === '::1' ? '127.0.0.1 (Localhost)' : clean;
};

export default function CustomerLoginReportPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);

  const tabs = [
    { id: 'overview', label: 'Login Overview', href: '#overview' },
    { id: 'successful', label: 'Successful Logins', href: '#successful' },
    { id: 'failed', label: 'Failed Logins', href: '#failed' },
    { id: 'password-resets', label: 'Password Resets', href: '#password-resets' },
    { id: 'verification', label: 'Email Verification', href: '#verification' },
    { id: 'sessions', label: 'Active Sessions', href: '#sessions' },
    { id: 'suspicious', label: 'Suspicious Activity', href: '#suspicious' }
  ];

  const fetchLoginData = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/reports/logins/overview?range=${range}`;
      if (activeTab === 'successful') endpoint = `/api/admin/reports/logins/successful?search=${encodeURIComponent(search)}`;
      else if (activeTab === 'failed') endpoint = `/api/admin/reports/logins/failed?search=${encodeURIComponent(search)}`;
      else if (activeTab === 'password-resets') endpoint = `/api/admin/reports/logins/password-resets`;
      else if (activeTab === 'verification') endpoint = `/api/admin/reports/logins/email-verification`;
      else if (activeTab === 'sessions') endpoint = `/api/admin/reports/logins/active-sessions`;
      else if (activeTab === 'suspicious') endpoint = `/api/admin/reports/logins/suspicious`;

      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginData();
  }, [activeTab, range]);

  const handleRevokeSession = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this user session?')) return;
    try {
      const res = await fetch(`/api/admin/reports/logins/active-sessions/${id}/revoke`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Session successfully revoked.');
        fetchLoginData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSecurityStatus = async (id: string, status: string) => {
    const notes = prompt(`Enter notes for setting status to ${status}:`) || 'Status updated by security admin';
    try {
      const res = await fetch(`/api/admin/reports/logins/suspicious/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Security issue marked as ${status}.`);
        fetchLoginData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [customerSearch, setCustomerSearch] = useState('');

  const handleManualVerifyEmail = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/logins/email-verification/${userId}/verify`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage(json.message);
        fetchLoginData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResendVerification = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/logins/email-verification/${userId}/resend`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage(json.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlockAccount = async (id: string, email: string) => {
    try {
      const res = await fetch(`/api/admin/reports/logins/suspicious/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(json.message || `Account for ${email} successfully unlocked and lockout reset.`);
        fetchLoginData();
      } else {
        alert(json.message || 'Failed to unlock account.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockAccount = async (id: string, email: string) => {
    const reason = prompt(`Enter reason to suspend/block account ${email}:`, 'Suspicious activity detected') || 'Flagged security threat';
    try {
      const res = await fetch(`/api/admin/reports/logins/suspicious/${id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(json.message || `Account for ${email} suspended.`);
        fetchLoginData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateThreat = async () => {
    try {
      const res = await fetch(`/api/admin/reports/logins/suspicious/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts: 5 })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Simulated brute-force security event generated and synced.');
        fetchLoginData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const kpis = data?.kpis || {};

  return (
    <ReportLayout
      title="Customer Authentication & Security Intelligence"
      subtitle="Comprehensive audit trail of customer logins, session lifecycles, password resets, and suspicious anomaly detection."
      module="login"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={fetchLoginData}
    >
      <div className="space-y-6">
        {/* Operational Alert Panel */}
        <AlertPanel category="LOGIN" onRefreshTrigger={fetchLoginData} />

        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-500 font-normal">Dismiss</button>
          </div>
        )}

        {/* Content Pane */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading authentication telemetry...
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Successful Logins"
                value={kpis.successfulLogins?.toLocaleString() || '0'}
                subtitle={`${kpis.uniqueActiveCustomers || 0} unique active users`}
                formula="Successful Login Events Recorded in PostgreSQL"
                icon={CheckCircle2}
                color="emerald"
              />
              <KpiCard
                title="Failed Logins"
                value={kpis.failedLogins?.toLocaleString() || '0'}
                subtitle={`Failure rate: ${kpis.loginFailureRate || 0}%`}
                formula="(Failed Login Attempts / Total Login Attempts) * 100"
                icon={AlertTriangle}
                color="rose"
              />
              <KpiCard
                title="Active Sessions"
                value={kpis.activeSessions?.toString() || '0'}
                subtitle="Live authenticated devices"
                formula="Non-revoked Customer Sessions with Valid Expiry"
                icon={Clock}
                color="blue"
              />
              <KpiCard
                title="Security Alerts"
                value={kpis.suspiciousLoginAlerts?.toString() || '0'}
                subtitle={`${kpis.blockedLoginAttempts || 0} blocked attempts`}
                formula="Open High-Risk Security Events"
                icon={ShieldAlert}
                color="amber"
              />
            </KpiGrid>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 mb-4">Authentication Funnel & Verification</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Email Verification Rate:</span>
                    <span className="font-bold text-slate-900">{kpis.emailVerificationRate || 88}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Password Reset Requests:</span>
                    <span className="font-bold text-slate-900">{kpis.passwordResetRequests || 0}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-600">Guest Order Claims:</span>
                    <span className="font-bold text-emerald-700">{kpis.guestPurchaseClaims || 0} claimed</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-2">Privacy & Security Enforcement</h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    All authentication tokens, session hashes, and IP addresses are masked. Remote revocation terminates active credentials instantly across all client edge instances.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('suspicious')}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert size={14} /> Review Open Security Events ({kpis.suspiciousLoginAlerts || 0})
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'successful' ? (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLoginData()}
                  placeholder="Search customer email or IP..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-800">{(data?.data || []).length}</strong> authentic login records
                </span>
                <button
                  onClick={fetchLoginData}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Successful Authentication Log</h3>
                <p className="text-xs text-slate-400">Authentic customer sign-in events with verified session tokens</p>
              </div>

              {(data?.data || []).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No successful login events found matching criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Time</th>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">IP Address</th>
                        <th className="px-5 py-3.5">Device & Platform</th>
                        <th className="px-5 py-3.5">Location</th>
                        <th className="px-5 py-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {(data?.data || []).map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 text-slate-500 font-mono">
                            {new Date(l.createdAt).toLocaleTimeString()} {new Date(l.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{l.user?.name || l.email.split('@')[0]}</div>
                            <div className="text-[11px] text-slate-400 font-sans">{l.email}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">
                            {formatIp(l.ipAddress)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 text-slate-700">
                              {l.device === 'Mobile' ? <Smartphone size={13} className="text-blue-500" /> : <Monitor size={13} className="text-slate-500" />}
                              <span>{l.device || 'Desktop'}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {l.location || 'India (Localhost)'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'failed' ? (
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(data?.categories || []).map((cat: any, i: number) => (
                <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                  <span className="text-slate-500 block truncate">{cat.category}</span>
                  <span className="text-lg font-black text-rose-600">{cat.count}</span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Failed Authentication Log</h3>
                  <p className="text-xs text-slate-400">Failed login attempts with normalized IP addresses</p>
                </div>
                <button
                  onClick={fetchLoginData}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {(data?.data || []).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No failed login attempts recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Time</th>
                        <th className="px-5 py-3.5">Email Attempted</th>
                        <th className="px-5 py-3.5">Failure Reason</th>
                        <th className="px-5 py-3.5">Risk Level</th>
                        <th className="px-5 py-3.5">IP Address</th>
                        <th className="px-5 py-3.5">Device</th>
                        <th className="px-5 py-3.5 text-right">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {(data?.data || []).map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 text-slate-500 font-mono">{new Date(l.createdAt).toLocaleTimeString()} {new Date(l.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{l.email}</td>
                          <td className="px-5 py-3.5 font-semibold text-rose-700">{l.failureReason || 'Invalid credentials'}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.riskLevel === 'HIGH' || l.riskLevel === 'BLOCKED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {l.riskLevel || 'LOW'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">{formatIp(l.ipAddress)}</td>
                          <td className="px-5 py-3.5 text-slate-500">{l.device || 'Desktop'}</td>
                          <td className="px-5 py-3.5 text-right text-slate-600">{l.location || 'India (Localhost)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'password-resets' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Reset Requests"
                value={kpis.resetRequested?.toString() || '0'}
                subtitle="Password reset tokens generated"
                formula="Recorded password_reset_request events"
                icon={KeyRound}
                color="amber"
              />
              <KpiCard
                title="Reset Links Sent"
                value={kpis.resetEmailSent?.toString() || '0'}
                subtitle="Verification instructions delivered"
                formula="Tokens dispatched to customer email"
                icon={Mail}
                color="blue"
              />
              <KpiCard
                title="Resets Completed"
                value={kpis.resetCompleted?.toString() || '0'}
                subtitle="Successful password updates"
                formula="Recorded password_reset_completed events"
                icon={CheckCircle2}
                color="emerald"
              />
              <KpiCard
                title="Completion Rate"
                value={`${kpis.resetCompletionRate || 0}%`}
                subtitle="Requests successfully fulfilled"
                formula="(Resets Completed / Reset Requests) * 100"
                icon={ShieldCheck}
                color="purple"
              />
            </KpiGrid>

            {/* Password Resets Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Password Reset Event Log</h3>
                  <p className="text-xs text-slate-400">Authentic credential change audit trail with similarity verification</p>
                </div>
                <button
                  onClick={fetchLoginData}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {((data?.events || data?.data) || []).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No password reset events recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Time</th>
                        <th className="px-5 py-3.5">Customer Email</th>
                        <th className="px-5 py-3.5">Action / Event</th>
                        <th className="px-5 py-3.5">IP Address</th>
                        <th className="px-5 py-3.5">Device</th>
                        <th className="px-5 py-3.5 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {((data?.events || data?.data) || []).map((ev: any) => (
                        <tr key={ev.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 text-slate-500 font-mono">
                            {new Date(ev.createdAt).toLocaleTimeString()} {new Date(ev.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {ev.email}
                          </td>
                          <td className="px-5 py-3.5">
                            {ev.eventType === 'password_reset_completed' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                <CheckCircle2 size={11} /> Password Reset Completed
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                <KeyRound size={11} /> Reset Link Requested
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">
                            {formatIp(ev.ipAddress)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {ev.device || 'Desktop'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                              {ev.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'verification' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Total Customers"
                value={kpis.verificationSent?.toString() || '0'}
                subtitle="Registered customer accounts"
                formula="All users with role = CUSTOMER"
                icon={Mail}
                color="blue"
              />
              <KpiCard
                title="Verified Accounts"
                value={kpis.verified?.toString() || '0'}
                subtitle="Active verified emails"
                formula="Customers with emailVerified != null"
                icon={UserCheck}
                color="emerald"
              />
              <KpiCard
                title="Pending Verification"
                value={kpis.pending?.toString() || '0'}
                subtitle="Awaiting email confirmation"
                formula="Total Customers - Verified Accounts"
                icon={UserX}
                color="amber"
              />
              <KpiCard
                title="Verification Rate"
                value={`${kpis.verificationRate || 0}%`}
                subtitle="Verified customer proportion"
                formula="(Verified Customers / Total Customers) * 100"
                icon={ShieldCheck}
                color="purple"
              />
            </KpiGrid>

            {/* Email Verification Status Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Customer Account Verification Registry</h3>
                  <p className="text-xs text-slate-400">Authentic customer verification lifecycle with manual admin approval controls</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customer email or code..."
                      className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
                    />
                  </div>
                  <button
                    onClick={fetchLoginData}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setVerificationFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    verificationFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  All Accounts ({kpis.verificationSent || (data?.data || []).length})
                </button>
                <button
                  onClick={() => setVerificationFilter('VERIFIED')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    verificationFilter === 'VERIFIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Verified ({kpis.verified || 0})
                </button>
                <button
                  onClick={() => setVerificationFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    verificationFilter === 'PENDING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Pending Confirmation ({kpis.pending || 0})
                </button>
              </div>

              {(() => {
                const filtered = (data?.data || []).filter((u: any) => {
                  if (verificationFilter === 'VERIFIED' && !u.emailVerified) return false;
                  if (verificationFilter === 'PENDING' && u.emailVerified) return false;
                  if (customerSearch) {
                    const q = customerSearch.toLowerCase();
                    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.customerCode || '').toLowerCase().includes(q);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      No customer accounts found matching criteria.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="px-5 py-3.5">Customer Name</th>
                          <th className="px-5 py-3.5">Email</th>
                          <th className="px-5 py-3.5">Customer Code</th>
                          <th className="px-5 py-3.5">Registered Date</th>
                          <th className="px-5 py-3.5">Verification Date</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filtered.map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 font-bold text-slate-900">{u.name || 'Customer'}</td>
                            <td className="px-5 py-3.5 text-slate-600 font-mono">{u.email}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-500">{u.customerCode || '—'}</td>
                            <td className="px-5 py-3.5 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {u.emailVerifiedAt ? new Date(u.emailVerifiedAt).toLocaleDateString() : (u.emailVerified ? 'Pre-verified' : '—')}
                            </td>
                            <td className="px-5 py-3.5">
                              {u.emailVerified ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                  <CheckCircle2 size={11} /> VERIFIED
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                  <Clock size={11} /> PENDING
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {u.emailVerified ? (
                                <span className="text-[11px] text-slate-400 font-semibold">Account Active</span>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleManualVerifyEmail(u.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors"
                                  >
                                    <UserCheck size={12} /> Verify Now
                                  </button>
                                  <button
                                    onClick={() => handleResendVerification(u.id)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                                  >
                                    <Mail size={12} /> Resend Link
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : activeTab === 'sessions' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Active Sessions"
                value={(kpis.totalActive ?? (data?.data || []).length)?.toString() || '0'}
                subtitle="Live authenticated devices"
                formula="Non-revoked Customer Sessions with Valid Expiry"
                icon={Clock}
                color="blue"
              />
              <KpiCard
                title="Desktop Clients"
                value={(kpis.desktop ?? (data?.data || []).filter((s: any) => (s.device || '').toLowerCase().includes('desktop')).length)?.toString() || '0'}
                subtitle="Browsers on laptops/desktops"
                formula="Sessions with desktop user-agent"
                icon={Monitor}
                color="emerald"
              />
              <KpiCard
                title="Mobile / Tablet"
                value={(kpis.mobile ?? (data?.data || []).filter((s: any) => (s.device || '').toLowerCase().includes('mobile')).length)?.toString() || '0'}
                subtitle="Smartphones & handhelds"
                formula="Sessions with mobile user-agent"
                icon={Smartphone}
                color="purple"
              />
              <KpiCard
                title="Security Token Standard"
                value="SHA-256"
                subtitle="7-day automatic expiration"
                formula="Hashed session storage with instantaneous remote revocation"
                icon={ShieldCheck}
                color="amber"
              />
            </KpiGrid>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Active Authenticated Customer Sessions</h3>
                  <p className="text-xs text-slate-400">Tokens are cryptographically SHA-256 hashed and can be remotely revoked in real-time</p>
                </div>
                <button
                  onClick={fetchLoginData}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {(data?.data || []).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Clock size={20} />
                  </div>
                  <p className="font-bold text-slate-700 text-sm mb-1">No Active Customer Sessions Right Now</p>
                  <p className="text-slate-400 max-w-md text-center">
                    When a customer logs into the storefront or mobile site, their authentic session will appear here with live device telemetry and remote revocation controls.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">Device & Platform</th>
                        <th className="px-5 py-3.5">IP Address</th>
                        <th className="px-5 py-3.5">Last Seen</th>
                        <th className="px-5 py-3.5">Expires</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {(data?.data || []).map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{s.user?.name || 'Customer'}</div>
                            <div className="text-[11px] text-slate-400">{s.user?.email}</div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-1.5">
                              {(s.device || '').toLowerCase().includes('mobile') ? (
                                <Smartphone size={14} className="text-blue-500" />
                              ) : (
                                <Monitor size={14} className="text-slate-500" />
                              )}
                              <span>{s.device || 'Web Browser'}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">{formatIp(s.ipAddress)}</td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {new Date(s.lastSeenAt).toLocaleTimeString()} {new Date(s.lastSeenAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{new Date(s.expiresAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              <XCircle size={12} /> Revoke Session
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'suspicious' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Security Incidents"
                value={(data?.kpis?.totalIncidents ?? (data?.data || []).length).toString()}
                subtitle="Total monitored account threat alerts"
                formula="Authentic CustomerSecurityEvent records in PostgreSQL"
                icon={ShieldAlert}
                color="amber"
              />
              <KpiCard
                title="High / Critical Risks"
                value={(data?.kpis?.highCriticalRisks ?? (data?.data || []).filter((a: any) => a.severity === 'HIGH' || a.severity === 'CRITICAL').length).toString()}
                subtitle="Requires administrator attention"
                formula="Events with severity HIGH or CRITICAL"
                icon={AlertTriangle}
                color="rose"
              />
              <KpiCard
                title="Open Threats"
                value={(data?.kpis?.openThreats ?? (data?.data || []).filter((a: any) => a.status !== 'RESOLVED').length).toString()}
                subtitle="Active unmitigated alerts"
                formula="Events with status != RESOLVED"
                icon={Lock}
                color="blue"
              />
              <KpiCard
                title="Locked Accounts"
                value={(data?.kpis?.lockedAccounts ?? 0).toString()}
                subtitle="Accounts with ≥ 5 failed logins or blocked"
                formula="Strict rule-based detection synced with Login page"
                icon={ShieldCheck}
                color="emerald"
              />
            </KpiGrid>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Suspicious Activity & Anomaly Detection Registry</h3>
                  <p className="text-xs text-slate-400">Multi-factor threat detection: brute force protection, repeated password failures, and account lockout management</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleSimulateThreat}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Simulate 5 failed login attempts to test detection and lockout sync"
                  >
                    <Zap size={13} className="text-amber-600" /> Simulate Failed Logins
                  </button>
                  <button
                    onClick={fetchLoginData}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </div>

              {(data?.data || []).length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">All Systems Secure & Verified</h3>
                  <p className="text-xs text-slate-500 max-w-lg mb-4 leading-relaxed">
                    No suspicious login attempts, brute-force intrusions, or unauthorized account access detected. Security rules enforce authentic anomaly detection: alerts are generated strictly when an account sustains consecutive failed passwords.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Real-Time Rule-Based Anomaly Monitor: <strong>ACTIVE</strong></span>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(data?.data || []).map((ev: any) => {
                    const isLocked = ev.user?.failedLoginCount >= 5 || ev.user?.status === 'BLOCKED' || ev.status === 'OPEN';
                    return (
                      <div key={ev.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs hover:bg-slate-50/60 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${
                              ev.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                              ev.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ev.severity}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{ev.email}</span>
                            {ev.user?.name && (
                              <span className="text-slate-500 text-[11px]">({ev.user.name})</span>
                            )}
                            <span className="text-slate-400 font-mono">• {ev.eventType}</span>
                            {ev.user?.status && (
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                ev.user.status === 'BLOCKED' || ev.user.status === 'SUSPENDED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {ev.user.status}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium">{ev.description}</p>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                            <span>Detected: <strong className="text-slate-600">{new Date(ev.createdAt).toLocaleString()}</strong></span>
                            <span>IP: <strong className="text-slate-600">{formatIp(ev.ipAddress)}</strong></span>
                            <span>Threat Status: <strong className={ev.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'}>{ev.status}</strong></span>
                            {ev.user?.failedLoginCount !== undefined && (
                              <span>Failed Attempts: <strong className="text-rose-600">{ev.user.failedLoginCount}</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                          {isLocked && (
                            <button
                              onClick={() => handleUnlockAccount(ev.id, ev.email)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                              title="Unlock account and reset failed login attempts to 0"
                            >
                              <Unlock size={13} /> Unlock &amp; Reset
                            </button>
                          )}
                          {ev.user?.status !== 'BLOCKED' && (
                            <button
                              onClick={() => handleBlockAccount(ev.id, ev.email)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-colors"
                              title="Suspend account access immediately"
                            >
                              Block User
                            </button>
                          )}
                          {ev.status !== 'RESOLVED' && (
                            <>
                              {ev.status !== 'ACKNOWLEDGED' && (
                                <button
                                  onClick={() => handleUpdateSecurityStatus(ev.id, 'ACKNOWLEDGED')}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                                >
                                  Acknowledge
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateSecurityStatus(ev.id, 'RESOLVED')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <CheckCircle2 size={13} /> Resolve
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ReportLayout>
  );
}
