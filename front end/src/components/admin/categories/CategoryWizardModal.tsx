import { useState, useEffect } from 'react';
import { 
  X, Check, ChevronRight, ChevronLeft, Sparkles, AlertCircle, 
  HelpCircle, Upload, Plus, Trash2, Layers, FolderTree, FileText, 
  Settings, Globe, Eye, Calendar, Clock, ShieldCheck
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
}

export default function CategoryWizardModal({
  isOpen,
  onClose,
  onSuccess,
  editCategory,
  categories
}: CategoryWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
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
    faqs: [
      { question: 'What is included in this category?', answer: 'Instant downloadable source files, documentation, and lifetime updates.' },
      { question: 'How do I receive my access?', answer: 'Files are automatically delivered to your Google Drive and account library upon purchase.' }
    ]
  });

  // Populate data when editing
  useEffect(() => {
    if (editCategory) {
      setFormData({
        name: editCategory.name || '',
        categoryCode: editCategory.categoryCode || '',
        slug: editCategory.slug || '',
        shortDescription: editCategory.shortDescription || '',
        description: editCategory.description || '',
        internalNote: editCategory.internalNote || '',
        parentId: editCategory.parentId || '',
        image: editCategory.image || '',
        icon: editCategory.icon || '',
        banner: editCategory.banner || '',
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
        faqs: editCategory.faqs || [
          { question: 'What is included in this category?', answer: 'Instant downloadable source files, documentation, and lifetime updates.' }
        ]
      });
    } else {
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
        faqs: [
          { question: 'What is included in this category?', answer: 'Instant downloadable source files, documentation, and lifetime updates.' },
          { question: 'How do I receive my access?', answer: 'Files are automatically delivered to your Google Drive and account library upon purchase.' }
        ]
      });
    }
    setCurrentStep(1);
  }, [editCategory, isOpen]);

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Basic Info', desc: 'Name, code, slug' },
    { id: 2, title: 'Hierarchy', desc: 'Parent & depth' },
    { id: 3, title: 'Content & Media', desc: 'Descriptions & banners' },
    { id: 4, title: 'Attributes', desc: 'Filterable attributes' },
    { id: 5, title: 'Navigation', desc: 'Storefront links' },
    { id: 6, title: 'SEO & Metadata', desc: 'Meta tags & search' },
    { id: 7, title: 'Visibility', desc: 'Status & scheduling' },
    { id: 8, title: 'Review', desc: 'Quality audit & publish' },
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const url = await uploadImage(file, 'categories', setUploadProgress);
        if (url) {
          setFormData(prev => ({ ...prev, [field]: url }));
          toast.success(`${field === 'banner' ? 'Banner' : 'Thumbnail'} uploaded`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload image');
      }
    }
  };

  const handleAddFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }));
  };

  const handleRemoveFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const handleFaqChange = (index: number, key: 'question' | 'answer', val: string) => {
    setFormData(prev => {
      const updated = [...prev.faqs];
      updated[index][key] = val;
      return { ...prev, faqs: updated };
    });
  };

  const calculateQuality = () => {
    let score = 0;
    if (formData.name && formData.slug) score += 10;
    score += 10; // hierarchy
    if (formData.description && formData.description.length > 20) score += 15;
    else if (formData.shortDescription) score += 8;
    if (formData.banner || formData.image) score += 10;
    score += 15; // product assignment ready
    if (formData.attributeConfig) score += 15;
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

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const payload = {
        ...formData,
        status: forceStatus || formData.status,
        parentId: formData.parentId && formData.parentId !== 'root' ? formData.parentId : null
      };

      if (editCategory) {
        await axios.put(`/api/categories/${editCategory.id}`, payload, { headers });
        toast.success('Category updated successfully');
      } else {
        await axios.post('/api/categories', payload, { headers });
        toast.success('Category created successfully');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
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
                {editCategory ? 'Edit Category' : 'New Category Wizard'}
              </span>
              <span className="text-xs text-slate-400 font-bold">Step {currentStep} of 8</span>
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
          
          {/* STEP 1: BASIC INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Business Templates"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Note</label>
                <textarea
                  rows={2}
                  value={formData.internalNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, internalNote: e.target.value }))}
                  placeholder="Internal governance notes, target audience, or campaign references."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PARENT & HIERARCHY */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parent Hierarchy Position
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Root Category (Top Level 1)</option>
                  {categories
                    .filter(c => !editCategory || c.id !== editCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.parentId ? '(Subcategory)' : '(Root)'}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select whether this is a primary department or a subcategory.
                </p>
              </div>

              {/* Hierarchy Preview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-2">Storefront Breadcrumb Preview:</span>
                <div className="flex items-center gap-2 font-mono text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Home</span>
                  <span>&gt;</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                    {formData.parentId 
                      ? categories.find(c => c.id === formData.parentId)?.name || 'Parent'
                      : formData.name || 'Category'}
                  </span>
                  {formData.parentId && (
                    <>
                      <span>&gt;</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-bold">
                        {formData.name || 'Current'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONTENT & MEDIA */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Long Landing Page Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed category overview shown at the top of category landing pages."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Thumbnail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thumbnail / Icon Image</label>
                  <div className="flex items-center gap-3">
                    {formData.image ? (
                      <img src={formData.image} alt="Thumbnail" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Upload size={16} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'image')}
                      className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Hero Banner */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Hero Banner Image</label>
                  <div className="flex items-center gap-3">
                    {formData.banner ? (
                      <img src={formData.banner} alt="Banner" className="w-20 h-12 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-20 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Upload size={16} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'banner')}
                      className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Buying Guide & FAQs */}
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

              {/* FAQs Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Category FAQs</label>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add FAQ
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.faqs.map((faq, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleFaqChange(i, 'question', e.target.value)}
                          placeholder="Question..."
                          className="w-[90%] text-xs font-bold p-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(i)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(i, 'answer', e.target.value)}
                        placeholder="Answer..."
                        className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ATTRIBUTES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
                Category attributes determine which dynamic filters and specifications are enabled on the storefront sidebar.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(formData.attributeConfig).map(([attrKey, config]: [string, any]) => (
                  <div key={attrKey} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs capitalize text-slate-800">{attrKey} Attribute</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              attributeConfig: {
                                ...prev.attributeConfig,
                                [attrKey]: { ...config, enabled: val }
                              }
                            }));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {config.enabled && (
                      <div className="text-[11px] text-slate-500 space-y-1">
                        <span className="font-semibold block">Supported Filter Values:</span>
                        <div className="flex flex-wrap gap-1">
                          {config.values?.map((v: string) => (
                            <span key={v} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-mono">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: NAVIGATION */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Lower numbers appear first in the header menus.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Explore Category"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
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

          {/* STEP 6: SEO */}
          {currentStep === 6 && (
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

          {/* STEP 7: VISIBILITY & SCHEDULING */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publishing Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['ACTIVE', 'DRAFT', 'PENDING_REVIEW', 'ARCHIVED'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.status === st 
                          ? 'border-primary bg-primary/10 text-primary shadow-xs' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Publication Date (Optional)</label>
                <input
                  type="date"
                  value={formData.publishScheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishScheduledAt: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW & PUBLISH */}
          {currentStep === 8 && (
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
                <div className="p-3 flex justify-between">
                  <span className="font-bold text-slate-600">Status</span>
                  <span className="font-black uppercase text-emerald-700">{formData.status}</span>
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
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Save as Draft
            </button>

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(s => s + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave('ACTIVE')}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Check size={14} /> {isSaving ? 'Publishing...' : 'Publish Category'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
