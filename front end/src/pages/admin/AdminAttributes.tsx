import { useState, useEffect } from 'react';
import { Sliders, Plus, Search, Trash2, Cpu, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminAttributes() {
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('TEXT');
  const [productType, setProductType] = useState('ALL');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products/attributes');
      if (res.data.success) {
        setAttributes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    const options = type === 'SELECT' 
      ? optionsStr.split(',').map(o => o.trim()).filter(Boolean)
      : null;

    try {
      setIsCreating(true);
      const res = await axios.post('/api/products/attributes', {
        name: name.trim(),
        type,
        productType,
        options,
        isRequired
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Attribute "${name}" created`);
        setName('');
        setOptionsStr('');
        fetchAttributes();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create attribute');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAttribute = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete attribute "${name}"?`)) return;

    try {
      const res = await axios.delete(`/api/products/attributes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Attribute "${name}" deleted`);
        setAttributes(prev => prev.filter(a => a.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const filtered = attributes.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Cpu className="text-primary" size={26} />
            Product Attributes
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Define reusable specification fields per product type (Templates, Automations, Web Kits, Prompts).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Add Attribute Specification
          </h3>
          <form onSubmit={handleCreateAttribute} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Attribute Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Platform, Format, Skill Level"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="TEXT">Text</option>
                  <option value="SELECT">Select Dropdown</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">Boolean (Yes/No)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Type
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">All Types</option>
                  <option value="DOWNLOADABLE_FILE">Downloadable File</option>
                  <option value="TEMPLATE_BUNDLE">Template Bundle</option>
                  <option value="AUTOMATION_WORKFLOW">Automation</option>
                  <option value="WEBSITE_KIT">Website Kit</option>
                  <option value="PROMPT_PACK">Prompt Pack</option>
                  <option value="VIDEO_PRODUCT">Video Product</option>
                  <option value="LICENCE_PRODUCT">Licence Product</option>
                </select>
              </div>
            </div>

            {type === 'SELECT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Options (Comma separated)
                </label>
                <input
                  type="text"
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="e.g. Canva, Figma, Photoshop, Illustrator"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="attrRequired"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-slate-300"
              />
              <label htmlFor="attrRequired" className="text-xs font-bold text-slate-700 cursor-pointer">
                Mandatory before publication
              </label>
            </div>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? 'Saving...' : 'Add Attribute'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="relative w-full max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search attributes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">{filtered.length} Attributes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Attribute Name</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Scope</th>
                  <th className="px-6 py-3.5 text-center">Mandatory</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Loading attributes...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No attributes configured yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((attr) => (
                    <tr key={attr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        {attr.name}
                        {attr.options && Array.isArray(attr.options) && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            Options: {attr.options.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                          {attr.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium text-xs">
                        {attr.productType}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold">
                        {attr.isRequired ? (
                          <span className="text-emerald-600 text-xs font-bold">Yes</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">Optional</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteAttribute(attr.id, attr.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
