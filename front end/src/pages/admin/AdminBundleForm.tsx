import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, ArrowLeft, Image as ImageIcon, Search, UploadCloud, 
  Loader2, Plus, Trash2, ArrowUp, ArrowDown, HardDrive, CheckCircle2, 
  AlertTriangle, Package, Layers, Sparkles, X, ChevronRight, ChevronLeft,
  Check, FileText, IndianRupee, ShieldCheck, RefreshCw, Eye, Globe,
  HelpCircle, Settings, Lock, Unlock, AlertCircle, Info, Calendar, Download,
  Archive, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import apiClient from '../../api/apiClient';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';
import { formatCurrency } from '../../utils/currency';

const WIZARD_STEPS = [
  { id: 1, title: 'Basics', icon: Package, desc: 'Title, code & category' },
  { id: 2, title: 'Select Products', icon: Search, desc: 'Add catalog products' },
  { id: 3, title: 'Components', icon: Layers, desc: 'Order & snapshot verify' },
  { id: 4, title: 'Pricing', icon: IndianRupee, desc: 'Prices & discounts' },
  { id: 5, title: 'Delivery', icon: HardDrive, desc: 'Google Drive mode' },
  { id: 6, title: 'Licensing', icon: ShieldCheck, desc: 'Licence & rights' },
  { id: 7, title: 'Updates', icon: RefreshCw, desc: 'Version & policy' },
  { id: 8, title: 'Refunds', icon: HelpCircle, desc: 'Refund rules' },
  { id: 9, title: 'Content', icon: FileText, desc: 'FAQs & requirements' },
  { id: 10, title: 'SEO', icon: Globe, desc: 'Meta tags & schema' },
  { id: 11, title: 'Validation', icon: AlertCircle, desc: '5-Pillar check' },
  { id: 12, title: 'Review', icon: CheckCircle2, desc: 'Publish bundle' }
];

export default function AdminBundleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableLicences, setAvailableLicences] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    bundleCode: '',
    slug: '',
    shortDescription: '',
    description: '',
    bundleType: 'CURATED',
    price: 0,
    originalPrice: 0,
    discount: 0,
    discountPercent: 0,
    currency: 'INR',
    coverImage: '',
    previewImages: [] as string[],
    status: 'ACTIVE',
    featured: false,
    sku: '',
    deliveryMode: 'BOTH', // 'BOTH', 'MULTI_PRODUCT', 'BUNDLE_LINK'
    googleDriveLink: '',
    googleDriveFileId: '',
    categoryId: '',
    tags: '',
    brand: 'KDW Originals',
    pricingPolicy: 'FLAT_DISCOUNT',
    licenceType: 'PERSONAL',
    licenceTerms: '',
    licenceDomains: 1,
    licenceActivations: 1,
    licenceClientProjects: 5,
    licenceRedistribution: false,
    updatePolicy: 'MINOR_INCLUDED',
    currentVersion: '1.0.0',
    refundPolicy: 'FULL_ONLY',
    taxCategory: 'DIGITAL_GOODS_18',
    taxMode: 'INCLUSIVE' as 'INCLUSIVE' | 'EXCLUSIVE' | 'EXEMPT',
    taxRate: '18',
    offerStartAt: '',
    offerEndAt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    ogImage: '',
    faqs: [
      { question: 'What is included in this bundle?', answer: 'You get full instant access to all digital assets listed in this bundle with lifetime updates and commercial licence.' },
      { question: 'How do I access my files after payment?', answer: 'Immediately after verified payment, download links are sent to your account email and permanently stored in your KDW Purchases library.' }
    ] as Array<{ question: string; answer: string }>,
    requirements: [
      { key: 'Software', value: 'Web Browser / Google Drive' },
      { key: 'File Format', value: 'ZIP, Templates, Digital Files' }
    ] as Array<{ key: string; value: string }>,
    productIds: [] as string[]
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLicences();
    if (isEditing) {
      fetchBundle();
    }
  }, [id]);

  const fetchLicences = async () => {
    try {
      const res = await axios.get('/api/products/licences');
      if (res.data.success) {
        setAvailableLicences(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products?limit=1000');
      if (res.data.success) {
        setAllProducts(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBundle = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/bundles/${id}`);
      if (res.data.success) {
        const b = res.data.data;
        const pIds = b.bundleItems?.map((bi: any) => bi.productId) || b.products?.map((p: any) => p.id) || [];
        setFormData({
          title: b.title || '',
          bundleCode: b.bundleCode || '',
          slug: b.slug || '',
          shortDescription: b.shortDescription || '',
          description: b.description || '',
          bundleType: b.bundleType || 'CURATED',
          price: b.price || 0,
          originalPrice: b.originalPrice || 0,
          discount: b.discount || 0,
          discountPercent: b.discountPercent || 0,
          currency: b.currency || 'INR',
          coverImage: b.coverImage || '',
          previewImages: Array.isArray(b.previewImages) ? b.previewImages : [],
          status: b.status || 'ACTIVE',
          featured: b.featured || false,
          sku: b.sku || '',
          deliveryMode: b.deliveryMode || 'BOTH',
          googleDriveLink: b.googleDriveLink || '',
          googleDriveFileId: b.googleDriveFileId || '',
          categoryId: b.categoryId || '',
          tags: b.tags || '',
          brand: b.brand || 'KDW Originals',
          pricingPolicy: b.pricingPolicy || 'FLAT_DISCOUNT',
          licenceType: b.licenceType || 'PERSONAL',
          licenceTerms: b.licenceTerms || '',
          licenceDomains: b.licenceDomains || 1,
          licenceActivations: b.licenceActivations || 1,
          licenceClientProjects: b.licenceClientProjects || 5,
          licenceRedistribution: b.licenceRedistribution || false,
          updatePolicy: b.updatePolicy || 'MINOR_INCLUDED',
          currentVersion: b.currentVersion || '1.0.0',
          refundPolicy: b.refundPolicy || 'FULL_ONLY',
          taxCategory: b.taxCategory || 'DIGITAL_GOODS_18',
          taxMode: (b.taxCategory === 'EXEMPT' || b.taxCategory === '0' ? 'EXEMPT' : (b.taxCategory?.includes('EXCLUSIVE') ? 'EXCLUSIVE' : 'INCLUSIVE')) as any,
          taxRate: (b.taxCategory === 'EXEMPT' || b.taxCategory === '0') ? '0' : (b.taxCategory?.match(/\d+(\.\d+)?/)?.[0] || '18'),
          offerStartAt: b.offerStartAt ? new Date(b.offerStartAt).toISOString().slice(0, 16) : '',
          offerEndAt: b.offerEndAt ? new Date(b.offerEndAt).toISOString().slice(0, 16) : '',
          seoTitle: b.seoTitle || '',
          seoDescription: b.seoDescription || '',
          seoKeywords: b.seoKeywords || '',
          canonicalUrl: b.canonicalUrl || '',
          ogImage: b.ogImage || '',
          faqs: (() => {
            if (!b.faqs) return formData.faqs;
            try {
              const parsed = typeof b.faqs === 'string' ? JSON.parse(b.faqs) : b.faqs;
              return Array.isArray(parsed) && parsed.length > 0 ? parsed : formData.faqs;
            } catch (e) {
              return formData.faqs;
            }
          })(),
          requirements: Array.isArray(b.requirements) && b.requirements.length > 0 ? b.requirements : formData.requirements,
          productIds: pIds
        });
      }
    } catch (error) {
      toast.error('Failed to load bundle details');
      navigate('/admin/bundles');
    } finally {
      setIsLoading(false);
    }
  };

  const checkProductDriveLink = (product: any) => {
    if (!product) return false;
    if (product.googleDriveFileId && product.googleDriveFileId.trim() !== '') return true;
    if (product.googleDriveLinks) {
      try {
        const parsed = typeof product.googleDriveLinks === 'string' ? JSON.parse(product.googleDriveLinks) : product.googleDriveLinks;
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.trim()) return true;
      } catch (e) {}
    }
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'price') {
      const newPrice = parseFloat(value) || 0;
      setFormData(prev => {
        const discountAmt = Math.max(0, prev.originalPrice - newPrice);
        const discountPct = prev.originalPrice > 0 ? Math.round((discountAmt / prev.originalPrice) * 100) : 0;
        return {
          ...prev,
          price: newPrice,
          discount: discountAmt,
          discountPercent: discountPct
        };
      });
    } else if (name === 'originalPrice') {
      const newOriginalPrice = parseFloat(value) || 0;
      setFormData(prev => {
        const discountAmt = Math.max(0, newOriginalPrice - prev.price);
        const discountPct = newOriginalPrice > 0 ? Math.round((discountAmt / newOriginalPrice) * 100) : 0;
        return {
          ...prev,
          originalPrice: newOriginalPrice,
          discount: discountAmt,
          discountPercent: discountPct
        };
      });
    } else if (name === 'title') {
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: prev.slug || value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
        seoTitle: prev.seoTitle || value
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const url = await uploadImage(file, 'bundles', setUploadProgress);
        if (url) {
          setFormData(prev => ({ ...prev, coverImage: url, ogImage: prev.ogImage || url }));
          toast.success('Bundle image uploaded successfully');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Failed to upload image');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Product Selection & Duplicate Prevention
  const handleAddProduct = (productId: string) => {
    if (formData.productIds.includes(productId)) {
      toast.error('This product is already included in this bundle.');
      return;
    }

    const selectedProd = allProducts.find(p => p.id === productId);
    if (selectedProd && (selectedProd.productType === 'BUNDLE' || selectedProd.productType === 'DIGITAL_BUNDLE')) {
      toast.error('Nested bundles are disabled. You cannot nest a bundle inside another bundle.');
      return;
    }

    const newProductIds = [...formData.productIds, productId];
    
    // Auto-calculate original price sum
    let newOriginalPrice = 0;
    newProductIds.forEach(id => {
      const product = allProducts.find(p => p.id === id);
      if (product) newOriginalPrice += product.price || 0;
    });

    const newDiscount = Math.max(0, newOriginalPrice - formData.price);
    const newDiscountPercent = newOriginalPrice > 0 ? Math.round((newDiscount / newOriginalPrice) * 100) : 0;

    setFormData(prev => ({
      ...prev,
      productIds: newProductIds,
      originalPrice: newOriginalPrice,
      discount: newDiscount,
      discountPercent: newDiscountPercent
    }));

    toast.success(`Added "${selectedProd?.name || 'Product'}" to bundle`);
  };

  const handleRemoveProduct = (productId: string) => {
    const newProductIds = formData.productIds.filter(id => id !== productId);

    let newOriginalPrice = 0;
    newProductIds.forEach(id => {
      const product = allProducts.find(p => p.id === id);
      if (product) newOriginalPrice += product.price || 0;
    });

    const newDiscount = Math.max(0, newOriginalPrice - formData.price);
    const newDiscountPercent = newOriginalPrice > 0 ? Math.round((newDiscount / newOriginalPrice) * 100) : 0;

    setFormData(prev => ({
      ...prev,
      productIds: newProductIds,
      originalPrice: newOriginalPrice,
      discount: newDiscount,
      discountPercent: newDiscountPercent
    }));
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.productIds.length) return;

    const newProductIds = [...formData.productIds];
    const temp = newProductIds[index];
    newProductIds[index] = newProductIds[targetIndex];
    newProductIds[targetIndex] = temp;

    setFormData(prev => ({ ...prev, productIds: newProductIds }));
  };

  // Run 5-Pillar Diagnostics Engine
  const runValidation = async () => {
    setIsValidating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const res = await axios.post('/api/bundles/validate', formData, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.data.success) {
        setValidationResult(res.data);
      }
    } catch (error) {
      toast.error('Validation request failed');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (currentStep === 11) {
      runValidation();
    }
  }, [currentStep]);

  // Selected products objects
  const selectedProducts = formData.productIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
  const configuredLinksCount = selectedProducts.filter(p => checkProductDriveLink(p)).length;
  const missingLinksCount = selectedProducts.length - configuredLinksCount;

  // Flexible Step Validation (Only prompts if critical fields are missing when advancing)
  const validateBundleStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!formData.title.trim()) {
        toast.error('Bundle Title is required.');
        return false;
      }
      return true;
    }

    if (stepNum === 2) {
      if (formData.productIds.length === 0) {
        toast.error('Please select at least 1 product for this bundle.');
        return false;
      }
      return true;
    }

    if (stepNum === 4) {
      if (formData.price < 0) {
        toast.error('Price cannot be negative.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleStepClick = (targetStep: number) => {
    setCurrentStep(targetStep);
  };

  const handleContinue = () => {
    if (!validateBundleStep(currentStep)) return;
    setCurrentStep(s => Math.min(12, s + 1));
  };

  const handleSubmit = async (targetStatus?: string) => {
    if (!formData.title.trim()) {
      toast.error('Bundle Title is required');
      setCurrentStep(1);
      return;
    }

    if (formData.productIds.length === 0) {
      toast.error('Please select at least 1 product for this bundle');
      setCurrentStep(2);
      return;
    }

    try {
      setIsLoading(true);
      const effectiveStatus = targetStatus !== undefined ? targetStatus : (formData.status || 'ACTIVE');
      const payload = { 
        ...formData, 
        status: effectiveStatus,
        itemsIncluded: formData.productIds.length 
      };
      
      if (isEditing) {
        await apiClient.put(`/bundles/${id}`, payload);
        toast.success(`Bundle updated successfully (${effectiveStatus})`);
      } else {
        await apiClient.post('/bundles', payload);
        toast.success(`Bundle created successfully (${effectiveStatus})`);
      }
      navigate('/admin/bundles');
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEditing ? 'Failed to update bundle' : 'Failed to create bundle'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveToggle = async (newStatus: 'ARCHIVED' | 'ACTIVE') => {
    if (!id) return;
    try {
      setIsLoading(true);
      const endpoint = newStatus === 'ARCHIVED' ? `/bundles/${id}/archive` : `/bundles/${id}/restore`;
      const res = await apiClient.post(endpoint, {});
      if (res.data?.success) {
        toast.success(res.data.message || `Bundle status updated to ${newStatus}`);
        setFormData(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to update bundle status`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCatalog = allProducts.filter(p => {
    if (formData.productIds.includes(p.id)) return false;
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="w-full space-y-6 pb-20 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/bundles')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-wider block">Bundle Editor</span>
              {isEditing && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  formData.status === 'ARCHIVED'
                    ? 'bg-rose-100 text-rose-700'
                    : formData.status === 'DRAFT'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {formData.status || 'ACTIVE'}
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {isEditing ? `Edit: ${formData.title || 'Bundle'}` : 'Create Multi-Product Bundle'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isEditing && formData.status === 'ARCHIVED' ? (
            <>
              <button
                type="button"
                onClick={() => handleArchiveToggle('ACTIVE')}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={14} />
                <span>Restore to Active</span>
              </button>
              <button 
                type="button"
                onClick={() => handleSubmit()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-md shadow-slate-900/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleArchiveToggle('ARCHIVED')}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
                  title="Archive this bundle"
                >
                  <Archive size={14} />
                  <span>Archive</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Save Draft
              </button>

              <button 
                type="button"
                onClick={() => handleSubmit(isEditing ? formData.status || 'ACTIVE' : 'ACTIVE')}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>{isEditing ? 'Save & Publish' : 'Publish Bundle'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 12-Step Progress Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {WIZARD_STEPS.map((s, idx) => {
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepClick(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : isCompleted 
                    ? 'bg-purple-50 text-primary font-bold hover:bg-purple-100/70' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : isCompleted 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? <Check size={11} /> : s.id}
                </div>
                <div>
                  <span className="font-bold text-[11px] block">{s.title}</span>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <ChevronRight size={12} className="text-slate-300 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Steps Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        {/* STEP 1: BASICS */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 1: Bundle Basics & Classification</h2>
              <p className="text-slate-500 text-[11px]">Define the fundamental naming, unique slug, and categorization for this bundle.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bundle Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  placeholder="e.g. Master Marketing & Agency Starter Bundle"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">URL Slug</label>
                <input 
                  type="text" 
                  name="slug" 
                  value={formData.slug} 
                  onChange={handleChange}
                  placeholder="master-marketing-agency-bundle"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bundle Type</label>
                <select
                  name="bundleType"
                  value={formData.bundleType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900 font-bold"
                >
                  <option value="CURATED">Curated Bundle (Manually Selected Products)</option>
                  <option value="CATEGORY">Category Bundle (All Products in Category)</option>
                  <option value="TIERED">Tiered Bundle (Personal / Commercial / Agency)</option>
                  <option value="BUILD_YOUR_OWN">Build-Your-Own Bundle (Customer Selected)</option>
                  <option value="SUBSCRIPTION">Subscription / Membership Bundle</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bundle Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900 font-bold"
                >
                  <option value="ACTIVE">Active (Live on Storefront)</option>
                  <option value="DRAFT">Draft (Hidden from Storefront)</option>
                  <option value="ARCHIVED">Archived (Deactivated & Hidden)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tags (Comma-separated)</label>
                <input 
                  type="text" 
                  name="tags" 
                  value={formData.tags} 
                  onChange={handleChange}
                  placeholder="marketing, agency, templates, automation"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Short Card Description</label>
              <input 
                type="text" 
                name="shortDescription" 
                value={formData.shortDescription} 
                onChange={handleChange}
                placeholder="Quick 1-line benefit statement for catalog cards..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Bundle Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows={4}
                placeholder="Comprehensive description of what is included..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Cover Thumbnail</label>
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden h-28">
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverImageChange} disabled={isUploading} />
                  {formData.coverImage ? (
                    <>
                      <img src={formData.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="text-white animate-spin" size={24} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-slate-400 group-hover:text-primary transition-colors mb-1" />
                      <p className="text-[11px] text-slate-500 font-bold">Upload Cover Image</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                  />
                  <span className="font-bold text-slate-700">Feature on Marketplace Homepage</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT PRODUCTS */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Step 2: Select Component Products</h2>
                <p className="text-slate-500 text-[11px]">Pick existing catalog products to include in this bundle.</p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-primary border border-purple-200 rounded-full font-bold font-mono">
                Products Included: {formData.productIds.length}
              </span>
            </div>

            {/* Live Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog products by name, SKU, or category..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800"
              />
            </div>

            {/* Catalog Grid Picker */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-80 overflow-y-auto custom-scrollbar">
              {filteredCatalog.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  {allProducts.length === 0 ? 'Loading products...' : 'No matching unselected products found.'}
                </div>
              ) : (
                filteredCatalog.map(p => {
                  const hasDrive = checkProductDriveLink(p);

                  return (
                    <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
                              {p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[280px]">{p.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono font-bold">₹{p.price}</span>
                            <span className="text-[10px] text-primary font-semibold">• {p.category?.name || 'Category'}</span>
                            <span className="text-[10px] text-slate-400">v{p.version || '1.0'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          hasDrive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <HardDrive size={10} /> {hasDrive ? 'Drive ✓' : 'Missing Drive'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAddProduct(p.id)}
                          className="px-3 py-1 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Currently Selected Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Selected: <span className="text-primary font-black font-mono">{formData.productIds.length}</span> Component Products
              </span>
              <span className="text-slate-600 font-bold">
                Combined Value: <span className="text-slate-900 font-black font-mono">₹{formData.originalPrice}</span>
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: COMPONENT ORDERING & TABLE */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 3: Component Ordering & Snapshot Verification</h2>
              <p className="text-slate-500 text-[11px]">Reorder components for display on storefront, download screen, and receipt emails.</p>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                No products selected yet. Go back to Step 2 to add products.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProducts.map((p: any, idx: number) => {
                  const hasDrive = checkProductDriveLink(p);

                  return (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-slate-400 text-xs w-6 text-center">
                          #{idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                              {p.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[280px]">{p.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono font-bold">₹{p.price}</span>
                            <span className="text-[10px] text-slate-400 font-mono">v{p.version || '1.0.0'}</span>
                            <span className="text-[10px] text-primary font-semibold">{p.licenceType || 'Personal'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          hasDrive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <HardDrive size={10} /> {hasDrive ? 'Drive Configured' : 'Missing Link ⚠'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === selectedProducts.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PRICING & DISCOUNTS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 4: Pricing, Discounts &amp; Tax Configuration</h2>
              <p className="text-slate-500 text-[11px]">Configure bundle selling price, manual GST tax rates, and limited-time offer expiration.</p>
            </div>

            {/* Primary Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                  <span>Combined Component Value (₹)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Original Total</span>
                </label>
                <input 
                  type="number" 
                  name="originalPrice" 
                  value={formData.originalPrice} 
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-900 font-mono font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                  <span>Bundle Selling Price (₹) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-emerald-600 font-bold">Customer Pays</span>
                </label>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 text-slate-900 font-mono font-black text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">Customer Savings (₹ &amp; %)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    name="discount" 
                    value={formData.discount} 
                    readOnly
                    className="w-1/2 px-3.5 py-2.5 border border-slate-200 rounded-xl bg-emerald-50 text-emerald-800 font-mono font-bold text-sm"
                  />
                  <span className="font-bold text-emerald-700 font-mono text-xs whitespace-nowrap">
                    ({formData.discountPercent}% OFF)
                  </span>
                </div>
              </div>
            </div>

            {/* MANUAL GST & TAX CONFIGURATION PANEL */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5b21b6] inline-block"></span>
                    Manual GST &amp; Tax Rate Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500">Specify custom GST rate % or choose a standard tax slab.</p>
                </div>
                
                {/* Tax Mode Selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['INCLUSIVE', 'EXCLUSIVE', 'EXEMPT'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          taxMode: mode,
                          taxRate: mode === 'EXEMPT' ? '0' : (prev.taxRate === '0' ? '18' : prev.taxRate),
                          taxCategory: mode === 'EXEMPT' ? 'EXEMPT' : `MANUAL_GST_${prev.taxRate || '18'}_${mode}`
                        }));
                      }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        formData.taxMode === mode
                          ? 'bg-[#5b21b6] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'INCLUSIVE' ? 'GST Inclusive' : mode === 'EXCLUSIVE' ? 'GST Exclusive (+)' : 'Tax Exempt'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Manual Rate Input */}
                <div className="md:col-span-4 space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Manual GST Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      name="taxRate"
                      value={formData.taxRate}
                      disabled={formData.taxMode === 'EXEMPT'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          taxRate: val,
                          taxCategory: prev.taxMode === 'EXEMPT' ? 'EXEMPT' : `MANUAL_GST_${val}_${prev.taxMode}`
                        }));
                      }}
                      placeholder="e.g. 18 or 12"
                      className="w-full pl-3.5 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 disabled:opacity-40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                  </div>
                </div>

                {/* Quick Slabs Presets */}
                <div className="md:col-span-8 space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Standard GST Slabs</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { rate: '0', label: '0% (Exempt)' },
                      { rate: '5', label: '5% GST' },
                      { rate: '12', label: '12% GST' },
                      { rate: '18', label: '18% GST' },
                      { rate: '28', label: '28% GST' }
                    ].map(slab => (
                      <button
                        key={slab.rate}
                        type="button"
                        onClick={() => {
                          const isZero = slab.rate === '0';
                          setFormData(prev => ({
                            ...prev,
                            taxRate: slab.rate,
                            taxMode: isZero ? 'EXEMPT' : (prev.taxMode === 'EXEMPT' ? 'INCLUSIVE' : prev.taxMode),
                            taxCategory: isZero ? 'EXEMPT' : `MANUAL_GST_${slab.rate}_${prev.taxMode === 'EXEMPT' ? 'INCLUSIVE' : prev.taxMode}`
                          }));
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border text-center cursor-pointer ${
                          formData.taxRate === slab.rate && formData.taxMode !== 'EXEMPT'
                            ? 'bg-[#5b21b6] text-white border-[#5b21b6] shadow-xs'
                            : slab.rate === '0' && formData.taxMode === 'EXEMPT'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {slab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Breakdown Calculation Box */}
              {(() => {
                const rateNum = formData.taxMode === 'EXEMPT' ? 0 : parseFloat(formData.taxRate) || 0;
                const P = parseFloat(String(formData.price)) || 0;
                let basePrice = P;
                let gstAmt = 0;
                let totalPayable = P;

                if (formData.taxMode === 'INCLUSIVE' && rateNum > 0) {
                  basePrice = Math.round((P / (1 + rateNum / 100)) * 100) / 100;
                  gstAmt = Math.round((P - basePrice) * 100) / 100;
                  totalPayable = P;
                } else if (formData.taxMode === 'EXCLUSIVE' && rateNum > 0) {
                  basePrice = P;
                  gstAmt = Math.round((P * (rateNum / 100)) * 100) / 100;
                  totalPayable = Math.round((P + gstAmt) * 100) / 100;
                }

                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Base Net Price</span>
                      <span className="font-bold text-slate-800">₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">GST ({rateNum}%)</span>
                      <span className="font-bold text-purple-700">₹{gstAmt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Final Price</span>
                      <span className="font-black text-slate-900">₹{totalPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SPECIAL OFFER & LIMITED TIME DEAL CONFIGURATION */}
            <div className="p-5 bg-gradient-to-r from-purple-50/50 via-slate-50 to-indigo-50/50 border border-purple-100 rounded-2xl space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-purple-600">⚡</span>
                  Limited-Time Special Deal &amp; Auto-Expiry Rule
                </h3>
                <p className="text-[11px] text-slate-500">
                  When an end date/time is configured, this bundle displays a live countdown timer on the storefront. When the deadline passes, the deal automatically expires, discount resets to 0%, and the price returns to full.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Special Offer Start Date &amp; Time</label>
                  <input 
                    type="datetime-local" 
                    name="offerStartAt" 
                    value={formData.offerStartAt} 
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-[#5b21b6]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
                    <span>Special Offer End Date &amp; Time <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-purple-600 font-bold">Auto-Zero Discount at Expiry</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    name="offerEndAt" 
                    value={formData.offerEndAt} 
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-purple-200 rounded-xl bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DELIVERY CONFIGURATION */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 5: Google Drive Delivery Architecture</h2>
              <p className="text-slate-500 text-[11px]">Configure how purchased assets are fulfilled and delivered to customers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
                formData.deliveryMode === 'BOTH' ? 'border-primary bg-primary/5 shadow-xs' : 'border-slate-200 bg-slate-50'
              }`}>
                <input 
                  type="radio" 
                  name="deliveryMode" 
                  value="BOTH" 
                  checked={formData.deliveryMode === 'BOTH'} 
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="font-bold text-slate-900 block">Option 3: Both (Recommended)</span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Deliver complete master ZIP file AND individual product download links.
                </span>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
                formData.deliveryMode === 'MULTI_PRODUCT' ? 'border-primary bg-primary/5 shadow-xs' : 'border-slate-200 bg-slate-50'
              }`}>
                <input 
                  type="radio" 
                  name="deliveryMode" 
                  value="MULTI_PRODUCT" 
                  checked={formData.deliveryMode === 'MULTI_PRODUCT'} 
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="font-bold text-slate-900 block">Option 2: Individual Products Only</span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Deliver separate links for each component product.
                </span>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
                formData.deliveryMode === 'BUNDLE_LINK' ? 'border-primary bg-primary/5 shadow-xs' : 'border-slate-200 bg-slate-50'
              }`}>
                <input 
                  type="radio" 
                  name="deliveryMode" 
                  value="BUNDLE_LINK" 
                  checked={formData.deliveryMode === 'BUNDLE_LINK'} 
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="font-bold text-slate-900 block">Option 1: Complete Bundle ZIP Only</span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Deliver one master Google Drive folder/ZIP link.
                </span>
              </label>
            </div>

            {(formData.deliveryMode === 'BUNDLE_LINK' || formData.deliveryMode === 'BOTH') && (
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                <label className="font-bold text-indigo-950 block">Master Bundle Google Drive File / Folder URL</label>
                <input 
                  type="url" 
                  name="googleDriveLink" 
                  value={formData.googleDriveLink} 
                  onChange={handleChange}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2 bg-white border border-indigo-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Delivery Health summary */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              configuredLinksCount === selectedProducts.length && selectedProducts.length > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                <HardDrive size={16} />
                <span className="font-bold">
                  Component Files Status: {configuredLinksCount} of {selectedProducts.length} Products Verified
                </span>
              </div>
              <span className="font-mono font-bold">
                {missingLinksCount > 0 ? `⚠ ${missingLinksCount} Missing` : '✓ Ready'}
              </span>
            </div>
          </div>
        )}

        {/* STEP 6: LICENSING */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 6: Unified Licensing & Rights</h2>
              <p className="text-slate-500 text-[11px]">Define usage permissions for buyers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bundle Licence Tier</label>
                <select
                  name="licenceType"
                  value={formData.licenceType}
                  onChange={(e) => {
                    const val = e.target.value;
                    const match = availableLicences.find(l => l.name === val || l.slug === val || l.name?.toUpperCase() === val?.toUpperCase());
                    setFormData(prev => ({
                      ...prev,
                      licenceType: val,
                      ...(match?.domainLimit ? { licenceDomains: match.domainLimit } : {}),
                      ...(match?.activationLimit ? { licenceActivations: match.activationLimit } : {}),
                      ...(match?.terms && !prev.licenceTerms ? { licenceTerms: match.terms } : {})
                    }));
                  }}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-bold"
                >
                  {availableLicences.length > 0 ? (
                    availableLicences.map(l => (
                      <option key={l.id} value={l.name}>{l.name} {l.isDefault ? '(Default)' : ''}</option>
                    ))
                  ) : (
                    <>
                      <option value="Personal Licence">Personal Licence (Single End Project)</option>
                      <option value="Commercial Licence">Commercial Licence (Unlimited Commercial Projects)</option>
                      <option value="Agency Licence">Agency / Team Licence (Unlimited Team & Client Work)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Domain Activations Limit</label>
                <input 
                  type="number" 
                  name="licenceDomains" 
                  value={formData.licenceDomains} 
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Client Projects Limit</label>
                <input 
                  type="number" 
                  name="licenceClientProjects" 
                  value={formData.licenceClientProjects} 
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Custom Licence Terms / Exclusions</label>
              <textarea 
                name="licenceTerms" 
                value={formData.licenceTerms} 
                onChange={handleChange}
                rows={3}
                placeholder="Specify specific licence restrictions, attribution guidelines, or resale prohibitions..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* STEP 7: UPDATES & VERSIONS */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 7: Version Releases & Update Policies</h2>
              <p className="text-slate-500 text-[11px]">Define current release version and update entitlement policy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Initial Release Version</label>
                <input 
                  type="text" 
                  name="currentVersion" 
                  value={formData.currentVersion} 
                  onChange={handleChange}
                  placeholder="1.0.0"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Update Policy</label>
                <select
                  name="updatePolicy"
                  value={formData.updatePolicy}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-bold"
                >
                  <option value="MINOR_INCLUDED">Minor Updates Included (Recommended)</option>
                  <option value="LIFETIME">Lifetime Free Updates</option>
                  <option value="TIME_LIMITED">Time-Limited Updates (1 Year)</option>
                  <option value="FIXED">Fixed Version (No Future Updates)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: REFUNDS */}
        {currentStep === 8 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 8: Refund Policies & Threshold Rules</h2>
              <p className="text-slate-500 text-[11px]">Configure refund evaluation rules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`p-4 rounded-xl border cursor-pointer ${
                formData.refundPolicy === 'FULL_ONLY' ? 'border-primary bg-primary/5 shadow-xs' : 'border-slate-200 bg-slate-50'
              }`}>
                <input type="radio" name="refundPolicy" value="FULL_ONLY" checked={formData.refundPolicy === 'FULL_ONLY'} onChange={handleChange} className="sr-only" />
                <span className="font-bold text-slate-900 block">Full Bundle Refund Only</span>
                <span className="text-[11px] text-slate-500 block mt-1">Refund applies to the entire bundle; revokes all entitlements.</span>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer ${
                formData.refundPolicy === 'DOWNLOAD_MANUAL_REVIEW' ? 'border-primary bg-primary/5 shadow-xs' : 'border-slate-200 bg-slate-50'
              }`}>
                <input type="radio" name="refundPolicy" value="DOWNLOAD_MANUAL_REVIEW" checked={formData.refundPolicy === 'DOWNLOAD_MANUAL_REVIEW'} onChange={handleChange} className="sr-only" />
                <span className="font-bold text-slate-900 block">Manual Review After Download</span>
                <span className="text-[11px] text-slate-500 block mt-1">If files were downloaded, support staff reviews claim before processing.</span>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer ${
                formData.refundPolicy === 'NO_REFUND_AFTER_DOWNLOAD' ? 'border-primary bg-primary/5 shadow-xs' : 'border-slate-200 bg-slate-50'
              }`}>
                <input type="radio" name="refundPolicy" value="NO_REFUND_AFTER_DOWNLOAD" checked={formData.refundPolicy === 'NO_REFUND_AFTER_DOWNLOAD'} onChange={handleChange} className="sr-only" />
                <span className="font-bold text-slate-900 block">No Refund After Download</span>
                <span className="text-[11px] text-slate-500 block mt-1">Strict digital goods policy; downloads permanently lock sale.</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 9: CONTENT & FAQS */}
        {currentStep === 9 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 9: Storefront Content, FAQs & Requirements</h2>
              <p className="text-slate-500 text-[11px]">Buyer FAQs and requirements.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Frequently Asked Questions (FAQs)</span>
                  <span className="text-[11px] text-slate-400">These will be rendered as an interactive FAQ accordion on the storefront bundle page.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      faqs: [...prev.faqs, { question: '', answer: '' }]
                    }));
                  }}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add FAQ</span>
                </button>
              </div>

              {formData.faqs.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                  <p className="text-slate-500 font-medium text-xs">No custom FAQs added for this bundle yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        faqs: [{ question: '', answer: '' }]
                      }));
                    }}
                    className="px-3 py-1.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-dark cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> Add First FAQ
                  </button>
                </div>
              ) : (
                formData.faqs.map((faq, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">Q{idx + 1}</span>
                        <input 
                          type="text" 
                          value={faq.question} 
                          onChange={(e) => {
                            const newFaqs = [...formData.faqs];
                            newFaqs[idx].question = e.target.value;
                            setFormData(prev => ({ ...prev, faqs: newFaqs }));
                          }}
                          placeholder="What is included in this bundle?"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newFaqs = formData.faqs.filter((_, i) => i !== idx);
                          setFormData(prev => ({ ...prev, faqs: newFaqs }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete FAQ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <textarea 
                      value={faq.answer} 
                      onChange={(e) => {
                        const newFaqs = [...formData.faqs];
                        newFaqs[idx].answer = e.target.value;
                        setFormData(prev => ({ ...prev, faqs: newFaqs }));
                      }}
                      rows={2}
                      placeholder="Enter detailed answer shown when the question is expanded..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs leading-relaxed"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 10: SEO & SCHEMA */}
        {currentStep === 10 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 10: SEO Meta & Structured Data</h2>
              <p className="text-slate-500 text-[11px]">Search engine indexing and social media preview tags.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">SEO Meta Title</label>
                <input 
                  type="text" 
                  name="seoTitle" 
                  value={formData.seoTitle} 
                  onChange={handleChange}
                  placeholder={formData.title}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Canonical URL</label>
                <input 
                  type="text" 
                  name="canonicalUrl" 
                  value={formData.canonicalUrl} 
                  onChange={handleChange}
                  placeholder={`/bundles/${formData.slug}`}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">SEO Meta Description</label>
              <textarea 
                name="seoDescription" 
                value={formData.seoDescription} 
                onChange={handleChange}
                rows={3}
                placeholder="High-converting search snippet description..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* STEP 11: 5-PILLAR AUTOMATED VALIDATION */}
        {currentStep === 11 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Step 11: 5-Pillar Automated Validation Diagnostics</h2>
                <p className="text-slate-500 text-[11px]">System evaluates Content, Commercials, Google Drive Delivery, Licensing, and SEO readiness.</p>
              </div>

              <button
                type="button"
                onClick={runValidation}
                disabled={isValidating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold cursor-pointer"
              >
                <RefreshCw size={13} className={isValidating ? 'animate-spin' : ''} />
                <span>Re-run Diagnostics</span>
              </button>
            </div>

            {isValidating ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="animate-spin inline mr-2 text-primary" size={20} />
                Evaluating 5 validation pillars across catalog records...
              </div>
            ) : validationResult ? (
              <div className="space-y-4">
                {/* Result Overview Header */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  validationResult.isValid 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center gap-3">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="text-emerald-600" size={24} />
                    ) : (
                      <AlertCircle className="text-rose-600" size={24} />
                    )}
                    <div>
                      <span className="font-black text-sm block">
                        {validationResult.isValid ? '✓ All Core Validation Checks Passed' : '❌ Issues Detected in Validation'}
                      </span>
                      <span className="text-[11px] opacity-80">
                        {validationResult.errorsCount} error(s), {validationResult.warningsCount} warning(s) detected.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Errors List */}
                {validationResult.errors?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-rose-700 text-xs block uppercase">Errors:</span>
                    {validationResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800">
                        <X size={14} className="text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold">[{err.pillar}]</span> {err.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings List */}
                {validationResult.warnings?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-amber-700 text-xs block uppercase">Notices & Warnings:</span>
                    {validationResult.warnings.map((warn: any, idx: number) => (
                      <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold">[{warn.pillar}]</span> {warn.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 12: REVIEW & PUBLISH */}
        {currentStep === 12 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Step 12: Final Review & Storefront Publishing</h2>
              <p className="text-slate-500 text-[11px]">Inspect complete bundle details before making it live for marketplace customers.</p>
            </div>

            <div className="p-5 bg-sky-50 border border-sky-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider block">
                    {formData.bundleType} • {formData.productIds.length} PRODUCTS INCLUDED
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{formData.title || 'Untitled Bundle'}</h3>
                  <span className="text-xs font-mono text-sky-700 font-medium">/{formData.slug}</span>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-emerald-700 font-mono block">₹{formData.price}</span>
                  <span className="text-xs text-slate-400 line-through font-mono">₹{formData.originalPrice}</span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">SAVE ₹{formData.discount} ({formData.discountPercent}%)</span>
                </div>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed border-t border-sky-200/60 pt-3">
                {formData.shortDescription || formData.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-200/60 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Licence:</span>
                  <span className="font-bold text-slate-900 capitalize">{formData.licenceType ? formData.licenceType.toLowerCase().replace(/_/g, ' ') : 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Delivery:</span>
                  <span className="font-bold text-slate-900 capitalize">{formData.deliveryMode ? formData.deliveryMode.toLowerCase().replace(/_/g, ' ') : 'Multi Product'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Version:</span>
                  <span className="font-bold text-slate-900">v{formData.currentVersion}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Refunds:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {formData.refundPolicy === 'NO_REFUND_AFTER_DOWNLOAD'
                      ? 'No Refund After Download'
                      : formData.refundPolicy === 'DOWNLOAD_MANUAL_REVIEW'
                      ? 'Manual Review After Download'
                      : formData.refundPolicy === 'FULL_ONLY'
                      ? 'Full Refund Only'
                      : formData.refundPolicy?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 12 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="flex items-center gap-1 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-md shadow-primary/25 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit('ACTIVE')}
                disabled={isLoading}
                className="flex items-center gap-1 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                <span>Publish to Storefront</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
