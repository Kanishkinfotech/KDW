import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Radio, Search, Filter, RefreshCw, RotateCcw, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemWebhookLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const fetchWebhookLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system/webhook-logs', {
        params: {
          provider: providerFilter,
          status: statusFilter,
          search: search || undefined
        },
        withCredentials: true
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch webhook logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, [providerFilter, statusFilter]);

  const handleReplay = async (id: string) => {
    try {
      setReplayingId(id);
      const res = await axios.post(`/api/admin/system/webhook-logs/${id}/replay`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Webhook replayed successfully');
        fetchWebhookLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to replay webhook');
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchWebhookLogs} isLoading={loading} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event ID, event type, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWebhookLogs()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Providers</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="RESEND">Resend Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="GOOGLE_DRIVE">Google Drive</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROCESSED">Processed</option>
            <option value="REPLAYED">Replayed</option>
            <option value="FAILED">Failed</option>
            <option value="DEAD_LETTER">Dead Letter</option>
          </select>

          <button
            onClick={fetchWebhookLogs}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading webhook delivery events...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Radio className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Webhook Logs Found</h4>
          <p className="text-xs text-slate-400 mt-1">Incoming provider webhooks are validated with HMAC SHA-256 signatures.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Signature</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Related Order</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {log.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">
                      {log.eventType}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.signatureValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.signatureValid ? 'VALID HMAC' : 'INVALID'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'PROCESSED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.status === 'REPLAYED'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-[11px]">
                      {log.relatedOrderId || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleReplay(log.id)}
                        disabled={replayingId === log.id}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium rounded transition border border-slate-700 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <RotateCcw className={`w-3 h-3 ${replayingId === log.id ? 'animate-spin text-emerald-400' : ''}`} />
                        <span>{replayingId === log.id ? 'Replaying...' : 'Replay'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemWebhookLogsPage;
