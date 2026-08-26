import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import { KeyRound, Zap, Play, Pause, Plus, Search } from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const LicenceAutomationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/rules?category=LICENCE', { withCredentials: true });
      if (res.data.success) {
        setRules(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load licence automation rules');
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
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Software Licence Issuance & Revocation Automation
            </h2>
            <p className="text-xs text-slate-400">
              Generate unique cryptographically signed license keys upon software order completion, and auto-revoke upon refund.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search licence rules..."
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

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.length === 0 ? (
            <div className="col-span-2 bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
              No licence automation rules found.
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded-md border border-cyan-500/20">
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
                  <p className="text-xs text-slate-400">{rule.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Conditions: <strong className="text-white font-mono">{rule.conditions?.length || 0}</strong></span>
                    <span>Actions: <strong className="text-blue-400 font-mono">{rule.actions?.length || 0}</strong></span>
                    <span>Keys Issued: <strong className="text-white font-mono">{rule.executionCount}</strong></span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
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
    </div>
  );
};
export default LicenceAutomationPage;
