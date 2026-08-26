import React, { useState, useEffect } from 'react';
import { Clock, Play, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentScheduledPage() {
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/scheduled', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setScheduledList(json.scheduled || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleRunPublisherNow = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/admin/content/scheduled/run-now', {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        alert(`Publisher executed: ${json.published.pages} pages, ${json.published.blogs} blogs, ${json.published.banners} banners published.`);
        fetchScheduled();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <ContentLayout
      title="Scheduled Content & Automated Releases"
      subtitle="Timezone-aware queue for upcoming promotional campaigns, product release blogs, and scheduled pages."
      onRefresh={fetchScheduled}
      isLoading={loading}
      actions={
        <button
          onClick={handleRunPublisherNow}
          disabled={triggering}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 text-emerald-400" /> Run Publisher Daemon Now
        </button>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Content Title</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Scheduled Release Time</th>
              <th className="py-3.5 px-4">Author</th>
              <th className="py-3.5 px-4">Reviewer Approval</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scheduledList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No upcoming scheduled releases in queue.
                </td>
              </tr>
            ) : (
              scheduledList.map(s => (
                <tr key={`${s.type}-${s.id}`} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{s.title}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : 'Pending Date'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{s.author || 'Staff'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.reviewer || 'Auto Approved'}</td>
                  <td className="py-3.5 px-4">
                    <ContentStatusBadge status={s.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ContentLayout>
  );
}
