import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import {
  ShoppingCart,
  Zap,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  FileCode
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const OrderAutomationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dry Run Modal State
  const [testingRule, setTestingRule] = useState<any | null>(null);
  const [samplePayload, setSamplePayload] = useState('{\n  "paymentStatus": "PAID",\n  "orderId": "ORD-TEST-101",\n  "customerEmail": "buyer@example.com",\n  "productId": "prod_bundle_01"\n}');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [runningTest, setRunningTest] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/rules?category=ORDER', { withCredentials: true });
      if (res.data.success) {
        setRules(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load order automation rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleStatus = async (rule: any) => {
    try {
      const endpoint = rule.status === 'ACTIVE'
        ? `/api/admin/automation/rules/${rule.id}/pause`
        : `/api/admin/automation/rules/${rule.id}/activate`;

      const res = await axios.post(endpoint, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to update rule status');
    }
  };

  const handleRunDryRun = async () => {
    if (!testingRule) return;
    try {
      setRunningTest(true);
      const parsed = JSON.parse(samplePayload);
      const res = await axios.post(
        `/api/admin/automation/rules/${testingRule.id}/test`,
        { samplePayload: parsed },
        { withCredentials: true }
      );
      if (res.data.success) {
        setTestResult(res.data.data);
        toast.success('Dry run evaluation completed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid JSON sample payload');
    } finally {
      setRunningTest(false);
    }
  };

  const filteredRules = rules.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.triggerEvent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchRules} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              Order & Payment Automation Pipelines
            </h2>
            <p className="text-xs text-slate-400">
              Triggered upon order creation, payment capture, fulfillment retries, and refund revocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <NavLink
              to="/admin/automation/builder"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Rule
            </NavLink>
          </div>
        </div>

        {/* Rules Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.length === 0 ? (
            <div className="col-span-2 bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
              No order automation rules found matching your search.
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                      {rule.triggerEvent}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  <p className="text-xs text-slate-400">{rule.description || 'Executes fulfillment and notifications.'}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Conditions: <strong className="text-white font-mono">{rule.conditions?.length || 0}</strong></span>
                    <span>Actions: <strong className="text-blue-400 font-mono">{rule.actions?.length || 0}</strong></span>
                    <span>Executions: <strong className="text-white font-mono">{rule.executionCount}</strong></span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setTestingRule(rule);
                        setTestResult(null);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-amber-400" />
                      Dry Run Test
                    </button>
                    <button
                      onClick={() => handleToggleStatus(rule)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                        rule.status === 'ACTIVE'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {rule.status === 'ACTIVE' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {rule.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dry Run Test Modal */}
      {testingRule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                Dry Run Simulation: {testingRule.name}
              </h3>
              <p className="text-xs text-slate-400">
                Simulate payload evaluation without modifying production records or sending emails.
              </p>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <label className="text-xs font-semibold text-slate-300 block">Sample Event Payload (JSON)</label>
              <textarea
                rows={5}
                value={samplePayload}
                onChange={(e) => setSamplePayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none"
              />

              {testResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Simulation Outcome:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      testResult.conditionsPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {testResult.simulatedOutcome}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Conditions Evaluated: <strong className="text-white">{testResult.conditionsEvaluated}</strong> | Actions Planned:{' '}
                    <strong className="text-blue-400">{testResult.plannedActions?.join(', ') || 'None'}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setTestingRule(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleRunDryRun}
                disabled={runningTest}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                {runningTest ? 'Evaluating...' : 'Run Simulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrderAutomationPage;
