import { useState } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Eye, MoveRight, Copy, 
  ArrowUpDown, Filter, Download, CheckCircle2, AlertCircle, 
  ExternalLink, Layers, Sparkles, FolderTree, RefreshCw, X, ChevronLeft, ChevronRight, Check, Package, Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../../utils/csvExport';

interface CategoryTableProps {
  categories: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (cat: any) => void;
  onView: (cat: any) => void;
  onMove: (cat: any) => void;
  onDuplicate: (cat: any) => void;
  onArchive: (cat: any) => void;
  onAssignProducts: (cat: any) => void;
  onOpenWizard: () => void;
}

export default function CategoryTable({
  categories,
  isLoading,
  onRefresh,
  onEdit,
  onView,
  onMove,
  onDuplicate,
  onArchive,
  onAssignProducts,
  onOpenWizard
}: CategoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [parentFilter, setParentFilter] = useState('ALL');
  const [hasProductsFilter, setHasProductsFilter] = useState('ALL');
  const [seoFilter, setSeoFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter Categories
  const filtered = categories.filter(cat => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      cat.name?.toLowerCase().includes(q) || 
      cat.slug?.toLowerCase().includes(q) || 
      cat.categoryCode?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || cat.status === statusFilter;
    const matchesParent = parentFilter === 'ALL' || 
      (parentFilter === 'ROOT' ? !cat.parentId : cat.parentId === parentFilter);
    const matchesProducts = hasProductsFilter === 'ALL' || 
      (hasProductsFilter === 'HAS_PRODUCTS' ? (cat.productCount > 0) : (cat.productCount === 0));
    const matchesSeo = seoFilter === 'ALL' || 
      (seoFilter === 'INCOMPLETE' ? (!cat.seoTitle || !cat.seoDescription) : (cat.seoTitle && cat.seoDescription));

    return matchesSearch && matchesStatus && matchesParent && matchesProducts && matchesSeo;
  }).sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const data = filtered.map(c => ({
      ID: c.id,
      Code: c.categoryCode || 'N/A',
      Name: c.name,
      Slug: c.slug,
      Parent: c.parent?.name || 'Root',
      Status: c.status || 'ACTIVE',
      TotalProducts: c.productCount || 0,
      ActiveProducts: c.activeProductCount || 0,
      ScheduledProducts: c.scheduledProductCount || 0,
      DraftProducts: c.draftProductCount || 0,
      ArchivedProducts: c.archivedProductCount || 0,
      QualityScore: `${c.qualityScore || 0}%`,
      SEOTitle: c.seoTitle || 'N/A'
    }));
    exportToCSV(data, 'kdw_categories_export');
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const handleToggleFeatured = async (cat: any) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const nextVal = !cat.featured;
      await axios.put(`/api/categories/${cat.id}`, {
        featured: nextVal
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      toast.success(nextVal ? `★ "${cat.name}" marked as Featured Category!` : `"${cat.name}" removed from Featured.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update category featured status');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories by name, slug, or code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2.5 text-xs font-semibold">
        <span className="text-slate-400 flex items-center gap-1">
          <Filter size={13} /> Filters:
        </span>

        {/* Level / Hierarchy */}
        <select
          value={parentFilter}
          onChange={(e) => setParentFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Levels</option>
          <option value="ROOT">Root Categories Only</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Product Count Filter */}
        <select
          value={hasProductsFilter}
          onChange={(e) => setHasProductsFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Product States</option>
          <option value="HAS_PRODUCTS">Has Products (&gt; 0)</option>
          <option value="NO_PRODUCTS">Empty (0 Products)</option>
        </select>

        {/* SEO Filter */}
        <select
          value={seoFilter}
          onChange={(e) => setSeoFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All SEO States</option>
          <option value="COMPLETE">SEO Complete</option>
          <option value="INCOMPLETE">SEO Incomplete</option>
        </select>

        {(statusFilter !== 'ALL' || parentFilter !== 'ALL' || hasProductsFilter !== 'ALL' || seoFilter !== 'ALL' || searchTerm) && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setParentFilter('ALL');
              setHasProductsFilter('ALL');
              setSeoFilter('ALL');
              setSearchTerm('');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    onChange={handleSelectAll}
                    className="rounded text-primary focus:ring-primary/20"
                  />
                </th>
                <th className="p-3.5 font-extrabold">Category Name</th>
                <th className="p-3.5 font-extrabold text-center">Sort Order</th>
                <th className="p-3.5 font-extrabold">Parent / Level</th>
                <th className="p-3.5 font-extrabold">Slug / Code</th>
                <th className="p-3.5 font-extrabold text-center">Total Products</th>
                <th className="p-3.5 font-extrabold text-center">Active</th>
                <th className="p-3.5 font-extrabold text-center">Scheduled</th>
                <th className="p-3.5 font-extrabold text-center">Quality Score</th>
                <th className="p-3.5 font-extrabold text-center">Status</th>
                <th className="p-3.5 font-extrabold text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline mr-2 text-primary" size={18} />
                    Loading categories from database...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    No categories found matching your query.
                  </td>
                </tr>
              ) : (
                paginated.map(cat => {
                  const isSelected = selectedIds.includes(cat.id);
                  const isRoot = !cat.parentId;
                  const quality = cat.qualityScore || 0;
                  const totalProducts = cat.productCount || 0;
                  const activeProducts = cat.activeProductCount || 0;
                  const scheduledProducts = cat.scheduledProductCount || 0;

                  return (
                    <tr 
                      key={cat.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50/40' : ''}`}
                    >
                      <td className="p-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cat.id)}
                          className="rounded text-primary focus:ring-primary/20"
                        />
                      </td>

                      {/* Name & Banner */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {cat.image || cat.banner ? (
                            <img 
                              src={cat.image || cat.banner} 
                              alt={cat.name} 
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                              {cat.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                              {cat.name}
                            </span>
                            {cat.featured && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                <Sparkles size={10} /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-lg text-xs font-black font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                          #{cat.displayOrder ?? 0}
                        </span>
                      </td>

                      {/* Parent / Level */}
                      <td className="p-3.5">
                        {isRoot ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            Root (Level 1)
                          </span>
                        ) : (
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block truncate max-w-[140px]">
                              ↳ {cat.parent?.name || 'Subcategory'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Level 2</span>
                          </div>
                        )}
                      </td>

                      {/* Slug & Code */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        <span className="block text-slate-700 font-bold">/{cat.slug}</span>
                        <span className="text-[10px] text-slate-400">{cat.categoryCode || 'N/A'}</span>
                      </td>

                      {/* Total Products (Clickable to view Category Products) */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onView(cat)}
                          title="Click to view category products"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-purple-100 hover:text-primary rounded-lg text-slate-900 font-extrabold font-mono text-xs transition-colors cursor-pointer"
                        >
                          <Package size={12} className="text-slate-400" />
                          <span>{totalProducts}</span>
                        </button>
                      </td>

                      {/* Active Products */}
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-700 text-xs">
                        {activeProducts}
                      </td>

                      {/* Scheduled Products */}
                      <td className="p-3.5 text-center font-mono font-bold text-amber-700 text-xs">
                        {scheduledProducts}
                      </td>

                      {/* Quality Score */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getQualityColor(quality)}`}>
                          {quality}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          cat.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : cat.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {cat.status}
                        </span>
                      </td>

                      {/* Action Menu */}
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1-Click Toggle Featured */}
                          <button
                            onClick={() => handleToggleFeatured(cat)}
                            title={cat.featured ? "Remove from Featured" : "Mark as Featured Category"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              cat.featured 
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-50' 
                                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50/50'
                            }`}
                          >
                            <Star size={14} className={cat.featured ? 'fill-amber-400' : ''} />
                          </button>

                          <button
                            onClick={() => onView(cat)}
                            title="View Category Details & Products"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => onEdit(cat)}
                            title="Edit Category"
                            className="p-1.5 text-slate-500 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => onMove(cat)}
                            title="Move Category Hierarchy Position"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoveRight size={14} />
                          </button>

                          <button
                            onClick={() => onDuplicate(cat)}
                            title="Duplicate Category as Draft"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>

                          <button
                            onClick={() => onArchive(cat)}
                            title="Archive Category"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 px-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Showing {paginated.length} of {filtered.length} categories</span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
