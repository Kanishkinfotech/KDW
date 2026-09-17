import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Webhook,
  Plus,
  Play,
  Trash2,
  Key,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Radio,
  Clock,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const WebhooksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'logs'>('endpoints');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState('CUSTOM');
  const [direction, setDirection] = useState('OUTGOING');
  const [submitting, setSubmitting] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/webhooks/endpoints', { withCredentials: true });
      if (res.data.success) {
        setEndpoints(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load webhook endpoints');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/webhooks/logs', { withCredentials: true });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load webhook logs');
    }
  };

  useEffect(() => {
    fetchEndpoints();
    fetchLogs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post(
        '/api/admin/webhooks/endpoints',
        {
          name,
          url,
          provider,
          direction,
          subscribedEvents: ['order.paid', 'payment.captured', 'refund.processed']
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setShowCreateModal(false);
        setName('');
        setUrl('');
        fetchEndpoints();
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register webhook');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      setPingingId(id);
      const res = await axios.post(`/api/admin/webhooks/endpoints/${id}/test`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEndpoints();
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Test ping failed');
    } finally {
      setPingingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this webhook endpoint?')) return;
    try {
      const res = await axios.delete(`/api/admin/webhooks/endpoints/${id}`, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEndpoints();
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to delete webhook endpoint');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
              EVENT PIPELINES & INTEGRATIONS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Gateway Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325] tracking-tight flex items-center gap-3">
            <Webhook className="w-8 h-8 text-[#5b21b6]" />
            <span>Webhooks</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-2xl leading-relaxed">
            Real-time event subscriptions, cryptographic HMAC SHA-256 verification, live endpoint delivery diagnostics, and transmission activity logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchEndpoints(); fetchLogs(); }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5b21b6] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold text-xs rounded-full shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Endpoint</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'endpoints'
              ? 'bg-[#5b21b6] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Registered Endpoints ({endpoints.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-[#5b21b6] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Delivery Logs ({logs.length})</span>
        </button>
      </div>

      {/* Tab 1: Registered Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Active Webhook Endpoints</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative incoming listeners and outgoing dispatch pipelines. All payloads are signed and verified.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Endpoint Name & URL</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Secret Key</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Delivery</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {endpoints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No webhook endpoints registered. Click "Register Endpoint" to configure one.
                    </td>
                  </tr>
                ) : (
                  endpoints.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{e.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({e.id})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm">{e.url}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          e.provider === 'RAZORPAY'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : e.provider === 'RESEND'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {e.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          e.direction === 'INCOMING' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'
                        }`}>
                          {e.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                        {e.secretMasked || 'whsec_••••••••'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{e.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {e.lastDeliveryAt ? new Date(e.lastDeliveryAt).toLocaleString() : 'Ready'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTestPing(e.id)}
                            disabled={pingingId === e.id}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-200 disabled:opacity-50"
                          >
                            <Play className={`w-3 h-3 text-blue-600 ${pingingId === e.id ? 'animate-spin' : ''}`} />
                            <span>{pingingId === e.id ? 'Testing...' : 'Ping'}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete endpoint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live Activity Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authoritative Transmission Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real incoming event deliveries and live cryptographic signature verification outcomes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Signature</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No webhook logs recorded yet. Use the "Ping" action to execute a live test delivery.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {log.eventType}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {log.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {log.externalEventId || log.id.slice(0, 12)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.signatureValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.signatureValid ? 'Verified' : 'Invalid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-xs text-[11px]">
                        {log.responseBody || 'Processed'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Endpoint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#5b21b6]" />
              <span>Register Webhook Endpoint</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Endpoint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Orders Broadcast"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#5b21b6] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Webhook URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.example.com/events"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#5b21b6] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Provider Adapter</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5b21b6] focus:bg-white"
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="RESEND">Resend Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#5b21b6] focus:bg-white"
                  >
                    <option value="OUTGOING">Outgoing (Push)</option>
                    <option value="INCOMING">Incoming (Listen)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksPage;
