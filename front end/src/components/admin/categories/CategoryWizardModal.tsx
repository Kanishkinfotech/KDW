import { useState, useEffect } from 'react';
import { 
  X, Check, ChevronRight, ChevronLeft, Sparkles, AlertCircle, 
  HelpCircle, Upload, Plus, Trash2, Layers, FolderTree, FileText, 
  Settings, Globe, Eye, Calendar, Clock, ShieldCheck, Archive
} from 'lucide-react';
import { uploadImage } from '../../../utils/uploadImage';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategoryWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCategory?: any | null;
  categories: any[];
  initialLevel?: 'PRIMARY' | 'SUBCATEGORY';
}

interface CategoryFormData {
  name: string;
  categoryCode: string;
  slug: string;
  shortDescription: string;
  description: string;
  internalNote: string;
  parentId: string;
  image: string;
  icon: string;
  banner: string;
  buyingGuide: string;
  ctaText: string;
  displayOrder: number;
  status: string;
  featured: boolean;
  featuredPlacement: string;
  featuredPriority: number;
  featuredStartDate: string;
  featuredEndDate: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogImage: string;
  noindex: boolean;
  includeInSitemap: boolean;
  publishScheduledAt: string;
  attributeConfig?: Record<string, any>;
  faqs?: Array<{ question: string; answer: string }>;
}

export default function CategoryWizardModal({
  isOpen,
  onClose,
  onSuccess,
  editCategory,
  categories,
  initialLevel = 'PRIMARY'
}: CategoryWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryLevel, setCategoryLevel] = useState<'PRIMARY' | 'SUBCATEGORY'>(initialLevel);

  // Form State
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    categoryCode: '',
    slug: '',
    shortDescription: '',
    description: '',
    internalNote: '',
    parentId: '',
    image: '',
    icon: '',
    banner: '',
    buyingGuide: '',
    ctaText: 'Explore Category',
    displayOrder: 0,
    status: 'ACTIVE',
    featured: false,
    featuredPlacement: 'HOMEPAGE_CARD',
    featuredPriority: 0,
    featuredStartDate: '',
    featuredEndDate: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    ogImage: '',
    noindex: false,
    includeInSitemap: true,
    publishScheduledAt: '',
    attributeConfig: {
      format: { enabled: true, filterable: true, values: ['Canva', 'Word', 'Google Docs', 'PDF', 'Excel', 'Figma'] },
      industry: { enabled: true, filterable: true, values: ['Agency', 'Real Estate', 'Healthcare', 'Education', 'E-commerce', 'Tech'] },
      language: { enabled: true, filterable: true, values: ['English', 'Hindi', 'Bilingual'] },
      licence: { enabled: true, filterable: true, values: ['Personal', 'Commercial', 'Agency Extended'] }
    },
    faqs: []
  });

  // Populate data when editing or changing open state
  useEffect(() => {
    if (editCategory) {
      const isSub = Boolean(editCategory.parentId && editCategory.parentId !== 'root');
      setCategoryLevel(isSub ? 'SUBCATEGORY' : 'PRIMARY');
      setFormData({
        name: editCategory.name || '',
        categoryCode: editCategory.categoryCode || '',
        slug: editCategory.slug || '',
        shortDescription: editCategory.shortDescription || '',
        description: editCategory.description || '',
        internalNote: editCategory.internalNote || '',
        parentId: editCategory.parentId || '',
        image: editCategory.image || editCategory.banner || '',
        icon: editCategory.icon || '',
        banner: editCategory.banner || editCategory.image || '',
        buyingGuide: editCategory.buyingGuide || '',
        ctaText: editCategory.ctaText || 'Explore Category',
        displayOrder: editCategory.displayOrder || 0,
        status: editCategory.status || 'ACTIVE',
        featured: !!editCategory.featured,
        featuredPlacement: editCategory.featuredPlacement || 'HOMEPAGE_CARD',
        featuredPriority: editCategory.featuredPriority || 0,
        featuredStartDate: editCategory.featuredStartDate ? editCategory.featuredStartDate.split('T')[0] : '',
        featuredEndDate: editCategory.featuredEndDate ? editCategory.featuredEndDate.split('T')[0] : '',
        seoTitle: editCategory.seoTitle || '',
        seoDescription: editCategory.seoDescription || '',
        seoKeywords: editCategory.seoKeywords || '',
        canonicalUrl: editCategory.canonicalUrl || '',
        ogImage: editCategory.ogImage || '',
        noindex: !!editCategory.noindex,
        includeInSitemap: editCategory.includeInSitemap !== false,
        publishScheduledAt: editCategory.publishScheduledAt ? editCategory.publishScheduledAt.split('T')[0] : '',
        attributeConfig: editCategory.attributeConfig || {
          format: { enabled: true, filterable: true, values: ['Canva', 'Word', 'Google Docs', 'PDF', 'Excel', 'Figma'] },
          industry: { enabled: true, filterable: true, values: ['Agency', 'Real Estate', 'Healthcare', 'Education', 'E-commerce', 'Tech'] },
          language: { enabled: true, filterable: true, values: ['English', 'Hindi', 'Bilingual'] },
          licence: { enabled: true, filterable: true, values: ['Personal', 'Commercial', 'Agency Extended'] }
        },
        faqs: editCategory.faqs || []
      });
    } else {
      const isSub = initialLevel === 'SUBCATEGORY';
      const firstPrimary = categories.find(c => !c.parentId);
      const usedOrders = categories
        .map((c: any) => Number(c.displayOrder))
        .filter((n: number) => !isNaN(n) && n > 0);
      const nextAvailable = (usedOrders.length > 0 ? Math.max(...usedOrders) : 0) + 1;

      setCategoryLevel(isSub ? 'SUBCATEGORY' : 'PRIMARY');
      setFormData({
        name: '',
        categoryCode: '',
        slug: '',
        shortDescription: '',
        description: '',
        internalNote: '',
        parentId: '',
        image: '',
        icon: '',
        banner: '',
        buyingGuide: '',
        ctaText: 'Explore Category',
        displayOrder: nextAvailable,
        status: 'ACTIVE',
        featured: false,
        featuredPlacement: 'HOMEPAGE_CARD',
        featuredPriority: 0,
        featuredStartDate: '',
        featuredEndDate: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        canonicalUrl: '',
        ogImage: '',
        noindex: false,
        includeInSitemap: true,
        publishScheduledAt: '',
        attributeConfig: {
          format: { enabled: true, filterable: true, values: ['Canva', 'Word', 'Google Docs', 'PDF', 'Excel', 'Figma'] },
          industry: { enabled: true, filterable: true, values: ['Agency', 'Real Estate', 'Healthcare', 'Education', 'E-commerce', 'Tech'] },
          language: { enabled: true, filterable: true, values: ['English', 'Hindi', 'Bilingual'] },
          licence: { enabled: true, filterable: true, values: ['Personal', 'Commercial', 'Agency Extended'] }
        },
        faqs: []
      });
    }
    setCurrentStep(1);
  }, [editCategory, isOpen, initialLevel, categories]);

  const usedOrders = categories
    .map((c: any) => Number(c.displayOrder))
    .filter((n: number) => !isNaN(n) && n > 0);
  const nextAvailableOrder = (usedOrders.length > 0 ? Math.max(...usedOrders) : 0) + 1;

  const conflictingCategory = categories.find((c: any) => 
    c.id !== editCategory?.id && 
    Number(c.displayOrder) === Number(formData.displayOrder) && 
    Number(formData.displayOrder) > 0
  );

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Basic Info', desc: 'Name, code, slug & hierarchy' },
    { id: 2, title: 'Content & Media', desc: 'Descriptions & banners' },
    { id: 3, title: 'Navigation', desc: 'Storefront links' },
    { id: 4, title: 'SEO & Metadata', desc: 'Meta tags & search' },
    { id: 5, title: 'Visibility', desc: 'Status & scheduling' },
    { id: 6, title: 'Review', desc: 'Quality audit & publish' },
  ];

  const handleNameChange = (val: string) => {
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const generatedCode = `CAT-${val.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'CAT')}-${Math.floor(100 + Math.random() * 900)}`;

    setFormData(prev => ({
      ...prev,
      name: val,
      slug: editCategory ? prev.slug : generatedSlug,
      categoryCode: prev.categoryCode || generatedCode,
      seoTitle: prev.seoTitle || `${val} | KDW Digital Store`,
      seoDescription: prev.seoDescription || prev.shortDescription
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const url = await uploadImage(file, 'categories', setUploadProgress);
        if (url) {
          setFormData(prev => ({ ...prev, image: url, banner: url }));
          toast.success('Category image uploaded successfully');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload image');
      }
    }
  };

  const calculateQuality = () => {
    let score = 0;
    if (formData.name && formData.slug) score += 15;
    score += 10; // hierarchy
    if (formData.description && formData.description.length > 20) score += 20;
    else if (formData.shortDescription) score += 10;
    if (formData.banner || formData.image) score += 15;
    score += 15; // product assignment ready
    if (formData.seoTitle && formData.seoDescription) score += 15;
    else if (formData.seoTitle || formData.seoDescription) score += 8;
    if (formData.slug) score += 5;
    score += 5; // navigation
    return Math.min(100, score);
  };

  const handleSave = async (forceStatus?: string) => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      setCurrentStep(1);
      return;
    }

    if (categoryLevel === 'SUBCATEGORY' && (!formData.parentId || formData.parentId === 'root')) {
      toast.error('Please select a parent primary category for the subcategory');
      setCurrentStep(1);
      return;
    }

    if (conflictingCategory) {
      toast.error(`Display sort order #${formData.displayOrder} is already in use by category "${conflictingCategory.name}". Each category must have a unique sort order.`);
      setCurrentStep(3);
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const categoryImg = formData.image || formData.banner || null;
      const finalDesc = formData.description || formData.shortDescription || null;
      const finalShort = formData.shortDescription || (formData.description ? formData.description.substring(0, 160) : null);

      const targetStatus = forceStatus || formData.status || 'ACTIVE';

      const payload = {
        ...formData,
        description: finalDesc,
        shortDescription: finalShort,
        image: categoryImg,
        banner: categoryImg,
        status: targetStatus,
        parentId: categoryLevel === 'SUBCATEGORY' && formData.parentId && formData.parentId !== 'root' ? formData.parentId : null
      };

      if (editCategory) {
        await axios.put(`/api/categories/${editCategory.id}`, payload, { headers });
        const actionLabel = targetStatus === 'DRAFT' 
          ? 'saved as draft' 
          : targetStatus === 'ARCHIVED' 
          ? 'archived successfully' 
          : targetStatus === 'PENDING_REVIEW' 
          ? 'submitted for review' 
          : 'updated successfully';
        toast.success(categoryLevel === 'SUBCATEGORY' ? `Subcategory ${actionLabel}` : `Category ${actionLabel}`);
      } else {
        await axios.post('/api/categories', payload, { headers });
        const actionLabel = targetStatus === 'DRAFT' 
          ? 'saved as draft' 
          : targetStatus === 'ARCHIVED' 
          ? 'created as archived' 
          : targetStatus === 'PENDING_REVIEW' 
          ? 'submitted for review' 
          : 'created successfully';
        toast.success(categoryLevel === 'SUBCATEGORY' ? `Subcategory ${actionLabel}` : `Primary Category ${actionLabel}`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        toast.error('Category name is required');
        return;
      }
      if (categoryLevel === 'SUBCATEGORY' && (!formData.parentId || formData.parentId === 'root')) {
        toast.error('Please select a parent primary category for the subcategory');
        return;
      }
    }
    setCurrentStep(s => s + 1);
  };

  const qualityScore = calculateQuality();

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="p-4 px-6 bg-[#0B1120] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-primary/30 text-primary-light font-black text-[10px] uppercase tracking-wider">
                {editCategory ? (categoryLevel === 'SUBCATEGORY' ? 'Edit Subcategory' : 'Edit Primary Category') : (categoryLevel === 'SUBCATEGORY' ? 'New Subcategory Wizard' : 'New Primary Category Wizard')}
              </span>
              <span className="text-xs text-slate-400 font-bold">Step {currentStep} of {steps.length}</span>
            </div>
            <h3 className="text-base font-black text-white mt-0.5">
              {steps[currentStep - 1].title} — <span className="text-slate-400 font-normal text-xs">{steps[currentStep - 1].desc}</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Steps Progress Bar */}
        <div className="bg-slate-100 p-2.5 px-6 border-b border-slate-200 overflow-x-auto custom-scrollbar flex items-center gap-2">
          {steps.map(s => {
            const isDone = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-primary text-white shadow-xs' 
                    : isDone 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isDone ? <Check size={12} className="stroke-[3]" /> : <span>{s.id}.</span>}
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Step Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {/* STEP 1: BASIC INFORMATION & CATEGORY TYPE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Category Hierarchy Level Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Category Hierarchy Level <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Choose category tier</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label 
                    className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      categoryLevel === 'PRIMARY' 
                        ? 'border-primary bg-primary/5 text-primary shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      setCategoryLevel('PRIMARY');
                      setFormData(prev => ({ ...prev, parentId: '' }));
                    }}
                  >
                    <input 
                      type="radio" 
                      name="categoryType" 
                      checked={categoryLevel === 'PRIMARY'} 
                      onChange={() => {
                        setCategoryLevel('PRIMARY');
                        setFormData(prev => ({ ...prev, parentId: '' }));
                      }}
                      className="w-4 h-4 text-primary" 
                    />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">📁 Primary Category (Root)</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Top-level primary store category (e.g. Business Templates)</span>
                    </div>
                  </label>

                  <label 
                    className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      categoryLevel === 'SUBCATEGORY' 
                        ? 'border-primary bg-primary/5 text-primary shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      setCategoryLevel('SUBCATEGORY');
                    }}
                  >
                    <input 
                      type="radio" 
                      name="categoryType" 
                      checked={categoryLevel === 'SUBCATEGORY'} 
                      onChange={() => {
                        setCategoryLevel('SUBCATEGORY');
                      }}
                      className="w-4 h-4 text-primary" 
                    />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">↳ Subcategory (Child Level)</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Nested child under a primary category</span>
                    </div>
                  </label>
                </div>

                {/* If Subcategory selected, show Parent Selector */}
                {categoryLevel === 'SUBCATEGORY' && (
                  <div className="pt-2 animate-in fade-in space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Parent Primary Category <span className="text-rose-500">*</span>
                    </label>
                    {categories.filter(c => !c.parentId && (!editCategory || c.id !== editCategory.id)).length > 0 ? (
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories
                          .filter(c => !c.parentId && (!editCategory || c.id !== editCategory.id))
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              📁 {c.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                        ⚠️ No Primary Categories available. Please create a Primary Category first before adding a Subcategory.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={formData.parentId ? "e.g. Sales Proposals" : "e.g. Business Templates"}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Customer-facing title shown in menus and headers.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Code (Immutable SKU)
                  </label>
                  <input
                    type="text"
                    value={formData.categoryCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CAT-BUS-PROP"
                    className="w-full text-xs p-2.5 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique internal reference identifier.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl px-3 py-2.5 text-xs text-slate-500 font-mono">
                    /categories/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                    placeholder="business-templates"
                    className="flex-1 text-xs p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-r-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="One-line summary for cards and search snippets."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CONTENT & MEDIA */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Category Description</label>
                  <span className="text-[11px] text-slate-400">Displayed on storefront & cards</span>
                </div>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      description: val,
                      shortDescription: prev.shortDescription || val.substring(0, 160)
                    }));
                  }}
                  placeholder="Detailed category overview shown on category storefront pages and product cards."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Category Image (Unified Single Option) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Image</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {formData.image || formData.banner ? (
                    <div className="relative group shrink-0">
                      <img 
                        src={formData.image || formData.banner} 
                        alt="Category Preview" 
                        className="w-28 h-20 rounded-xl object-cover border border-slate-200 shadow-xs" 
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '', banner: '' }))}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Upload size={20} />
                      <span className="text-[10px] mt-1 font-bold">No Image</span>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500">
                      Upload category image. This image is displayed on storefront category cards and header banners.
                    </p>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buying Guide */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Buying Guide Snippet</label>
                <input
                  type="text"
                  value={formData.buyingGuide}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyingGuide: e.target.value }))}
                  placeholder="e.g. Choose Figma kits for app UI, Canva templates for social marketing."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 3: NAVIGATION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-0.5">Display Sort Order</label>
                    <p className="text-[11px] text-slate-500">
                      Determines the display sequence in menus and storefront catalog. Lower numbers appear first.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200/80 rounded font-bold text-slate-600">
                    Next Available: #{nextAvailableOrder}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="1"
                      value={formData.displayOrder || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className={`w-full text-sm font-bold font-mono p-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                        conflictingCategory 
                          ? 'border-rose-300 ring-rose-200 text-rose-700 bg-rose-50/30' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 text-slate-900'
                      }`}
                      placeholder="e.g. 1"
                    />
                  </div>

                  {conflictingCategory && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, displayOrder: nextAvailableOrder }))}
                      className="px-3 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors cursor-pointer"
                    >
                      Use #{nextAvailableOrder} (Next Available)
                    </button>
                  )}
                </div>

                {conflictingCategory ? (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 font-medium">
                    <AlertCircle size={15} className="shrink-0 text-rose-600" />
                    <span>
                      Number <strong>#{formData.displayOrder}</strong> is already used by category <strong>"{conflictingCategory.name}"</strong>. Each category must have a unique sort order.
                    </span>
                  </div>
                ) : formData.displayOrder > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <Check size={14} />
                    <span>Sort order #{formData.displayOrder} is unique and available.</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">Please enter a positive number (1, 2, 3...) for the sort order.</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-xs text-slate-800 block">Featured Promotional Placement</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="rounded text-primary focus:ring-primary/20"
                  />
                  <span>Mark as Featured Category on Homepage</span>
                </label>

                {formData.featured && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Placement Target</label>
                      <select
                        value={formData.featuredPlacement}
                        onChange={(e) => setFormData(prev => ({ ...prev, featuredPlacement: e.target.value }))}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="HOMEPAGE_CARD">Homepage Category Card</option>
                        <option value="MAIN_NAV">Main Navigation Highlight</option>
                        <option value="HERO_BANNER">Hero Banner Spotlight</option>
                        <option value="CAMPAIGN_LANDING">Campaign Landing Feature</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Featured Priority (1-100)</label>
                      <input
                        type="number"
                        value={formData.featuredPriority}
                        onChange={(e) => setFormData(prev => ({ ...prev, featuredPriority: Number(e.target.value) }))}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SEO & METADATA */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meta SEO Title</label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="e.g. Business Templates for Agencies | KDW Digital World"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Recommended length: 50–60 characters ({formData.seoTitle.length} chars)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meta SEO Description</label>
                <textarea
                  rows={2}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="Download editable templates, proposals, checklists, and documents from KDW."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Recommended length: 120–160 characters ({formData.seoDescription.length} chars)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.canonicalUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                    placeholder={`/categories/${formData.slug}`}
                    className="w-full text-xs p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={formData.seoKeywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                    placeholder="templates, business, proposals, checklists"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.includeInSitemap}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeInSitemap: e.target.checked }))}
                    className="rounded text-primary focus:ring-primary/20"
                  />
                  <span>Include in XML Sitemap</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.noindex}
                    onChange={(e) => setFormData(prev => ({ ...prev, noindex: e.target.checked }))}
                    className="rounded text-primary focus:ring-primary/20"
                  />
                  <span>Noindex (Hide from Search Engines)</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: VISIBILITY & SCHEDULING */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Publishing Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'ACTIVE', label: 'Active', desc: 'Live & visible in store', icon: '🟢', border: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'DRAFT', label: 'Draft', desc: 'Hidden from store catalog', icon: '🟡', border: 'border-amber-500 bg-amber-50 text-amber-800' },
                    { id: 'PENDING_REVIEW', label: 'Pending Review', desc: 'Awaiting team approval', icon: '🔵', border: 'border-blue-500 bg-blue-50 text-blue-800' },
                    { id: 'ARCHIVED', label: 'Archived', desc: 'Decommissioned & offline', icon: '⚫', border: 'border-slate-500 bg-slate-100 text-slate-800' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: st.id }))}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        formData.status === st.id 
                          ? `${st.border} shadow-sm ring-1 ring-offset-1 ring-primary/30` 
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs">{st.icon} {st.label}</span>
                        {formData.status === st.id && <Check size={14} className="stroke-[3]" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{st.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & PUBLISH */}
          {currentStep === 6 && (
            <div className="space-y-4">
              {/* Quality Score Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Category Completeness Score:</span>
                  <span className="text-xs text-slate-500">Based on SEO, metadata, banner, and structure.</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{qualityScore}%</span>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {qualityScore >= 80 ? 'Excellent' : qualityScore >= 50 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs divide-y divide-slate-100">
                <div className="p-3 flex justify-between bg-slate-50/50">
                  <span className="font-bold text-slate-600">Category Name</span>
                  <span className="font-bold text-slate-900">{formData.name || 'N/A'}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="font-bold text-slate-600">URL Slug</span>
                  <span className="font-mono text-slate-900">/categories/{formData.slug || 'N/A'}</span>
                </div>
                <div className="p-3 flex justify-between bg-slate-50/50">
                  <span className="font-bold text-slate-600">Hierarchy Level</span>
                  <span className="font-bold text-slate-900">{formData.parentId ? 'Subcategory (Level 2)' : 'Root (Level 1)'}</span>
                </div>
                {(formData.image || formData.banner) && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Category Image</span>
                    <img src={formData.image || formData.banner} alt="Category" className="w-12 h-8 rounded-lg object-cover border border-slate-200" />
                  </div>
                )}
                {formData.description && (
                  <div className="p-3 flex justify-between bg-slate-50/50">
                    <span className="font-bold text-slate-600">Category Description</span>
                    <span className="text-slate-800 truncate max-w-xs">{formData.description}</span>
                  </div>
                )}
                <div className="p-3 flex justify-between items-center">
                  <span className="font-bold text-slate-600">Status</span>
                  {formData.status === 'DRAFT' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      🟡 Draft
                    </span>
                  ) : formData.status === 'ARCHIVED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      ⚫ Archived
                    </span>
                  ) : formData.status === 'PENDING_REVIEW' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      🔵 Pending Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      🟢 Active
                    </span>
                  )}
                </div>
                <div className="p-3 flex justify-between bg-slate-50/50">
                  <span className="font-bold text-slate-600">SEO Title</span>
                  <span className="text-slate-800 truncate max-w-xs">{formData.seoTitle || 'Default'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Show "Save as Draft" quick shortcut ONLY on steps 1-6 */}
            {currentStep < steps.length && (
              <button
                type="button"
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Save as Draft
              </button>
            )}

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              /* Step 7: Render ONLY the single action button corresponding to the chosen publishing status */
              <>
                {formData.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => handleSave('DRAFT')}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                  >
                    <FileText size={14} /> {isSaving ? 'Saving Draft...' : 'Save as Draft'}
                  </button>
                )}

                {formData.status === 'ARCHIVED' && (
                  <button
                    type="button"
                    onClick={() => handleSave('ARCHIVED')}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 shadow-md shadow-slate-700/20 transition-all cursor-pointer"
                  >
                    <Archive size={14} /> {isSaving ? 'Archiving...' : 'Save as Archived'}
                  </button>
                )}

                {formData.status === 'PENDING_REVIEW' && (
                  <button
                    type="button"
                    onClick={() => handleSave('PENDING_REVIEW')}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Clock size={14} /> {isSaving ? 'Submitting...' : 'Submit for Review'}
                  </button>
                )}

                {(formData.status === 'ACTIVE' || !formData.status) && (
                  <button
                    type="button"
                    onClick={() => handleSave('ACTIVE')}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Check size={14} /> {isSaving ? 'Publishing...' : 'Publish Category'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
