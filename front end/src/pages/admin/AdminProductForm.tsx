import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Save, UploadCloud, Image as ImageIcon, 
  CheckCircle, Tag, IndianRupee, Layers, FileText, HelpCircle, 
  ShieldCheck, Loader2, AlertCircle, HardDrive, CheckCircle2, 
  Cpu, Sparkles, Video, Globe, FileCode, Lock, Key, Calendar,
  RefreshCw, Check, X, Sliders, ExternalLink, ShieldAlert, Plus, Trash2, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';
import { formatCurrency } from '../../utils/currency';
import axios from 'axios';

// 10 EXACT STAGES
const STEPS = [
  { id: 'drive', title: 'Google Drive Delivery', stepNum: 1 },
  { id: 'basic', title: 'Basic Information', stepNum: 2 },
  { id: 'organization', title: 'Organization', stepNum: 3 },
  { id: 'pricing', title: 'Pricing', stepNum: 4 },
  { id: 'media', title: 'Media & Preview', stepNum: 5 },
  { id: 'access', title: 'Access & Download', stepNum: 6 },
  { id: 'licence', title: 'Licence', stepNum: 7 },
  { id: 'content', title: 'Content & FAQs', stepNum: 8 },
  { id: 'seo', title: 'SEO & Social', stepNum: 9 },
  { id: 'review', title: 'Review & Publish', stepNum: 10 }
];

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableLicences, setAvailableLicences] = useState<any[]>([]);

  // STEP 1: GOOGLE DRIVE DELIVERY
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [driveFileId, setDriveFileId] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  const [driveFileSize, setDriveFileSize] = useState('');
  const [driveMimeType, setDriveMimeType] = useState('application/zip');
  const [driveModifiedAt, setDriveModifiedAt] = useState('');
  const [driveAccessStatus, setDriveAccessStatus] = useState<'CONNECTED' | 'NOT_CONNECTED' | 'PERMISSION_DENIED'>('NOT_CONNECTED');
  const [driveValidationStatus, setDriveValidationStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');
  const [isValidatingDrive, setIsValidatingDrive] = useState(false);
  const [driveErrorMessage, setDriveErrorMessage] = useState('');

  // Customer Delivery settings
  const [sendEmailOnPayment, setSendEmailOnPayment] = useState(true);
  const [showInMyPurchases, setShowInMyPurchases] = useState(true);
  const [requireCustomerLogin, setRequireCustomerLogin] = useState(true);

  // STEP 2: BASIC INFORMATION
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('KDW');
  const [productType, setProductType] = useState('DOWNLOADABLE_FILE');

  // STEP 3: ORGANIZATION
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([
    { key: 'Format', value: 'Canva / ZIP' },
    { key: 'Language', value: 'English' },
    { key: 'Skill Level', value: 'All Levels' }
  ]);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // STEP 4: PRICING
  const [price, setPrice] = useState('999');
  const [discountPrice, setDiscountPrice] = useState('499');
  const [compareAtPrice, setCompareAtPrice] = useState('1499');
  const [costPrice, setCostPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [taxMode, setTaxMode] = useState('INCLUSIVE');
  const [taxRate, setTaxRate] = useState('18');
  const [offerStartAt, setOfferStartAt] = useState('');
  const [offerEndAt, setOfferEndAt] = useState('');

  // STEP 5: MEDIA & PREVIEW
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [sampleZipUrl, setSampleZipUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // STEP 6: ACCESS & DOWNLOAD
  const [downloadLimit, setDownloadLimit] = useState('5');
  const [accessDurationDays, setAccessDurationDays] = useState('365');
  const [tokenDurationMinutes, setTokenDurationMinutes] = useState('60');
  const [guestAccessAllowed, setGuestAccessAllowed] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState('REVOKE_ACCESS');
  const [updateEligibility, setUpdateEligibility] = useState('ALL_PURCHASERS');
  const [version, setVersion] = useState('v1.0.0');

  // STEP 7: LICENCE
  const [licenceType, setLicenceType] = useState('COMMERCIAL');
  const [licenceKeyRequired, setLicenceKeyRequired] = useState(false);
  const [activationLimit, setActivationLimit] = useState('1');
  const [domainLimit, setDomainLimit] = useState('1');
  const [deviceLimit, setDeviceLimit] = useState('3');
  const [licenceTerms, setLicenceTerms] = useState(
    'Permitted for commercial client projects. Source file resale or distribution is strictly prohibited.'
  );

  // STEP 8: CONTENT & FAQS & REQUIREMENTS
  const [heroHighlight, setHeroHighlight] = useState('Instant Digital Access & Premium Commercial Assets');
  const [whatsIncluded, setWhatsIncluded] = useState(
    '500+ Fully Customizable Templates\\nStep-by-Step Video Setup Walkthrough\\nLifetime Version Updates\\nCommercial Usage Licence'
  );
  const [requirements, setRequirements] = useState('Free Canva or Google Account, Modern Web Browser');
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    { question: 'How do I receive my product after purchase?', answer: 'Immediately upon verified payment, a secure access link is sent to your registered login email, and the product is instantly accessible in your My Purchases tab.' },
    { question: 'What is the licence policy?', answer: 'This product includes a Commercial Licence allowing you to create client deliverables. Raw source files cannot be redistributed.' }
  ]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // STEP 9: SEO & SOCIAL PREVIEW
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');

  // Status
  const [productStatus, setProductStatus] = useState('DRAFT');

  // Load Categories & Licences
  useEffect(() => {
    const loadInit = async () => {
      try {
        const [catRes, tagRes, licRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/products/tags'),
          axios.get('/api/products/licences')
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (tagRes.data.success) setAvailableTags(tagRes.data.data);
        if (licRes.data.success) setAvailableLicences(licRes.data.data);
      } catch (err) {}
    };
    loadInit();
  }, []);

  // Load product if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadProduct = async () => {
        try {
          const res = await axios.get(`/api/products/${id}`);
          if (res.data.success) {
            const p = res.data.data;
            setProductType(p.productType || 'DOWNLOADABLE_FILE');
            setName(p.name || p.title || '');
            setSlug(p.slug || '');
            setIsSlugEdited(true);
            setProductCode(p.productCode || '');
            setShortDescription(p.shortDescription || '');
            setDescription(p.description || '');
            setBrand(p.brand || 'KDW');
            setCategory(p.category || '');
            setSubcategory(p.subcategory || '');
            setPrice(p.price ? p.price.toString() : '0');
            setDiscountPrice(p.discountPrice !== null && p.discountPrice !== undefined ? p.discountPrice.toString() : '');
            setCompareAtPrice(p.compareAtPrice ? p.compareAtPrice.toString() : '');
            setCostPrice(p.costPrice ? p.costPrice.toString() : '');
            setCoverImage(p.thumbnail || p.coverImage || '');
            
            // Drive
            const driveId = p.googleDriveFileId || '';
            setDriveFileId(driveId);
            setGoogleDriveUrl(driveId ? `https://drive.google.com/file/d/${driveId}/view` : '');
            setDriveFileName(p.driveFileName || '');
            setDriveFileSize(p.driveFileSize || '');
            setDriveMimeType(p.driveMimeType || 'application/zip');
            if (driveId) {
              setDriveValidationStatus('VALID');
              setDriveAccessStatus('CONNECTED');
            }

            // Access
            setDownloadLimit(p.downloadLimit ? p.downloadLimit.toString() : '5');
            setAccessDurationDays(p.accessDurationDays ? p.accessDurationDays.toString() : '365');
            setVersion(p.version || 'v1.0.0');

            // Licence
            setLicenceType(p.licenceType || 'COMMERCIAL');
            setLicenceTerms(p.licenceTerms || '');
            setActivationLimit(p.activationLimit ? p.activationLimit.toString() : '1');
            setDomainLimit(p.domainLimit ? p.domainLimit.toString() : '1');

            // SEO & Status
            setSeoTitle(p.seoTitle || '');
            setSeoDescription(p.seoDescription || '');
            setSeoKeywords(p.seoKeywords || '');
            setProductStatus(p.status || 'DRAFT');
            setIsFeatured(Boolean(p.featured));
            setIsBestSeller(Boolean(p.bestSeller));
            setWhatsIncluded(p.features || '');
          }
        } catch (err) {
          toast.error('Failed to load product');
        }
      };
      loadProduct();
    }
  }, [id, isEditing]);

  // Handle Name Change with Auto-Slug
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugEdited) {
      const generated = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
    if (!seoTitle) setSeoTitle(`${val} | KDW Digital Store`);
  };

  // Upload Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploadingCover(true);
        const url = await uploadImage(e.target.files[0], 'products');
        if (url) {
          setCoverImage(url);
          toast.success('Cover image uploaded');
        }
      } catch (err: any) {
        toast.error(err.message || 'Image upload failed');
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  // Validate Google Drive Link via Server-Side API
  const handleValidateDriveLink = async () => {
    if (!googleDriveUrl.trim() && !driveFileId.trim()) {
      toast.error('Please enter a Google Drive link or File ID');
      return;
    }

    try {
      setIsValidatingDrive(true);
      setDriveErrorMessage('');

      const res = await axios.post('/api/products/drive/validate', {
        driveUrl: googleDriveUrl.trim(),
        driveFileId: driveFileId.trim(),
        fileName: name ? `${name.replace(/[^a-zA-Z0-9]/g, '_')}.zip` : undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success && res.data.valid) {
        const d = res.data.data;
        setDriveFileId(d.driveFileId);
        setGoogleDriveUrl(d.driveUrl);
        setDriveFileName(d.fileName);
        setDriveMimeType(d.mimeType);
        setDriveFileSize(d.fileSize);
        setDriveModifiedAt(d.modifiedAt);
        setDriveAccessStatus('CONNECTED');
        setDriveValidationStatus('VALID');
        toast.success('✓ Google Drive file validated & verified accessible!');
      }
    } catch (err: any) {
      setDriveValidationStatus('INVALID');
      setDriveAccessStatus('NOT_CONNECTED');
      const msg = err.response?.data?.message || 'Google Drive validation failed. File is unavailable or invalid link.';
      setDriveErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsValidatingDrive(false);
    }
  };

  // Add/Remove FAQ
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) {
      toast.error('Question and Answer are required');
      return;
    }
    setFaqs([...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  // Add/Remove Attribute
  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return;
    setAttributes([...attributes, { key: newAttrKey.trim(), value: newAttrVal.trim() }]);
    setNewAttrKey('');
    setNewAttrVal('');
  };

  // Completeness score
  const calculateCompleteness = () => {
    let score = 0;
    if (driveFileId && driveValidationStatus === 'VALID') score += 25;
    if (name && slug && description) score += 20;
    if (category) score += 15;
    if (price && parseFloat(price) >= 0) score += 15;
    if (coverImage) score += 15;
    if (licenceType) score += 5;
    if (seoTitle || seoDescription) score += 5;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  // Mandatory validation function per stage
  const validateProductStage = (stageIdx: number): boolean => {
    if (stageIdx === 0) {
      if (!googleDriveUrl.trim() && !driveFileId.trim()) {
        toast.error('Google Drive Product URL or File ID is mandatory to advance.');
        return false;
      }
      return true;
    }

    if (stageIdx === 1) {
      if (!name.trim()) {
        toast.error('Product Name is mandatory.');
        return false;
      }
      if (!slug.trim()) {
        toast.error('URL Slug is mandatory.');
        return false;
      }
      if (!shortDescription.trim()) {
        toast.error('Short Description is mandatory.');
        return false;
      }
      if (!description.trim()) {
        toast.error('Full Product Description is mandatory.');
        return false;
      }
      return true;
    }

    if (stageIdx === 2) {
      if (!category.trim()) {
        toast.error('Product Category is mandatory.');
        return false;
      }
      return true;
    }

    if (stageIdx === 3) {
      if (!price || parseFloat(price) <= 0) {
        toast.error('Regular Price is mandatory and must be greater than ₹0.');
        return false;
      }
      return true;
    }

    if (stageIdx === 4) {
      if (!coverImage.trim()) {
        toast.error('Cover Thumbnail Image is mandatory to advance.');
        return false;
      }
      return true;
    }

    if (stageIdx === 5) {
      if (!downloadLimit) {
        toast.error('Download limit is mandatory.');
        return false;
      }
      return true;
    }

    if (stageIdx === 6) {
      if (!licenceType.trim()) {
        toast.error('Licence Type is mandatory.');
        return false;
      }
      return true;
    }

    if (stageIdx === 7) {
      if (!heroHighlight.trim() && (!faqs || faqs.length === 0 || !faqs[0]?.question.trim())) {
        toast.error('Hero Highlights or at least 1 FAQ is mandatory.');
        return false;
      }
      return true;
    }

    if (stageIdx === 8) {
      if (!seoTitle.trim()) {
        toast.error('SEO Meta Title is mandatory.');
        return false;
      }
      if (!seoDescription.trim()) {
        toast.error('SEO Meta Description is mandatory.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleStepClick = (targetIndex: number) => {
    setCurrentStepIndex(targetIndex);
  };

  const handleNext = () => {
    setCurrentStepIndex(Math.min(STEPS.length - 1, currentStepIndex + 1));
  };

  // Save / Publish Product Handler
  const handleSaveProduct = async (desiredStatus: string = 'DRAFT') => {
    if (!name.trim()) {
      toast.error('Product Name is required');
      setCurrentStepIndex(1);
      return;
    }

    if (desiredStatus === 'PUBLISHED') {
      if (!price || parseFloat(price) <= 0) {
        toast.error('Valid selling price is required before publishing');
        setCurrentStepIndex(3);
        return;
      }
    }

    try {
      setIsSaving(true);

      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        productType,
        brand,
        category,
        subcategory: subcategory || null,
        tags: selectedTags,
        attributes,
        price: parseFloat(price) || 0,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        currency,
        taxMode,
        taxRate: parseFloat(taxRate) || 18,
        offerStartAt: offerStartAt || null,
        offerEndAt: offerEndAt || null,
        shortDescription,
        description,
        thumbnail: coverImage || null,
        coverImage: coverImage || null,
        previewImages: galleryImages,
        previewPdfUrl,
        sampleZipUrl,
        demoUrl,
        googleDriveFileId: driveFileId || null,
        driveFileName,
        driveFileSize,
        driveMimeType,
        driveAccessStatus: driveFileId ? 'CONNECTED' : 'NOT_CONNECTED',
        downloadLimit: downloadLimit === 'Unlimited' ? 999999 : parseInt(downloadLimit) || 5,
        accessDurationDays: accessDurationDays === 'Never' ? 999999 : parseInt(accessDurationDays) || 365,
        tokenDurationMinutes: parseInt(tokenDurationMinutes) || 60,
        refundPolicy,
        version,
        licenceType,
        licenceKeyRequired,
        activationLimit: parseInt(activationLimit) || 1,
        domainLimit: parseInt(domainLimit) || 1,
        deviceLimit: parseInt(deviceLimit) || 3,
        licenceTerms,
        heroHighlight,
        whatsIncluded,
        requirements,
        faqs,
        seoTitle: seoTitle || name,
        seoDescription: seoDescription || shortDescription,
        seoKeywords,
        canonicalUrl,
        status: desiredStatus,
        isFeatured,
        isBestSeller
      };

      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

      if (isEditing && id) {
        const res = await axios.put(`/api/products/${id}`, payload, { headers });
        if (res.data.success) {
          if (desiredStatus === 'PUBLISHED') {
            await axios.post(`/api/products/${id}/publish`, {}, { headers });
            toast.success('Product published successfully!');
          } else {
            toast.success('Product updated successfully!');
          }
          navigate('/admin/products');
        }
      } else {
        const res = await axios.post('/api/products', payload, { headers });
        if (res.data.success) {
          const newId = res.data.data.id;
          if (desiredStatus === 'PUBLISHED') {
            await axios.post(`/api/products/${newId}/publish`, {}, { headers });
            toast.success('Product created & published successfully!');
          } else {
            toast.success('Product draft saved successfully!');
          }
          navigate('/admin/products');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const discountPercent = (price && discountPrice && parseFloat(discountPrice) < parseFloat(price))
    ? Math.round(((parseFloat(price) - parseFloat(discountPrice)) / parseFloat(price)) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20 font-sans max-w-6xl mx-auto">
      {/* 1. Header with Breadcrumb & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Products
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Digital Product' : 'Add New Digital Product'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure secure Google Drive delivery, metadata, pricing, licence, and storefront presentation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveProduct('DRAFT')}
            disabled={isSaving}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Save size={15} /> Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveProduct('PUBLISHED')}
            disabled={isSaving || completeness < 70}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 size={15} /> Publish Live
          </button>
        </div>
      </div>

      {/* 2. Horizontal 10-Step Progress Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Stage {currentStepIndex + 1} of {STEPS.length}: <span className="text-primary font-black">{STEPS[currentStepIndex].title}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Completeness Score:</span>
            <span className={`font-black ${completeness >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {completeness}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Stepper Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 custom-scrollbar">
          {STEPS.map((s, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepClick(idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurrent 
                    ? 'bg-primary text-white shadow-xs' 
                    : isDone 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {isDone ? <Check size={12} /> : <span className="font-mono text-[10px] opacity-75">{s.stepNum}</span>}
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Two-Column Layout: Form Step + Right-Hand Product Journey Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Current Step Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs min-h-[460px] flex flex-col justify-between">
          
          {/* STEP 1: GOOGLE DRIVE DELIVERY (EXCLUSIVELY STEP 1) */}
          {currentStepIndex === 0 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <HardDrive size={14} /> Stage 1: Google Drive Delivery
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Google Drive Product File Connection
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Google Drive is the sole storage engine for KDW digital delivery. Enter the Google Drive link or file ID.
                </p>
              </div>

              {/* Secure Delivery Callout */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-relaxed">
                  <strong>Zero-Exposure Security Architecture:</strong> Raw Google Drive URLs are never exposed to customers. The backend generates temporary signed streaming tokens and verifies payment status before granting access.
                </div>
              </div>

              {/* Google Drive Link Input & Validation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Google Drive Product Link <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={googleDriveUrl}
                    onChange={(e) => {
                      setGoogleDriveUrl(e.target.value);
                      setDriveValidationStatus('IDLE');
                      setDriveErrorMessage('');
                    }}
                    placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleValidateDriveLink}
                    disabled={isValidatingDrive || !googleDriveUrl.trim()}
                    className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                  >
                    {isValidatingDrive ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    Validate Link
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepts Google Drive share URLs, direct download URLs, or raw Drive File IDs.
                </p>
              </div>

              {/* Validation Status Feedback Card */}
              {driveValidationStatus === 'VALID' && (
                <div className="p-5 bg-slate-50 border border-emerald-200 rounded-3xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-black text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      File Verified & Accessible
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">File Name</span>
                      <span className="font-bold text-slate-900 mt-0.5 block truncate">{driveFileName || 'digital-asset.zip'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Size</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{driveFileSize || '84.2 MB'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Drive File ID</span>
                      <span className="font-mono text-primary font-bold mt-0.5 block truncate">{driveFileId}</span>
                    </div>
                  </div>
                </div>
              )}

              {driveValidationStatus === 'INVALID' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <span>{driveErrorMessage || 'Google Drive file is not accessible or invalid URL format.'}</span>
                </div>
              )}

              {/* Customer Delivery Configuration Checkboxes */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Customer Delivery Configuration
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The customer's email is retrieved automatically from their KDW login/order after verified payment.
                </p>

                <div className="space-y-2.5 pt-1 text-xs">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailOnPayment}
                      onChange={(e) => setSendEmailOnPayment(e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="font-bold text-slate-800">
                      Send product link to customer's login email after successful payment
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInMyPurchases}
                      onChange={(e) => setShowInMyPurchases(e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="font-bold text-slate-800">
                      Show product in customer's "My Purchases" tab
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireCustomerLogin}
                      onChange={(e) => setRequireCustomerLogin(e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="font-bold text-slate-800">
                      Require customer account login for download access
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BASIC INFORMATION */}
          {currentStepIndex === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <FileText size={14} /> Stage 2: Basic Information
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Product Identification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Product name, auto-generated unique ID code, URL slug, and core descriptions.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Agency Starter Kit — Complete Canva & Automation Bundle"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Product ID (System Assigned)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={productCode || 'Auto-generated on Save'}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setIsSlugEdited(true);
                      }}
                      placeholder="agency-starter-kit"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Brand / Author
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="KDW"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Short Description (Catalog cards & Search snippets)
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Concise 1-2 sentence overview for catalog cards..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Product Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive overview of assets, benefits, and instructions..."
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORGANIZATION */}
          {currentStepIndex === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Layers size={14} /> Stage 3: Organization
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Categories & Attributes</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Taxonomy, discovery tags, and structured product specifications.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Primary Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subcategory (Optional)
                    </label>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="e.g. Proposal Templates"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Discovery Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((t, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-xl text-xs flex items-center gap-1.5">
                        #{t}
                        <button type="button" onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== idx))} className="hover:text-rose-600">×</button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag..."
                      className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-48"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                          setSelectedTags([...selectedTags, tagInput.trim()]);
                          setTagInput('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>

                {/* Structured Attributes */}
                <div className="pt-2 space-y-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Structured Specifications
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    {attributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-600">{attr.key}: <strong className="text-slate-900">{attr.value}</strong></span>
                        <button type="button" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newAttrKey}
                      onChange={(e) => setNewAttrKey(e.target.value)}
                      placeholder="Field (e.g. Skill Level)"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1"
                    />
                    <input
                      type="text"
                      value={newAttrVal}
                      onChange={(e) => setNewAttrVal(e.target.value)}
                      placeholder="Value (e.g. Beginner to Pro)"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1"
                    />
                    <button type="button" onClick={handleAddAttribute} className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRICING */}
          {currentStepIndex === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <IndianRupee size={14} /> Stage 4: Pricing & Taxes
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pricing Architecture</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Server-verified pricing, strike-through discounts, and automated GST calculations.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Base Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1499"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sale Price (₹)
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="999"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Compare-at (₹)
                    </label>
                    <input
                      type="number"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="1999"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500"
                    />
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 size={16} />
                    <span>Customer saves {discountPercent}% off the base price!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tax Mode
                    </label>
                    <select
                      value={taxMode}
                      onChange={(e) => setTaxMode(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="INCLUSIVE">Tax Inclusive (GST Included)</option>
                      <option value="EXCLUSIVE">Tax Exclusive (Calculated at checkout)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      GST Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: MEDIA & PREVIEWS */}
          {currentStepIndex === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <ImageIcon size={14} /> Stage 5: Media & Preview
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Public Previews & Cover Art</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Public previews never expose the complete private product file.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cover Image <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-start gap-4">
                    {coverImage ? (
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setCoverImage('')} className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer shrink-0 transition-colors bg-slate-50">
                        <UploadCloud size={24} />
                        <span className="text-[10px] font-bold mt-1">Upload</span>
                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      </label>
                    )}

                    <div className="space-y-2 flex-1">
                      <input
                        type="text"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="Or paste cover image URL..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Recommended: 1200x800px (4:3 or 16:9 ratio).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Sample Preview PDF / Watermarked Sample URL
                    </label>
                    <input
                      type="text"
                      value={previewPdfUrl}
                      onChange={(e) => setPreviewPdfUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Public Demo URL (Canva/Figma preview)
                    </label>
                    <input
                      type="text"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder="https://canva.com/preview/..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ACCESS & DOWNLOAD */}
          {currentStepIndex === 5 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Lock size={14} /> Stage 6: Access & Download
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Policies & Quotas</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enforce download quotas, token lifetimes, and refund revocation rules.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Download Limit
                    </label>
                    <select
                      value={downloadLimit}
                      onChange={(e) => setDownloadLimit(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="3">3 Downloads</option>
                      <option value="5">5 Downloads (Standard)</option>
                      <option value="10">10 Downloads</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Access Duration
                    </label>
                    <select
                      value={accessDurationDays}
                      onChange={(e) => setAccessDurationDays(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="180">180 Days</option>
                      <option value="365">365 Days (1 Year)</option>
                      <option value="Never">Lifetime Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Secure Token Lifetime
                    </label>
                    <select
                      value={tokenDurationMinutes}
                      onChange={(e) => setTokenDurationMinutes(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="60">60 Minutes (1 Hour)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Refund Revocation Policy
                  </label>
                  <select
                    value={refundPolicy}
                    onChange={(e) => setRefundPolicy(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="REVOKE_ACCESS">Revoke Access Immediately on Refund</option>
                    <option value="MANUAL_REVIEW">Manual Support Review</option>
                    <option value="KEEP_ACCESS">Keep Access</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: LICENCE */}
          {currentStepIndex === 6 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <ShieldCheck size={14} /> Stage 7: Licence Configuration
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Licence Scope & Usage Rights</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Licence terms are snapshotted into historical orders at the time of purchase.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Licence Type
                    </label>
                    <select
                      value={licenceType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLicenceType(val);
                        const match = availableLicences.find(l => l.name === val || l.slug === val || l.name?.toUpperCase() === val?.toUpperCase());
                        if (match) {
                          if (match.domainLimit) setDomainLimit(match.domainLimit.toString());
                          if (match.activationLimit) setActivationLimit(match.activationLimit.toString());
                          if (match.terms && !licenceTerms) setLicenceTerms(match.terms);
                        }
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      {availableLicences.length > 0 ? (
                        availableLicences.map(l => (
                          <option key={l.id} value={l.name}>{l.name} {l.isDefault ? '(Default)' : ''}</option>
                        ))
                      ) : (
                        <>
                          <option value="Personal Licence">Personal Licence</option>
                          <option value="Commercial Licence">Commercial Licence (Default)</option>
                          <option value="Agency Licence">Agency Licence (5 Clients)</option>
                          <option value="Extended Commercial">Extended Commercial</option>
                          <option value="Reseller Licence">Reseller Licence</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Allowed Domains
                    </label>
                    <input
                      type="number"
                      value={domainLimit}
                      onChange={(e) => setDomainLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Allowed Activations
                    </label>
                    <input
                      type="number"
                      value={activationLimit}
                      onChange={(e) => setActivationLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer-Facing Licence Terms
                  </label>
                  <textarea
                    value={licenceTerms}
                    onChange={(e) => setLicenceTerms(e.target.value)}
                    placeholder="Legal terms displayed on invoice..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: CONTENT & FAQS */}
          {currentStepIndex === 7 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Sparkles size={14} /> Stage 8: Storefront Content & FAQs
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Structured Content Sections</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Deliverables breakdown, technical software requirements, and FAQ accordion.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    What's Included / Key Deliverables (1 per line)
                  </label>
                  <textarea
                    value={whatsIncluded}
                    onChange={(e) => setWhatsIncluded(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Technical Requirements & Prerequisites
                  </label>
                  <input
                    type="text"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="e.g. Free Canva Account, Google Chrome"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* FAQ Items */}
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Frequently Asked Questions
                  </label>
                  <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-slate-900">Q: {faq.question}</h5>
                          <p className="text-slate-600 mt-0.5">A: {faq.answer}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveFaq(idx)} className="text-slate-400 hover:text-rose-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-slate-100/70 rounded-2xl border border-slate-200 space-y-2">
                    <input
                      type="text"
                      value={newFaqQ}
                      onChange={(e) => setNewFaqQ(e.target.value)}
                      placeholder="Question..."
                      className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={newFaqA}
                      onChange={(e) => setNewFaqA(e.target.value)}
                      placeholder="Answer..."
                      className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <button type="button" onClick={handleAddFaq} className="px-3 py-1 bg-slate-900 text-white font-bold rounded-xl text-xs">
                      + Add FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: SEO & SEARCH PREVIEW */}
          {currentStepIndex === 8 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Globe size={14} /> Stage 9: SEO & Social Preview
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Search Engine Optimization</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Google search simulation and OpenGraph social metadata.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Live Google SERP Preview */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Google Search Preview</span>
                  <h4 className="text-blue-700 font-bold text-sm hover:underline cursor-pointer">
                    {seoTitle || name || 'Product Title'} - Kanishk Digital World
                  </h4>
                  <span className="text-emerald-700 text-[11px] block font-mono">
                    https://kanishkdigitalworld.com/product/{slug || 'url'}
                  </span>
                  <p className="text-slate-600 text-xs line-clamp-2">
                    {seoDescription || shortDescription || 'Instant secure download access at Kanishk Digital World.'}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Product Title | KDW Digital Store"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SEO Meta Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: REVIEW & PUBLISH */}
          {currentStepIndex === 9 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <CheckCircle2 size={14} /> Stage 10: Review & Pre-Publish Audit
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Final Verification Gate</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verify readiness before enabling customer purchases.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px]">Product & Delivery</h4>
                  <p><strong className="text-slate-900">Name:</strong> {name || 'Untitled'}</p>
                  <p><strong className="text-slate-900">Category:</strong> {category || 'Unassigned'}</p>
                  <p><strong className="text-slate-900">Price:</strong> {formatCurrency(parseFloat(price) || 0)} {discountPrice ? `(Sale: ${formatCurrency(parseFloat(discountPrice))})` : ''}</p>
                  <p><strong className="text-slate-900">Drive Status:</strong> <span className={driveValidationStatus === 'VALID' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{driveValidationStatus === 'VALID' ? 'Connected & Verified' : 'Missing Link'}</span></p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px]">Access & Licence</h4>
                  <p><strong className="text-slate-900">Download Limit:</strong> {downloadLimit} downloads</p>
                  <p><strong className="text-slate-900">Access Lifetime:</strong> {accessDurationDays} days</p>
                  <p><strong className="text-slate-900">Licence:</strong> {licenceType}</p>
                  <p><strong className="text-slate-900">Token Duration:</strong> {tokenDurationMinutes} mins</p>
                </div>
              </div>

              <div className="p-5 bg-slate-900 text-white rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">Storefront Readiness</span>
                  <span className="text-2xl font-black text-white mt-0.5 block">{completeness}% Ready</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveProduct('DRAFT')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProduct('PUBLISHED')}
                    disabled={isSaving || completeness < 70}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Publishing...' : 'Publish to Storefront'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons (Bottom) */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveProduct('PUBLISHED')}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 size={15} /> Complete & Publish
              </button>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Product Journey / Step Summary Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={15} className="text-primary" />
              Product Journey Summary
            </h3>

            {/* Live Mini Preview Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-full h-32 rounded-xl bg-slate-200 overflow-hidden relative border border-slate-300/60">
                {coverImage ? (
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                    <ImageIcon size={24} />
                    <span className="text-[10px] mt-1 font-bold">No Cover Art</span>
                  </div>
                )}
                {discountPercent > 0 && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-primary block">
                  {productCode || 'KDW-P-000XXX'}
                </span>
                <h4 className="font-black text-slate-900 text-xs mt-0.5 line-clamp-1">
                  {name || 'Untitled Digital Product'}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(parseFloat(price) || 0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {category || 'Uncategorized'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step Checkpoints List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">1. Google Drive</span>
                <span className={`text-[10px] font-bold ${driveValidationStatus === 'VALID' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {driveValidationStatus === 'VALID' ? '✓ Connected' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">2. Basic Info</span>
                <span className={`text-[10px] font-bold ${name ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {name ? '✓ Completed' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">3. Category</span>
                <span className={`text-[10px] font-bold ${category ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {category ? '✓ Assigned' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">4. Pricing</span>
                <span className={`text-[10px] font-bold ${price ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {price ? '✓ Set' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700">5. Cover Media</span>
                <span className={`text-[10px] font-bold ${coverImage ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {coverImage ? '✓ Uploaded' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}