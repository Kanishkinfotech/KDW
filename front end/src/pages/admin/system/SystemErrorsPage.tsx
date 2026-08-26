import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Eye, 
  AlertOctagon, 
  RefreshCw, 
  Clock, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemErrorsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedError, setSelectedError] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal States
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      let serviceParam = activeTab;
      let statusParam = 'ALL';
      let sevParam = severityFilter;

      if (activeTab === 'CRITICAL') {
        sevParam = 'CRITICAL';
        serviceParam = 'ALL';
      } else if (activeTab === 'RESOLVED') {
        statusParam = 'RESOLVED';
        serviceParam = 'ALL';
      }

      const res = await axios.get('/api/admin/system/errors', {
        params: {
          service: serviceParam,
          severity: sevParam,
          status: statusParam,
          search: search || undefined
        },
        withCredentials: true
      });

      if (res.data.success) {
        setErrors(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [activeTab, severityFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/system/errors/${id}/acknowledge`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success('Error acknowledged');
        fetchErrors();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge error');
    }
  };

  const handleResolveSubmit = async () => {
    if (!selectedError) return;
    try {
      setActionLoading(true);
      const res = await axios.post(
        `/api/admin/system/errors/${selectedError.id}/resolve`,
        { resolutionNote },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Error marked as resolved');
        setResolveModalOpen(false);
        setResolutionNote('');
        setSelectedError(null);
        fetchErrors();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateSubmit = async () => {
    if (!selectedError) return;
    try {
      setActionLoading(true);
      const res = await axios.post(
        `/api/admin/system/errors/${selectedError.id}/escalate`,
        { title: incidentTitle, severity: 'HIGH' },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Escalated to ${res.data.data.incidentNumber}`);
        setEscalateModalOpen(false);
        setIncidentTitle('');
        setSelectedError(null);
        fetchErrors();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to escalate to incident');
    } finally {
      setActionLoading(false);
    }
  };

  const subqueueTabs = [
    { id: 'ALL', label: 'All Errors' },
    { id: 'CRITICAL', label: 'Critical' },
    { id: 'API', label: 'API' },
    { id: 'DATABASE', label: 'Database' },
    { id: 'PAYMENT', label: 'Payment' },
    { id: 'WEBHOOK', label: 'Webhook' },
    { id: 'DOWNLOAD', label: 'Download' },
    { id: 'EMAIL', label: 'Email' },
    { id: 'WORKER', label: 'Worker' },
    { id: 'RESOLVED', label: 'Resolved' }
  ];

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchErrors} isLoading={loading} />

      {/* Subqueue Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-thin">
        {subqueueTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by error code, message, endpoint, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchErrors()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>

          <button
            onClick={fetchErrors}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Error Records List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading error records...</p>
        </div>
      ) : errors.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Errors Found in this Queue</h4>
          <p className="text-xs text-slate-400 mt-1">All service events in this category are nominal.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((err) => {
            const isExpanded = expandedId === err.id;
            return (
              <div
                key={err.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      err.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : err.severity === 'ERROR'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {err.severity}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {err.service}
                    </span>

                    <span className="text-sm font-mono font-bold text-white">
                      {err.errorCode}
                    </span>

                    {err.occurrenceCount > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-400 border border-slate-700">
                        {err.occurrenceCount} occurrences
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      err.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : err.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-500/10 text-blue-400'
                        : err.status === 'INVESTIGATING'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {err.status}
                    </span>

                    {err.status !== 'RESOLVED' && (
                      <>
                        {err.status === 'UNRESOLVED' && (
                          <button
                            onClick={() => handleAcknowledge(err.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedError(err);
                            setResolveModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs rounded transition"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedError(err);
                            setIncidentTitle(`Incident: ${err.errorCode} on ${err.service}`);
                            setEscalateModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs rounded transition flex items-center gap-1"
                        >
                          <AlertOctagon className="w-3 h-3" />
                          Escalate
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium">{err.message}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                  {err.endpoint && <span>Endpoint: <code className="text-slate-400">{err.endpoint}</code></span>}
                  {err.assignedOwner && <span>Owner: <strong className="text-slate-300">{err.assignedOwner}</strong></span>}
                  <span>Last Seen: {new Date(err.lastSeenAt).toLocaleString()}</span>
                  {err.resolvedAt && <span>Resolved: {new Date(err.resolvedAt).toLocaleString()}</span>}
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stack Trace & Internal Telemetry</h5>
                    <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                      {err.stackTrace || 'No stack trace captured.'}
                    </pre>
                    {err.resolutionNote && (
                      <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/40 text-xs text-emerald-300">
                        <strong>Resolution Note:</strong> {err.resolutionNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Error Modal */}
      {resolveModalOpen && selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Resolve Error Record</h3>
              <button onClick={() => setResolveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Provide an engineering resolution note explaining the remediation step.
            </p>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Cleared token cache / patched connection pool config..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate to Incident Modal */}
      {escalateModalOpen && selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                Escalate to Production Incident
              </h3>
              <button onClick={() => setEscalateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Create an operational incident from this error to coordinate multi-engineer remediation and postmortem.
            </p>
            <input
              type="text"
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEscalateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Escalating...' : 'Open Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemErrorsPage;
