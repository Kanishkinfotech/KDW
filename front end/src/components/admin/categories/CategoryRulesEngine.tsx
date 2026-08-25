import { useState, useEffect } from 'react';
import { Cpu, Plus, Play, Check, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategoryRulesEngineProps {
  categories: any[];
}

export default function CategoryRulesEngine({ categories }: CategoryRulesEngineProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Rule State
  const [ruleName, setRuleName] = useState('');
  const [conditionField, setConditionField] = useState('productType');
  const [operator, setOperator] = useState('CONTAINS');
  const [conditionValue, setConditionValue] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState(categories[0]?.id || '');
  const [priority, setPriority] = useState(10);

  // Preview State
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await axios.get('/api/categories/rules', { headers });
      if (res.data.success) {
        setRules(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handlePreview = async () => {
    if (!conditionValue.trim()) {
      toast.error('Please specify a condition value');
      return;
    }

    setIsPreviewing(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await axios.post('/api/categories/rules/preview', {
        conditionField,
        operator,
        conditionValue
      }, { headers });

      if (res.data.success) {
        setPreviewCount(res.data.count);
        setPreviewProducts(res.data.products || []);
        toast.success(`Found ${res.data.count} matching products`);
      }
    } catch (err: any) {
      toast.error('Failed to preview rule');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim() || !conditionValue.trim() || !targetCategoryId) {
      toast.error('Please fill in all mandatory rule fields');
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.post('/api/categories/rules', {
        name: ruleName.trim(),
        conditionField,
        operator,
        conditionValue: conditionValue.trim(),
        targetCategoryId,
        priority: Number(priority)
      }, { headers });

      toast.success('Category auto-assignment rule created');
      setRuleName('');
      setConditionValue('');
      setPreviewCount(null);
      fetchRules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create rule');
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    if (!window.confirm('Execute this rule? It will update matching products in the database.')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.post(`/api/categories/rules/${ruleId}/execute`, {}, { headers });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRules();
      }
    } catch (err: any) {
      toast.error('Failed to execute rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule Builder Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Category Auto-Assignment Rules Engine</h3>
          <p className="text-xs text-slate-500">Define IF/THEN rules to automatically assign products to categories based on product attributes or tags.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Rule Name</label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g. Real Estate Bundles"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">IF Field</label>
            <select
              value={conditionField}
              onChange={(e) => setConditionField(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="productType">Product Type</option>
              <option value="tags">Tags</option>
              <option value="name">Product Title</option>
              <option value="description">Description</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contains / Equals</label>
            <input
              type="text"
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              placeholder="e.g. n8n / Real Estate"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">THEN Assign Category</label>
            <select
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {isPreviewing ? 'Testing...' : 'Preview'}
            </button>

            <button
              onClick={handleCreateRule}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
            >
              Save Rule
            </button>
          </div>
        </div>

        {previewCount !== null && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs flex items-center justify-between">
            <span className="font-bold text-purple-900">
              Rule Preview Result: Found <strong>{previewCount}</strong> matching products ready for assignment.
            </span>
            <button
              onClick={() => setPreviewCount(null)}
              className="text-xs text-purple-700 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
              <th className="p-3.5 pl-4">Rule Name</th>
              <th className="p-3.5">IF Condition</th>
              <th className="p-3.5">Target Category</th>
              <th className="p-3.5 text-center">Executions</th>
              <th className="p-3.5 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Loading rules...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No automated rules created yet.</td>
              </tr>
            ) : (
              rules.map(r => {
                const target = categories.find(c => c.id === r.targetCategoryId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3.5 pl-4 font-bold text-slate-900">{r.name}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      IF <strong>{r.conditionField}</strong> {r.operator} "<strong>{r.conditionValue}</strong>"
                    </td>
                    <td className="p-3.5 font-bold text-primary">{target ? target.name : r.targetCategoryId}</td>
                    <td className="p-3.5 text-center font-mono">{r.executionCount || 0} times</td>
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => handleExecuteRule(r.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Play size={12} /> Run Now
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
