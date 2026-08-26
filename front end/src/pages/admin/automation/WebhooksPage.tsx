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
  AlertTriangle
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const WebhooksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [endpoints, setEndpoints] = useState<any[]>([]);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState('CUSTOM');
  const [direction, setDirection] = useState('OUTGOING');
  const [submitting, setSubmitting] = useState(false);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/webhooks/endpoints', { withCredentials: true });
      if (res.data.success) {
        setEndpoints(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load webhook endpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post(
        '/api/admin/automation/webhooks/endpoints',
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
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register webhook');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/automation/webhooks/endpoints/${id}/test`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEndpoints();
      }
    } catch (err) {
      toast.error('Test delivery failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this webhook endpoint?')) return;
    try {
      const res = await axios.delete(`/api/admin/automation/webhooks/endpoints/${id}`, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEndpoints();
      }
    } catch (err) {
      toast.error('Failed to delete webhook endpoint');
    }
  };

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchEndpoints} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-cyan-400" />
              Incoming & Outgoing Webhook Endpoints
            </h2>
            <p className="text-xs text-slate-400">
              HMAC SHA-256 signed event pipelines for payment gateways, ERP integrations, and external notification brokers.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Endpoint
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
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
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {endpoints.map((e) => (
                <tr key={e.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{e.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{e.url}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400">
                      {e.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {e.direction}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                    {e.secretMasked || 'whsec_••••••••'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {e.lastDeliveryAt ? new Date(e.lastDeliveryAt).toLocaleTimeString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTestPing(e.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-amber-400" />
                        Ping
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Endpoint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-cyan-400" />
              Register Webhook Endpoint
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Endpoint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Orders Broadcast"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Webhook URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.example.com/events"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Provider Adapter</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="RESEND">Resend Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="OUTGOING">Outgoing (Push)</option>
                    <option value="INCOMING">Incoming (Listen)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
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
