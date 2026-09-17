import { useState } from 'react';
import { Layers, Plus, Trash2, Check, Edit2, SlidersHorizontal, Info, X } from 'lucide-react';
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
  const [newValInput, setNewValInput] = useState<Record<string, string>>({});
  const [editingValue, setEditingValue] = useState<{ attrKey: string; oldVal: string; currentVal: string } | null>(null);

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
    toast.success('Attribute removed');
  };

  const handleAddValue = (attrKey: string) => {
    const val = (newValInput[attrKey] || '').trim();
    if (!val) return;

    setAttributes(prev => {
      const current = prev[attrKey] || { enabled: true, values: [] };
      const currentVals = current.values || [];
      if (currentVals.includes(val)) {
        toast.error('Value already exists in this attribute');
        return prev;
      }
      return {
        ...prev,
        [attrKey]: {
          ...current,
          values: [...currentVals, val]
        }
      };
    });

    setNewValInput(prev => ({ ...prev, [attrKey]: '' }));
    toast.success(`Added option "${val}"`);
  };

  const handleRemoveValue = (attrKey: string, valToRemove: string) => {
    setAttributes(prev => {
      const current = prev[attrKey];
      if (!current) return prev;
      return {
        ...prev,
        [attrKey]: {
          ...current,
          values: (current.values || []).filter((v: string) => v !== valToRemove)
        }
      };
    });
  };

  const handleSaveEditedValue = (attrKey: string, oldVal: string) => {
    if (!editingValue || editingValue.attrKey !== attrKey || editingValue.oldVal !== oldVal) return;
    const trimmed = editingValue.currentVal.trim();
    if (!trimmed) {
      toast.error('Option value cannot be empty');
      return;
    }
    if (trimmed !== oldVal) {
      const currentVals = attributes[attrKey]?.values || [];
      if (currentVals.includes(trimmed)) {
        toast.error('Value already exists in this attribute');
        return;
      }
      setAttributes(prev => {
        const current = prev[attrKey];
        if (!current) return prev;
        return {
          ...prev,
          [attrKey]: {
            ...current,
            values: (current.values || []).map((v: string) => (v === oldVal ? trimmed : v))
          }
        };
      });
      toast.success(`Updated "${oldVal}" to "${trimmed}"`);
    }
    setEditingValue(null);
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

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allowed Options:</span>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {(!config.values || config.values.length === 0) ? (
                  <span className="text-xs text-slate-400 italic">No values added</span>
                ) : (
                  config.values.map((v: string) => {
                    const isEditing = editingValue?.attrKey === attrKey && editingValue?.oldVal === v;
                    return isEditing ? (
                      <span key={v} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-primary text-xs font-mono shadow-xs">
                        <input
                          type="text"
                          autoFocus
                          value={editingValue.currentVal}
                          onChange={(e) => setEditingValue({ ...editingValue, currentVal: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedValue(attrKey, v);
                            } else if (e.key === 'Escape') {
                              setEditingValue(null);
                            }
                          }}
                          className="w-24 text-xs font-medium text-slate-900 bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditedValue(attrKey, v)}
                          className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                          title="Save"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingValue(null)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                          title="Cancel"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      <span key={v} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium shadow-2xs group hover:bg-slate-200/70 transition-colors">
                        <span
                          onClick={() => setEditingValue({ attrKey, oldVal: v, currentVal: v })}
                          className="cursor-pointer hover:underline"
                          title="Click to edit"
                        >
                          {v}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingValue({ attrKey, oldVal: v, currentVal: v })}
                          className="text-slate-400 hover:text-primary rounded p-0.5 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                          title={`Edit ${v}`}
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(attrKey, v)}
                          className="text-slate-400 hover:text-rose-500 rounded p-0.5 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                          title={`Remove ${v}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              {/* Add option input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newValInput[attrKey] || ''}
                  onChange={(e) => setNewValInput(prev => ({ ...prev, [attrKey]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValue(attrKey);
                    }
                  }}
                  placeholder="+ Add option"
                  className="flex-1 text-xs p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => handleAddValue(attrKey)}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
