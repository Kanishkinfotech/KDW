import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { uploadImage } from '../../utils/uploadImage';
import { exportToCSV } from '../../utils/csvExport';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminCategories() {
  const { categories, fetchCategories } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const url = await uploadImage(file, 'categories', setUploadProgress);
        if (url) {
          setImagePreview(url);
          toast.success('Category image uploaded successfully');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload image');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId || '');
    setImagePreview(cat.image || null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentId('');
    setImagePreview(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: 'Category description',
        image: imagePreview || undefined,
        status: 'Active',
        parentId: parentId && parentId !== '' ? parentId : null
      };
      
      const headers = getAuthHeaders();

      if (editingId) {
        const res = await axios.put(`/api/categories/${editingId}`, payload, { headers });
        if (res.data.success) {
          toast.success('Category updated successfully');
          handleCancelEdit();
          fetchCategories();
        }
      } else {
        const res = await axios.post('/api/categories', payload, { headers });
        if (res.data.success) {
          toast.success('Category created successfully');
          handleCancelEdit();
          fetchCategories();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Linked products will be safely moved to Uncategorized.')) {
      try {
        const headers = getAuthHeaders();
        const res = await axios.delete(`/api/categories/${id}`, { headers });
        if (res.data.success) {
          toast.success('Category deleted successfully');
          fetchCategories();
          if (editingId === id) handleCancelEdit();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredCategories.map(c => ({
      ID: c.id,
      Name: c.name,
      Slug: c.slug,
      Items: c.count || 0,
      Status: c.status || 'Active'
    }));
    exportToCSV(exportData, 'categories_export');
    toast.success('Categories exported successfully');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Categories</h1>
          <p className="text-slate-500 mt-1">Organize your digital products into collections.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Search size={18} />
          Export Data
        </button>
      </div>

      {/* Main Layout: Table + Form (Split view on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Area (Left/Top) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{cat.name}</p>
                          <p className="text-xs text-slate-500">/{cat.slug}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {cat.count || 0} items
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            (cat.status || 'Active').toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {cat.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(cat)} 
                              className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                              title="Edit Category"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(cat.id)} 
                              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                              title="Delete Category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add / Edit Form (Right/Bottom) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Category' : 'Quick Add'}
              </h3>
              {editingId && (
                <button 
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-semibold"
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. 3D Icons" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug (Optional)</label>
                <input 
                  type="text" 
                  value={slug} 
                  onChange={e => setSlug(e.target.value)} 
                  placeholder="3d-icons" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Category (Optional)</label>
                <select
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900 bg-white"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c: any) => !editingId || c.id !== editingId)
                    .filter((c: any) => !c.parentId)
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Image (Optional)</label>
                <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden h-32">
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleImageChange} disabled={isUploading} />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="text-white animate-spin" size={32} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <ImageIcon size={20} className="text-slate-600 mb-2" />
                      <p className="text-xs text-slate-600 font-medium">Upload Image</p>
                    </>
                  )}
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="submit" 
                  disabled={isSaving || isUploading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
