import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  Trash2,
  Play,
  Save,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const WorkflowBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // Workflow Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ORDER');
  const [triggerEvent, setTriggerEvent] = useState('order.paid');
  const [conditions, setConditions] = useState<any[]>([
    { field: 'paymentStatus', operator: 'EQUALS', value: 'PAID' }
  ]);
  const [actions, setActions] = useState<any[]>([
    { actionType: 'CREATE_ENTITLEMENT', config: { durationDays: 365 } },
    { actionType: 'SEND_EMAIL', config: { template: 'ORDER_RECEIPT' } }
  ]);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);

  // Add Condition Clause
  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { field: 'status', operator: 'EQUALS', value: 'ACTIVE' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, key: string, val: any) => {
    setConditions((prev) => {
      const copy = [...prev];
      copy[index][key] = val;
      return copy;
    });
  };

  // Add Action Step
  const handleAddAction = (actionType: string) => {
    setActions((prev) => [...prev, { actionType, config: {} }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Workflow
  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    if (actions.length === 0) {
      toast.error('Workflow must have at least one action step');
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(
        '/api/admin/automation/rules',
        {
          name,
          description,
          category,
          triggerEvent,
          conditions,
          actions
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        navigate('/admin/automation/overview');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AutomationLayout />

      <form onSubmit={handleSaveWorkflow} className="space-y-6">
        {/* Step 1: Trigger & Metadata */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Step 1: Workflow Trigger & General Properties
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-xs font-bold">
              Active Trigger
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Workflow Name</label>
              <input
                type="text"
                required
                placeholder="e.g. VIP Customer Instant Access Pipeline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="ORDER">Order & Payment</option>
                <option value="EMAIL">Email & Transactional</option>
                <option value="CUSTOMER">Customer Lifecycle</option>
                <option value="DOWNLOAD">Download & Delivery</option>
                <option value="LICENCE">Licence Management</option>
                <option value="CUSTOM">Custom Pipeline</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Trigger Event</label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono"
              >
                <option value="order.paid">order.paid (Order Paid & Captured)</option>
                <option value="order.created">order.created (New Order Placed)</option>
                <option value="customer.created">customer.created (New Account Registered)</option>
                <option value="customer.email_verified">customer.email_verified (Email Verified)</option>
                <option value="checkout.started">checkout.started (Checkout Initiated)</option>
                <option value="download.failed">download.failed (File Download Failed)</option>
                <option value="download.limit_reached">download.limit_reached (Download Limit Reached)</option>
                <option value="entitlement.created">entitlement.created (Access Entitlement Created)</option>
                <option value="license.issued">license.issued (Software License Issued)</option>
                <option value="refund.processed">refund.processed (Refund Completed)</option>
                <option value="support.ticket.overdue">support.ticket.overdue (Ticket SLA Overdue)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Notes</label>
              <input
                type="text"
                placeholder="Brief justification or operational purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Conditions Builder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Step 2: Condition Evaluation Clauses (AND Filter)
              </h2>
              <p className="text-xs text-slate-400">All condition clauses must match for actions to execute.</p>
            </div>

            <button
              type="button"
              onClick={handleAddCondition}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Clause
            </button>
          </div>

          <div className="space-y-3">
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Payload Field (e.g. paymentStatus)"
                  value={cond.field}
                  onChange={(e) => handleUpdateCondition(idx, 'field', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white flex-1 font-mono"
                />

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdateCondition(idx, 'operator', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-semibold"
                >
                  <option value="EQUALS">EQUALS</option>
                  <option value="NOT_EQUALS">NOT_EQUALS</option>
                  <option value="CONTAINS">CONTAINS</option>
                  <option value="GREATER_THAN">GREATER_THAN</option>
                  <option value="LESS_THAN">LESS_THAN</option>
                  <option value="EXISTS">EXISTS</option>
                  <option value="NOT_EXISTS">NOT_EXISTS</option>
                </select>

                <input
                  type="text"
                  placeholder="Expected Value (e.g. PAID)"
                  value={cond.value}
                  onChange={(e) => handleUpdateCondition(idx, 'value', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white flex-1"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveCondition(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Action Dispatcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Step 3: Sequential Action Steps
              </h2>
              <p className="text-xs text-slate-400">Actions are executed in sequential order with full idempotency protection.</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleAddAction('CREATE_ENTITLEMENT')}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold"
              >
                + Entitlement
              </button>
              <button
                type="button"
                onClick={() => handleAddAction('ISSUE_LICENCE')}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold"
              >
                + Licence
              </button>
              <button
                type="button"
                onClick={() => handleAddAction('SEND_EMAIL')}
                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold"
              >
                + Email
              </button>
              <button
                type="button"
                onClick={() => handleAddAction('ADD_TAG')}
                className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-semibold"
              >
                + Tag
              </button>
              <button
                type="button"
                onClick={() => handleAddAction('CREATE_TICKET')}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold"
              >
                + Ticket
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {actions.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-mono text-xs font-bold text-emerald-400">{act.actionType}</div>
                    <div className="text-[11px] text-slate-400">Guarded by database idempotency key</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAction(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit & Dry Run Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Activating Workflow...' : 'Save & Activate Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default WorkflowBuilderPage;
