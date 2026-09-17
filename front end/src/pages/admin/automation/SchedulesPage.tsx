import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Calendar, Plus, Play, Pause, Trash2, Clock, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
      if (res.data?.success) {
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
      if (res.data?.success) {
        toast.success(res.data.message || 'Schedule updated');
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
      if (res.data?.success) {
        toast.success(res.data.message || 'Schedule configuration stored');
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

      {/* Yellow/Cream Readiness Notice on Schedules Tab */}
      <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-950">
            Schedule readiness:
          </div>
          <div className="text-amber-900 leading-relaxed">
            A six-part UTC schedule expression can be stored with a rule. It remains configuration-only until the deployed app is connected to a verified scheduler.
          </div>
        </div>
      </div>

      {/* Schedules Table in White KDW Card */}
      <div className="kdw-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-bold text-[#171325] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5b21b6]" />
              Configured Cron & Time-Delayed Schedules
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Scheduled execution routines stored with persistent automation rules.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#5b21b6] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-full shadow-xs transition-all flex items-center gap-1.5 kdw-button-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Schedule</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-slate-50/50 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Schedule Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Cron Expression</th>
                <th className="px-4 py-3">Next Execution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-sans">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No scheduled rules currently registered.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-[#171325]">
                      {s.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] font-mono">
                      {s.scheduleType}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#5b21b6] font-bold">
                      {s.cronExpression || '0 * * * *'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                      {s.nextExecutionAt ? new Date(s.nextExecutionAt).toLocaleString() : 'Pending Queue'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggle(s.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-[#5b21b6] bg-[#ede9fe] hover:bg-[#ddd6fe] transition-colors"
                      >
                        {s.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#171325]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
                SCHEDULER CONFIGURATION
              </span>
              <h3 className="text-xl font-serif font-bold text-[#171325] mt-1">
                Add Automation Schedule
              </h3>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">
                  Schedule Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Inactive Customer Sweep"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">
                  Cron Expression (5-field or 6-field UTC) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0 * * * *"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-mono text-[#5b21b6] font-bold placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#e2e8f0] hover:bg-slate-50 text-slate-700 text-xs font-semibold font-sans rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#5b21b6] hover:bg-[#6d28d9] text-white font-bold text-xs font-sans rounded-full shadow-xs transition-all"
                >
                  {submitting ? 'Storing...' : 'Save Schedule'}
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
