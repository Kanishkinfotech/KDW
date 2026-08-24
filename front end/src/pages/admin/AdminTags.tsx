import { useState, useEffect } from 'react';
import { Tag as TagIcon, Plus, Search, Trash2, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminTags() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products/tags');
      if (res.data.success) {
        setTags(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      setIsCreating(true);
      const res = await axios.post('/api/products/tags', { name: newTagName.trim() }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Tag "${newTagName}" created`);
        setNewTagName('');
        fetchTags();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete tag "${name}"?`)) return;

    try {
      const res = await axios.delete(`/api/products/tags/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Tag "${name}" deleted`);
        setTags(prev => prev.filter(t => t.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete tag');
    }
  };

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <TagIcon className="text-primary" size={26} />
            Tags Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage search and discovery keywords for digital products.
          </p>
        </div>
      </div>

      {/* Grid: Create Form + Tags List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Tag Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Add New Tag
          </h3>
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tag Name
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. Canva, Agency, n8n, Reels"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Slugs are generated automatically from the tag name.
              </p>
            </div>

            <button
              type="submit"
              disabled={isCreating || !newTagName.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              {isCreating ? 'Creating...' : 'Create Tag'}
            </button>
          </form>
        </div>

        {/* Tags Table & Search */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredTags.length} Total Tags
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Tag Name</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5 text-center">Usage Count</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Loading tags...
                    </td>
                  </tr>
                ) : filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No tags found. Create your first tag on the left.
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <Hash size={14} className="text-primary" />
                        {tag.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                        {tag.slug}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-slate-700">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700">
                          {tag.usageCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          title="Delete Tag"
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
