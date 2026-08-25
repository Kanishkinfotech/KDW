import { useState } from 'react';
import { Layers, Plus, Trash2, Check, Edit2, SlidersHorizontal, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategoryAttributesManagerProps {
  categories: any[];
  onRefresh: () => void;
}

export default function CategoryAttributesManager({ categories, onRefresh }: CategoryAttributesManagerProps) {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  const [attributes, setAttributes] = useState<Record<string, any>>(() => {
    return currentCategory?.attributeConfig || {
      format: { enabled: true, filterable: true, values: ['Canva', 'Word', 'Google Docs', 'PDF', 'Excel', 'Figma'] },
      industry: { enabled: true, filterable: true, values: ['Agency', 'Real Estate', 'Healthcare', 'Education', 'E-commerce', 'Tech'] },
      language: { enabled: true, filterable: true, values: ['English', 'Hindi', 'Bilingual'] },
      licence: { enabled: true, filterable: true, values: ['Personal', 'Commercial', 'Agency Extended'] }
    };
  });

  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');

  const handleCategorySelect = (id: string) => {
    setSelectedCatId(id);
    const cat = categories.find(c => c.id === id);
    if (cat && cat.attributeConfig) {
      setAttributes(cat.attributeConfig);
    } else {
      setAttributes({
        format: { enabled: true, filterable: true, values: ['Canva', 'Word', 'Google Docs', 'PDF', 'Excel', 'Figma'] },
        industry: { enabled: true, filterable: true, values: ['Agency', 'Real Estate', 'Healthcare', 'Education'] },
        language: { enabled: true, filterable: true, values: ['English', 'Hindi'] },
        licence: { enabled: true, filterable: true, values: ['Personal', 'Commercial'] }
      });
    }
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    const key = newAttrName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const vals = newAttrValues.split(',').map(v => v.trim()).filter(Boolean);

    setAttributes(prev => ({
      ...prev,
      [key]: {
        enabled: true,
        filterable: true,
        values: vals.length > 0 ? vals : ['Standard', 'Custom']
      }
    }));

    setNewAttrName('');
    setNewAttrValues('');
    toast.success(`Added attribute: ${newAttrName}`);
  };

  const handleRemoveAttribute = (key: string) => {
    setAttributes(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSaveAttributes = async () => {
    if (!currentCategory) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.put(`/api/categories/${currentCategory.id}`, {
        attributeConfig: attributes
      }, { headers });

      toast.success('Category attributes saved successfully');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save attributes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Category Attribute Sets & Facets</h3>
          <p className="text-xs text-slate-500">Configure dynamic filterable attributes that appear in product forms and storefront sidebars.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCatId}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={handleSaveAttributes}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors cursor-pointer shadow-md shadow-primary/20"
          >
            {isSaving ? 'Saving...' : 'Save Attributes'}
          </button>
        </div>
      </div>

      {/* Add New Attribute Card */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
        <span className="font-bold text-slate-800 block">Add Custom Specification / Filter:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            placeholder="e.g. Compatibility / Resolution"
            className="p-2.5 bg-white border border-slate-200 rounded-xl"
          />
          <input
            type="text"
            value={newAttrValues}
            onChange={(e) => setNewAttrValues(e.target.value)}
            placeholder="Comma separated values: Canva, Figma, 4K"
            className="p-2.5 bg-white border border-slate-200 rounded-xl"
          />
          <button
            onClick={handleAddAttribute}
            className="py-2.5 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Add Attribute
          </button>
        </div>
      </div>

      {/* Attributes List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(attributes).map(([attrKey, config]: [string, any]) => (
          <div key={attrKey} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs capitalize text-slate-900">{attrKey.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-slate-400 block font-mono">key: {attrKey}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.filterable}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setAttributes(prev => ({
                        ...prev,
                        [attrKey]: { ...config, filterable: val }
                      }));
                    }}
                    className="rounded text-primary focus:ring-primary/20"
                  />
                  <span>Filterable</span>
                </label>

                <button
                  onClick={() => handleRemoveAttribute(attrKey)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allowed Options:</span>
              <div className="flex flex-wrap gap-1.5">
                {config.values?.map((v: string) => (
                  <span key={v} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
