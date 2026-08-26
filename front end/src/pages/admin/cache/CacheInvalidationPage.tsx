import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Zap, RefreshCw, CheckCircle2, AlertTriangle, Play, ShieldCheck } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheInvalidationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/invalidation-events', {
        params: { status: statusFilter },
        withCredentials: true
      });
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load invalidation events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleRetry = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/cache/invalidation-events/${id}/retry`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEvents();
      }
    } catch (err) {
      toast.error('Failed to retry invalidation event');
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchEvents} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Event-Driven Cache Invalidation Log
            </h2>
            <p className="text-xs text-slate-400">PostgreSQL transaction-first invalidation triggers and failed retry queues.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Events</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Target Key / Pattern</th>
                <th className="px-4 py-3">Trigger Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Processed At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Querying invalidation queue...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No invalidation events recorded for this filter.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      {ev.eventType}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400 text-xs">
                      {ev.keyPattern}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {ev.triggerSource}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {ev.processedAt ? new Date(ev.processedAt).toLocaleString() : 'Pending'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ev.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(ev.id)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-xs font-semibold"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CacheInvalidationPage;
