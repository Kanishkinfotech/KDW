import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Zap,
  CheckCircle2,
  Plus,
  Play,
  Copy,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const WorkflowTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Preview Modal
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [installing, setInstalling] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/rules?isTemplate=true', { withCredentials: true });
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load workflow templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleInstallTemplate = async (template: any) => {
    try {
      setInstalling(true);
      const res = await axios.post(
        '/api/admin/automation/rules',
        {
          name: `${template.name} (Active Instance)`,
          description: template.description,
          category: template.category,
          triggerEvent: template.triggerEvent,
          conditions: template.conditions,
          actions: template.actions
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Workflow '${template.name}' installed and activated.`);
        setSelectedTemplate(null);
        navigate('/admin/automation/overview');
      }
    } catch (err) {
      toast.error('Failed to install workflow template');
    } finally {
      setInstalling(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.triggerEvent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchTemplates} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Pre-Built Production Workflow Templates (14 Total)
            </h2>
            <p className="text-xs text-slate-400">
              Verified industry-standard blueprints for instantaneous zero-code installation and execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
            >
              <option value="ALL">All Categories</option>
              <option value="ORDER">Order & Payments</option>
              <option value="EMAIL">Email & Transactional</option>
              <option value="CUSTOMER">Customer Lifecycle</option>
              <option value="DOWNLOAD">Download & Delivery</option>
              <option value="LICENCE">Licence Management</option>
              <option value="CUSTOM">Custom / Escalations</option>
            </select>
          </div>
        </div>

        {/* Templates Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-700 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                    {tpl.triggerEvent}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {tpl.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">{tpl.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Actions: <strong className="text-blue-400 font-mono">{tpl.actions?.length || 0}</strong></span>
                  <span>Conditions: <strong className="text-white font-mono">{tpl.conditions?.length || 0}</strong></span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedTemplate(tpl)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Preview & Install
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Preview & Install Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                  {selectedTemplate.triggerEvent}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300">
                  {selectedTemplate.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{selectedTemplate.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Configured Actions</span>
                <div className="space-y-1.5">
                  {selectedTemplate.actions?.map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{act.actionType}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInstallTemplate(selectedTemplate)}
                disabled={installing}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {installing ? 'Installing...' : 'Install & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WorkflowTemplatesPage;
