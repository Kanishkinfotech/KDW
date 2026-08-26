import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Calendar, Plus, Play, Pause, Trash2, Clock, RefreshCw } from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const SchedulesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/schedules', { withCredentials: true });
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/automation/schedules/${id}/toggle`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSchedules();
      }
    } catch (err) {
      toast.error('Failed to toggle schedule');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post(
        '/api/admin/automation/schedules',
        {
          name,
          workflowId: 'rule_active_order_fulfilment',
          cronExpression,
          scheduleType: 'RECURRING_CRON'
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowModal(false);
        setName('');
        fetchSchedules();
      }
    } catch (err) {
      toast.error('Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchSchedules} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Durable Cron & Time-Delayed Schedules
            </h2>
            <p className="text-xs text-slate-400">
              Recurring cron triggers and delayed job dispatchers running independently of browser sessions.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Schedule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Schedule Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Cron Expression</th>
                <th className="px-4 py-3">Next Execution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {s.scheduleType}
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-400">
                    {s.cronExpression || 'Delayed (2h)'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {s.nextExecutionAt ? new Date(s.nextExecutionAt).toLocaleString() : 'Pending'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(s.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
                    >
                      {s.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Add Recurring Automation Schedule
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Inactive Customer Sweep"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cron Expression (5-field)</label>
                <input
                  type="text"
                  required
                  placeholder="0 * * * *"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  {submitting ? 'Creating...' : 'Activate Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SchedulesPage;
