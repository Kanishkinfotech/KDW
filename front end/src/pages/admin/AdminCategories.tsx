import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FolderTree, Layers, LineChart, RefreshCw, FolderPlus
} from 'lucide-react';
import CategoryTable from '../../components/admin/categories/CategoryTable';
import CategoryWizardModal from '../../components/admin/categories/CategoryWizardModal';
import CategoryTreeView from '../../components/admin/categories/CategoryTreeView';
import CategoryAnalyticsDashboard from '../../components/admin/categories/CategoryAnalyticsDashboard';
import CategoryMoveModal from '../../components/admin/categories/CategoryMoveModal';
import CategoryMergeModal from '../../components/admin/categories/CategoryMergeModal';
import CategoryViewDrawer from '../../components/admin/categories/CategoryViewDrawer';
import toast from 'react-hot-toast';
import axios from 'axios';

type ActiveTabType = 
  | 'all' 
  | 'tree' 
  | 'analytics';

export default function AdminCategories() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Drawer States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [wizardLevel, setWizardLevel] = useState<'PRIMARY' | 'SUBCATEGORY'>('PRIMARY');
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingCategory, setMovingCategory] = useState<any | null>(null);

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergingCategory, setMergingCategory] = useState<any | null>(null);

  const [viewingCategoryId, setViewingCategoryId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.get('/api/categories/admin/all', { headers });
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add' || searchParams.get('new') === 'true') {
      handleOpenAddWizard();
      // Clean up search param so re-clicking or closing operates cleanly
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        next.delete('new');
        return next;
      }, { replace: true });
    }
  }, [searchParams]);

  const handleOpenAddWizard = () => {
    setWizardLevel('PRIMARY');
    setEditingCategory(null);
    setIsWizardOpen(true);
  };

  const handleCreatePrimaryCategory = () => {
    setWizardLevel('PRIMARY');
    setEditingCategory(null);
    setIsWizardOpen(true);
  };

  const handleCreateSubcategory = (parentCat?: any) => {
    const primaryCategories = categories.filter(c => !c.parentId);
    if (primaryCategories.length === 0) {
      toast.error('Please create at least one Primary Category first before adding a Subcategory.');
      return;
    }
    const defaultParent = parentCat?.id || '';
    setWizardLevel('SUBCATEGORY');
    setEditingCategory({
      parentId: defaultParent,
      name: '',
      slug: '',
      description: ''
    });
    setIsWizardOpen(true);
  };

  const handleEdit = (cat: any) => {
    setWizardLevel(cat.parentId ? 'SUBCATEGORY' : 'PRIMARY');
    setEditingCategory(cat);
    setIsWizardOpen(true);
  };

  const handleView = (cat: any) => {
    setViewingCategoryId(cat.id);
  };

  const handleMove = (cat: any) => {
    setMovingCategory(cat);
    setIsMoveModalOpen(true);
  };

  const handleDuplicate = async (cat: any) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.post(`/api/categories/${cat.id}/duplicate`, {}, { headers });
      if (res.data.success) {
        toast.success('Category duplicated successfully');
        fetchCategories();
      }
    } catch (err: any) {
      toast.error('Failed to duplicate category');
    }
  };

  const handleArchive = async (cat: any) => {
    const reason = window.prompt(`Archive category "${cat.name}"? Please provide a reason:`, 'Archived by administrator');
    if (reason === null) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.delete(`/api/categories/${cat.id}`, { 
        headers, 
        data: { reason, forceDelete: false } 
      });

      if (res.data.success) {
        toast.success('Category archived successfully');
        fetchCategories();
      }
    } catch (err: any) {
      toast.error('Failed to archive category');
    }
  };

  const handleAddSubcategory = (parentCat: any) => {
    handleCreateSubcategory(parentCat);
  };

  const tabs: { id: ActiveTabType; label: string; icon: any; count?: number }[] = [
    { id: 'all', label: 'All Categories', icon: FolderTree, count: categories.length },
    { id: 'tree', label: 'Category Tree', icon: Layers },
    { id: 'analytics', label: 'Analytics & Health', icon: LineChart },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-md shadow-primary/25">
              <FolderTree size={16} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Category Management</h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Organize digital products, hierarchy trees, dynamic filters, SEO landing pages, and automated assignment rules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchCategories}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            title="Refresh All"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleCreatePrimaryCategory}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <FolderPlus size={15} />
            <span>+ Create Primary Category</span>
          </button>

          <button
            onClick={() => handleCreateSubcategory()}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Layers size={15} />
            <span>+ Create Subcategory</span>
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs font-bold">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-primary-light' : 'text-slate-400'} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab View Render */}
      <div>
        {activeTab === 'all' && (
          <CategoryTable
            categories={categories}
            isLoading={isLoading}
            onRefresh={fetchCategories}
            onEdit={handleEdit}
            onView={handleView}
            onMove={handleMove}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onAssignProducts={(cat) => handleView(cat)}
            onOpenWizard={handleOpenAddWizard}
          />
        )}

        {activeTab === 'tree' && (
          <CategoryTreeView
            categories={categories}
            onAddSubcategory={handleAddSubcategory}
            onEdit={handleEdit}
            onMove={handleMove}
            onView={handleView}
            onArchive={handleArchive}
          />
        )}


        {activeTab === 'analytics' && (
          <CategoryAnalyticsDashboard />
        )}
      </div>

      {/* Modals & Drawers */}
      <CategoryWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={fetchCategories}
        editCategory={editingCategory}
        categories={categories}
        initialLevel={wizardLevel}
      />

      <CategoryMoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        category={movingCategory}
        categories={categories}
        onSuccess={fetchCategories}
      />

      <CategoryMergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        sourceCategory={mergingCategory}
        categories={categories}
        onSuccess={fetchCategories}
      />

      <CategoryViewDrawer
        isOpen={!!viewingCategoryId}
        onClose={() => setViewingCategoryId(null)}
        categoryId={viewingCategoryId}
      />
    </div>
  );
}
