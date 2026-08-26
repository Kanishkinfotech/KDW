import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentApprovalQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/approval-queue', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setQueue(json.queue || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: string, contentType: string) => {
    try {
      const res = await fetch('/api/admin/content/approval-queue/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, contentType })
      });
      const json = await res.json();
      if (json.success) fetchQueue();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string, contentType: string) => {
    const reason = prompt('Enter mandatory rejection feedback for the author:');
    if (!reason || reason.trim().length < 5) return alert('Rejection reason must be at least 5 characters long.');
    try {
      const res = await fetch('/api/admin/content/approval-queue/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, contentType, reason })
      });
      const json = await res.json();
      if (json.success) fetchQueue();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Editorial Approval & Sign-Off Queue"
      subtitle="Centralized governance queue for pages, articles, and policy changes requiring supervisory sign-off."
      onRefresh={fetchQueue}
      isLoading={loading}
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Submitted Content</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Author</th>
              <th className="py-3.5 px-4">Submitted Date</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-semibold text-slate-700">Approval Queue is Clear</p>
                  <p className="text-xs text-slate-400 mt-0.5">No pending review requests require supervisory sign-off.</p>
                </td>
              </tr>
            ) : (
              queue.map(item => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.title}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.author}</td>
                  <td className="py-3.5 px-4 text-slate-400">{new Date(item.submittedAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.priority === 'HIGH' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleReject(item.id, item.type)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-all inline-flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject with Reason
                    </button>
                    <button
                      onClick={() => handleApprove(item.id, item.type)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
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
