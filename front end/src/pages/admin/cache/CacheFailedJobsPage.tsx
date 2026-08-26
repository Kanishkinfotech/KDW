import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AlertTriangle, RefreshCw, Play, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheFailedJobsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [failedEvents, setFailedEvents] = useState<any[]>([]);

  const fetchFailed = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/invalidation-events?status=FAILED', { withCredentials: true });
      if (res.data.success) {
        setFailedEvents(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load failed invalidation jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailed();
  }, []);

  const handleRetry = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/cache/invalidation-events/${id}/retry`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchFailed();
      }
    } catch (err) {
      toast.error('Failed to reprocess event');
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchFailed} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Failed Cache Invalidation Jobs Queue
          </h2>
          <p className="text-xs text-slate-400">Events that failed during automated post-commit trigger execution.</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
            Scanning dead-letter invalidation queue...
          </div>
        ) : failedEvents.length === 0 ? (
          <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Zero Failed Invalidation Events</h4>
            <p className="text-xs text-slate-500">All transactional cache evictions completed successfully.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedEvents.map((ev) => (
              <div key={ev.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      FAILED ({ev.retryCount} retries)
                    </span>
                    <span className="font-bold text-white text-xs">{ev.eventType}</span>
                  </div>
                  <div className="font-mono text-xs text-emerald-400 mt-1">{ev.keyPattern}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Trigger: {ev.triggerSource} • Failure: <span className="text-rose-400">{ev.failureReason || 'Socket timeout'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRetry(ev.id)}
                  className="self-start sm:self-auto px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Reprocess Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CacheFailedJobsPage;
