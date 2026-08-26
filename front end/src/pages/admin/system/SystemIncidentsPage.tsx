import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  AlertOctagon, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  X,
  ShieldAlert
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemIncidentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newService, setNewService] = useState('API');
  const [newSummary, setNewSummary] = useState('');
  const [newAffected, setNewAffected] = useState(0);

  // Edit / Postmortem Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [postmortemReport, setPostmortemReport] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system/incidents', {
        params: {
          status: activeTab !== 'ALL' ? activeTab : undefined,
          search: search || undefined
        },
        withCredentials: true
      });
      if (res.data.success) {
        setIncidents(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [activeTab]);

  const handleCreateSubmit = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(
        '/api/admin/system/incidents',
        {
          title: newTitle,
          severity: newSeverity,
          service: newService,
          summary: newSummary,
          affectedCustomersCount: newAffected
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Incident opened');
        setCreateModalOpen(false);
        setNewTitle('');
        setNewSummary('');
        fetchIncidents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create incident');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedIncident) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(
        `/api/admin/system/incidents/${selectedIncident.id}`,
        {
          status: editStatus,
          rootCause,
          actionsTaken,
          postmortemReport
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Incident record updated');
        setEditModalOpen(false);
        fetchIncidents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update incident');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Incidents' },
    { id: 'ACTIVE', label: 'Active / Triaged' },
    { id: 'INVESTIGATING', label: 'Investigating' },
    { id: 'MITIGATED', label: 'Mitigated' },
    { id: 'RESOLVED', label: 'Resolved' }
  ];

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchIncidents} isLoading={loading} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Incident Response & Postmortems</h2>
          <p className="text-xs text-slate-400">Manage severity triage, customer communications, root-cause analyses, and postmortems.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Open New Incident
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === t.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading incidents...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Incidents in this Queue</h4>
          <p className="text-xs text-slate-400 mt-1">Platform operations are stable and nominal.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {inc.incidentNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inc.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : inc.severity === 'HIGH'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {inc.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    {inc.service}
                  </span>
                  <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inc.status === 'RESOLVED'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : inc.status === 'MITIGATED'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {inc.status}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedIncident(inc);
                      setEditStatus(inc.status);
                      setRootCause(inc.rootCause || '');
                      setActionsTaken(inc.actionsTaken || '');
                      setPostmortemReport(inc.postmortemReport || '');
                      setEditModalOpen(true);
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition border border-slate-700"
                  >
                    Manage / Postmortem
                  </button>
                </div>
              </div>

              {inc.summary && (
                <p className="text-xs text-slate-300">{inc.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                <span>Owner: <strong className="text-slate-300">{inc.ownerName || 'Unassigned'}</strong></span>
                <span>Impacted: <strong className="text-slate-300">{inc.affectedCustomersCount} customers</strong></span>
                <span>Started: {new Date(inc.startedAt).toLocaleString()}</span>
                {inc.resolvedAt && <span>Resolved: {new Date(inc.resolvedAt).toLocaleString()}</span>}
              </div>

              {inc.rootCause && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-400">Root Cause:</div>
                  <div className="text-slate-200">{inc.rootCause}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Open Incident Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                Declare Production Incident
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Incident Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Razorpay Webhook Ingestion Lag..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="CRITICAL">CRITICAL (Broad Outage)</option>
                    <option value="HIGH">HIGH (Important Service)</option>
                    <option value="MEDIUM">MEDIUM (Limited Degradation)</option>
                    <option value="LOW">LOW (Minor Glitch)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Impacted Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="API">API Gateway</option>
                    <option value="DATABASE">PostgreSQL</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="EMAIL">Email Gateway</option>
                    <option value="GOOGLE_DRIVE">Google Drive</option>
                    <option value="WORKERS">Background Workers</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Summary</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Describe initial symptoms and customer impact..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={actionLoading || !newTitle}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Opening...' : 'Declare Incident'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Postmortem Modal */}
      {editModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Manage Incident: {selectedIncident.incidentNumber}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Current Lifecycle Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE (Triaging)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Engineering engaged)</option>
                  <option value="MITIGATED">MITIGATED (Workaround active / restored)</option>
                  <option value="RESOLVED">RESOLVED (Full fix verified)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Root Cause Analysis</label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="e.g. Upstream memory allocation threshold in worker container..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Preventive Actions Taken</label>
                <textarea
                  rows={2}
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  placeholder="e.g. Added retry backoff and increased worker memory to 1GB..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Postmortem Report (Markdown)</label>
                <textarea
                  rows={4}
                  value={postmortemReport}
                  onChange={(e) => setPostmortemReport(e.target.value)}
                  placeholder="# INCIDENT POSTMORTEM\n\n**Impact:** ...\n**Root Cause:** ...\n**Learnings:** ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Update Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemIncidentsPage;
