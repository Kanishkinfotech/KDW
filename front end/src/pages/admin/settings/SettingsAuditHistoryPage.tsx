import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { History, Search, RotateCcw, Filter, User, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function SettingsAuditHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, total: 0 });

  // Rollback Modal State
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        group: groupFilter,
        action: actionFilter,
        search: searchQuery,
        page: String(page),
        limit: '20'
      });
      const res = await fetch(`/api/admin/settings/admin/audit?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [groupFilter, actionFilter]);

  const handleOpenRollbackModal = async (key: string) => {
    setSelectedKey(key);
    setLoadingVersions(true);
    setRollbackReason('');
    try {
      const res = await fetch(`/api/admin/settings/admin/audit/versions/${key}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setVersionHistory(json.data);
      }
    } catch (err) {
      toast.error('Failed to load version history for key');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleExecuteRollback = async (targetVerNum: number) => {
    if (!rollbackReason) {
      toast.error('Please provide a reason for the rollback.');
      return;
    }
    if (!window.confirm(`Are you sure you want to rollback '${selectedKey}' to Version ${targetVerNum}?`)) {
      return;
    }
    setRollingBack(true);
    try {
      const res = await fetch('/api/admin/settings/admin/audit/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: selectedKey,
          targetVersionNumber: targetVerNum,
          reason: rollbackReason
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setSelectedKey(null);
        fetchAuditLogs(1);
      } else {
        toast.error(json.message || 'Rollback failed');
      }
    } catch (err) {
      toast.error('Server error executing rollback');
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <SettingsLayout
      title="Settings Version History & Audit Trail"
      subtitle="Immutable record of every configuration mutation, secret rotation, deployment test, and one-click rollback."
      onRefresh={() => fetchAuditLogs(pagination.page)}
      isLoading={loading}
    >
      {/* 1. Filters & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700"
          >
            <option value="ALL">All Setting Groups</option>
            <option value="GENERAL">General</option>
            <option value="STORE">Storefront</option>
            <option value="CURRENCY">Currency</option>
            <option value="TAX">Tax & GST</option>
            <option value="CHECKOUT">Checkout & Razorpay</option>
            <option value="DOWNLOAD">Downloads</option>
            <option value="EMAIL">Email</option>
            <option value="SECURITY">Security</option>
            <option value="PRIVACY">Privacy</option>
            <option value="LEGAL">Legal Documents</option>
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700"
          >
            <option value="ALL">All Actions</option>
            <option value="UPDATED">UPDATED</option>
            <option value="CREATED">CREATED</option>
            <option value="ROLLED_BACK">ROLLED_BACK</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            fetchAuditLogs(1);
          }}
          className="flex items-center gap-2 w-full md:w-72"
        >
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search key or details..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>
      </div>

      {/* 2. Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Setting Key</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No settings audit records found for current filters.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {log.group}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.action === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'ROLLED_BACK'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900 font-bold">
                      {log.settingKey || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.actorName || 'System'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.settingKey ? (
                        <button
                          onClick={() => handleOpenRollbackModal(log.settingKey)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        >
                          <RotateCcw className="w-3 h-3" />
                          History
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Rollback & Diff Modal */}
      {selectedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  Version History for '{selectedKey}'
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a previous safe version to rollback. Masked secret values cannot be rolled back directly.
                </p>
              </div>
              <button
                onClick={() => setSelectedKey(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Reason for Rollback *</label>
              <input
                type="text"
                value={rollbackReason}
                onChange={e => setRollbackReason(e.target.value)}
                placeholder="e.g. Reverting accidental rate change from maintenance"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {loadingVersions ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading version history...</div>
              ) : versionHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No previous versions found for this key.</div>
              ) : (
                versionHistory.map(ver => (
                  <div
                    key={ver.id}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">v{ver.versionNumber}.0</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ver.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600">by {ver.changedByName}</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-700 bg-white p-1.5 rounded-lg border border-slate-100 max-w-md truncate">
                        {ver.newValue}
                      </div>
                      {ver.changeReason && (
                        <div className="text-[10px] text-slate-500 italic">Reason: {ver.changeReason}</div>
                      )}
                    </div>

                    <button
                      onClick={() => handleExecuteRollback(ver.versionNumber)}
                      disabled={rollingBack || ver.newValue === '••••••••••••••••'}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl shadow-xs transition-all shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Rollback
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
