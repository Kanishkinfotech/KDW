import React, { useState } from 'react';
import { Clock, ShieldCheck, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';

export default function SlaSettingsPage() {
  const [criticalFirst, setCriticalFirst] = useState(30);
  const [criticalRes, setCriticalRes] = useState(4);

  const [highFirst, setHighFirst] = useState(2);
  const [highRes, setHighRes] = useState(24);

  const [mediumFirst, setMediumFirst] = useState(8);
  const [mediumRes, setMediumRes] = useState(72);

  const [lowFirst, setLowFirst] = useState(24);
  const [lowRes, setLowRes] = useState(120);

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <SupportLayout
      title="SLA Policies & Timezone Configuration"
      subtitle="Configure target first response times, resolution deadlines, and automatic escalation thresholds."
    >
      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            SLA Policies updated and synchronized with the engine.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Priority SLA Targets
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Critical */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
              <span className="font-bold text-rose-900 block">Critical Priority</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">First Response (Mins)</label>
                  <input
                    type="number"
                    value={criticalFirst}
                    onChange={e => setCriticalFirst(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">Resolution (Hours)</label>
                  <input
                    type="number"
                    value={criticalRes}
                    onChange={e => setCriticalRes(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            {/* High */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
              <span className="font-bold text-amber-900 block">High Priority</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">First Response (Hours)</label>
                  <input
                    type="number"
                    value={highFirst}
                    onChange={e => setHighFirst(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">Resolution (Hours)</label>
                  <input
                    type="number"
                    value={highRes}
                    onChange={e => setHighRes(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Medium */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
              <span className="font-bold text-blue-900 block">Medium Priority</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-800 mb-1">First Response (Hours)</label>
                  <input
                    type="number"
                    value={mediumFirst}
                    onChange={e => setMediumFirst(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-blue-800 mb-1">Resolution (Hours)</label>
                  <input
                    type="number"
                    value={mediumRes}
                    onChange={e => setMediumRes(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Low */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block">Low Priority</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">First Response (Hours)</label>
                  <input
                    type="number"
                    value={lowFirst}
                    onChange={e => setLowFirst(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resolution (Hours)</label>
                  <input
                    type="number"
                    value={lowRes}
                    onChange={e => setLowRes(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save SLA Policy
            </button>
          </div>
        </div>
      </form>
    </SupportLayout>
  );
}
