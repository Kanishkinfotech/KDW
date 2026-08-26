import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const WorkflowRunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<any | null>(null);
  const [replaying, setReplaying] = useState(false);

  const fetchRunDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/automation/runs/${id}`, { withCredentials: true });
      if (res.data.success) {
        setRun(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load workflow run detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunDetail();
  }, [id]);

  const handleReplay = async () => {
    try {
      setReplaying(true);
      const res = await axios.post(`/api/admin/automation/runs/${id}/replay`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRunDetail();
      }
    } catch (err) {
      toast.error('Failed to replay workflow run');
    } finally {
      setReplaying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AutomationLayout />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
          Loading workflow execution trace...
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="space-y-6">
        <AutomationLayout />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          Workflow run not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AutomationLayout />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/automation/runs')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{run.workflowName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    run.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : run.status === 'FAILED' || run.status === 'DEAD_LETTER'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Run ID: {run.id} • Trigger: {run.triggerEventType}</p>
            </div>
          </div>

          <button
            onClick={handleReplay}
            disabled={replaying}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <RotateCw className={`w-3.5 h-3.5 ${replaying ? 'animate-spin' : ''}`} />
            {replaying ? 'Replaying...' : 'Replay Workflow Run'}
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Customer / Order Target</span>
            <span className="text-white font-semibold block truncate">{run.customerEmail || run.orderId || 'System Event'}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Total Duration</span>
            <span className="text-amber-400 font-mono font-bold">{run.durationMs} ms</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Execution Attempts</span>
            <span className="text-white font-mono font-bold">{run.attemptCount} / {run.maxAttempts}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Triggered At</span>
            <span className="text-slate-300">{new Date(run.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Error Callout if Failed */}
        {run.errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-300">Execution Failure Reason</h4>
              <p className="text-rose-200/80 mt-0.5">{run.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step-by-Step Execution Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Sequential Step Execution Timeline
          </h3>

          <div className="space-y-3">
            {run.steps?.map((step: any) => (
              <div
                key={step.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center font-mono">
                      {step.stepOrder}
                    </span>
                    <div>
                      <div className="font-mono text-xs font-bold text-emerald-400">{step.actionType}</div>
                      <div className="text-[10px] text-slate-500">Duration: {step.durationMs}ms</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                {step.resultJson && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 block mb-1">Step Output Payload:</span>
                    <pre className="bg-slate-900 p-2 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {step.resultJson}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default WorkflowRunDetailPage;
