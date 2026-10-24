import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Save, UploadCloud, Image as ImageIcon, 
  CheckCircle, Tag, IndianRupee, Layers, FileText, HelpCircle, 
  ShieldCheck, Loader2, AlertCircle, HardDrive, CheckCircle2, 
  Cpu, Sparkles, Globe, FileCode, Lock, Key, Calendar,
  RefreshCw, Check, X, Sliders, ExternalLink, ShieldAlert, Plus, Trash2, Eye,
  AlertTriangle, FolderPlus, HelpCircle as HelpIcon, ArrowUpRight, Percent,
  ChevronDown, Search, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';
import { formatCurrency } from '../../utils/currency';
import { useStore } from '../../store/useStore';
import { useSettings } from '../../context/SettingsContext';
import axios from 'axios';

// 10 EXACT PRODUCTION STAGES
const STEPS = [
  { id: 'drive', title: 'Google Drive Delivery', stepNum: 1, desc: 'Secure cloud asset connection' },
  { id: 'basic', title: 'Basic Information', stepNum: 2, desc: 'Name, slug, and descriptions' },
  { id: 'organization', title: 'Organization & Placement', stepNum: 3, desc: 'Primary category or subcategory' },
  { id: 'pricing', title: 'Pricing & Tax', stepNum: 4, desc: 'Regular price, sale price, and GST' },
  { id: 'media', title: 'Media & Preview', stepNum: 5, desc: 'Cover image and visual assets' },
  { id: 'access', title: 'Access & Download', stepNum: 6, desc: 'Download limits and access duration' },
  { id: 'licence', title: 'Licence Configuration', stepNum: 7, desc: 'Personal usage terms & activations' },
  { id: 'content', title: 'Content & FAQs', stepNum: 8, desc: "What's included, software, and FAQs" },
  { id: 'seo', title: 'SEO & Social', stepNum: 9, desc: 'Search engine metadata and preview' },
  { id: 'review', title: 'Review & Publish', stepNum: 10, desc: 'Final verification gate' }
];

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { settings } = useSettings();
  const currencySymbol = settings.currency_symbol || '₹';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableLicences, setAvailableLicences] = useState<any[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // ============================================================================
  // STAGE 1: GOOGLE DRIVE DELIVERY
  // ============================================================================
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

  // Customer Delivery Settings
  const [sendEmailOnPayment, setSendEmailOnPayment] = useState(true);
  const [showInMyPurchases, setShowInMyPurchases] = useState(true);
  const [requireCustomerLogin, setRequireCustomerLogin] = useState(true);

  // ============================================================================
  // STAGE 2: BASIC INFORMATION
  // ============================================================================
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [slug, setSlug] = useState('');
  const [urlPrefix, setUrlPrefix] = useState('/product/');
  const [customUrlPrefix, setCustomUrlPrefix] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('KDW');
  const [productType, setProductType] = useState('DOWNLOADABLE_FILE');

  // ============================================================================
  // STAGE 3: ORGANIZATION & PRODUCT PLACEMENT
  // ============================================================================
  const [placementType, setPlacementType] = useState<'PRIMARY' | 'SUBCATEGORY'>('PRIMARY');
  const [selectedPrimaryCategoryId, setSelectedPrimaryCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
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

  // Modals for creating category / subcategory on-the-fly
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [showCreateSubcategoryModal, setShowCreateSubcategoryModal] = useState(false);
  const [subcatParentId, setSubcatParentId] = useState('');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatSlug, setNewSubcatSlug] = useState('');
  const [newSubcatDesc, setNewSubcatDesc] = useState('');
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);

  // Custom downward dropdown state & refs
  const [isPrimaryCatOpen, setIsPrimaryCatOpen] = useState(false);
  const [primaryCatSearch, setPrimaryCatSearch] = useState('');
  const primaryCatRef = useRef<HTMLDivElement>(null);

  const [isSubcatOpen, setIsSubcatOpen] = useState(false);
  const [subcatSearch, setSubcatSearch] = useState('');
  const subcatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (primaryCatRef.current && !primaryCatRef.current.contains(event.target as Node)) {
        setIsPrimaryCatOpen(false);
      }
      if (subcatRef.current && !subcatRef.current.contains(event.target as Node)) {
        setIsSubcatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // STAGE 4: PRICING & TAX (MANUAL FREEDOM + PRESETS)
  // ============================================================================
  const [price, setPrice] = useState('999');
  const [discountPrice, setDiscountPrice] = useState('499');
  const [compareAtPrice, setCompareAtPrice] = useState('1499');
  const [costPrice, setCostPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [taxMode, setTaxMode] = useState<'INCLUSIVE' | 'EXCLUSIVE' | 'EXEMPT'>('INCLUSIVE');
  const [taxRate, setTaxRate] = useState('18');
  const [offerStartAt, setOfferStartAt] = useState('');
  const [offerEndAt, setOfferEndAt] = useState('');

  // ============================================================================
  // STAGE 5: MEDIA & PREVIEW (No Dead Watermark / Demo fields)
  // ============================================================================
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // ============================================================================
  // STAGE 6: ACCESS & DOWNLOAD
  // ============================================================================
  const [downloadLimitType, setDownloadLimitType] = useState<'UNLIMITED' | 'LIMITED'>('LIMITED');
  const [downloadLimitCount, setDownloadLimitCount] = useState('5');
  const [accessDurationType, setAccessDurationType] = useState<'LIFETIME' | 'LIMITED'>('LIFETIME');
  const [accessDurationDaysCount, setAccessDurationDaysCount] = useState('365');
  const [tokenDurationMinutes, setTokenDurationMinutes] = useState('60');
  const [maxActiveTokens, setMaxActiveTokens] = useState('3');
  const [refundPolicy, setRefundPolicy] = useState('REVOKE_ACCESS');

  // ============================================================================
  // STAGE 7: LICENCE
  // ============================================================================
  const [licenceKeyRequired, setLicenceKeyRequired] = useState(false);
  const [licenceType, setLicenceType] = useState('PERSONAL');
  const [activationLimit, setActivationLimit] = useState('1');
  const [domainLimit, setDomainLimit] = useState('1');
  const [deviceLimit, setDeviceLimit] = useState('3');
  const [licenceTerms, setLicenceTerms] = useState(
    'Permitted for personal use. Direct redistribution or resale of raw source files is strictly prohibited.'
  );

  // ============================================================================
  // STAGE 8: CONTENT & FAQS
  // ============================================================================
  const [whatsIncludedList, setWhatsIncludedList] = useState<string[]>([
    '500+ Fully Editable Canva Templates',
    'Step-by-Step Video Walkthrough & Instructions',
    'Personal Usage Licence Rights',
    'Free Lifetime Version Updates'
  ]);
  const [newWhatsIncludedItem, setNewWhatsIncludedItem] = useState('');
  const [requirements, setRequirements] = useState('Free Canva or Google Account, Modern Web Browser');
  const [version, setVersion] = useState('v1.0.0');
  const [supportInfo, setSupportInfo] = useState('Priority 24/7 email support: support@kanishkdigitalworld.com');
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    { 
      question: 'How do I access my files after payment?', 
      answer: 'Immediately upon successful payment, a secure link is sent to your email, and the file is instantly accessible in your My Purchases dashboard.' 
    },
    { 
      question: 'Can I use these assets for personal projects?', 
      answer: 'Yes! Personal rights are included with every purchase. You can use these templates for your personal projects.' 
    }
  ]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // ============================================================================
  // STAGE 9: SEO & SOCIAL PREVIEW
  // ============================================================================
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Effective URL route prefix helper
  const effectivePrefix = useMemo(() => {
    if (urlPrefix === 'custom') {
      let custom = (customUrlPrefix || '').trim();
      if (!custom) return '/custom/';
      if (!custom.startsWith('/')) custom = '/' + custom;
      if (!custom.endsWith('/')) custom = custom + '/';
      return custom;
    }
    return urlPrefix;
  }, [urlPrefix, customUrlPrefix]);

  // ============================================================================
  // STATUS & SCHEDULING
  // ============================================================================
  const [productStatus, setProductStatus] = useState('DRAFT');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Fetch Categories, Tags, and Licences
  const fetchCategoryData = async () => {
    try {
      const [catRes, tagRes, licRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/products/tags'),
        axios.get('/api/products/licences')
      ]);
      if (catRes.data.success) {
        setCategories(catRes.data.data);
      }
      if (tagRes.data.success) setAvailableTags(tagRes.data.data);
      if (licRes.data.success) setAvailableLicences(licRes.data.data);
    } catch (err) {
      console.error('Failed to load category hierarchy:', err);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, []);

  // Sync store defaults for new products
  useEffect(() => {
    if (!isEditing && settings) {
      if (settings.currency) setCurrency(settings.currency);
      if (settings.tax_mode) setTaxMode((settings.tax_mode || 'INCLUSIVE').toUpperCase() as any);
      if (settings.gst_rate !== undefined && settings.gst_rate !== null) setTaxRate(settings.gst_rate.toString());
    }
  }, [settings, isEditing]);

  // Filter Primary Categories (Categories that have no parentId)
  const primaryCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  // Subcategories available for currently selected primary category
  const availableSubcategories = useMemo(() => {
    if (!selectedPrimaryCategoryId) return [];
    const parent = categories.find(c => c.id === selectedPrimaryCategoryId);
    if (parent && parent.children && parent.children.length > 0) {
      return parent.children;
    }
    return categories.filter(c => c.parentId === selectedPrimaryCategoryId);
  }, [categories, selectedPrimaryCategoryId]);

  // Filtered lists for dropdown search
  const filteredPrimaryCategories = useMemo(() => {
    if (!primaryCatSearch.trim()) return primaryCategories;
    return primaryCategories.filter(c => 
      c.name.toLowerCase().includes(primaryCatSearch.toLowerCase())
    );
  }, [primaryCategories, primaryCatSearch]);

  const filteredSubcategories = useMemo(() => {
    if (!subcatSearch.trim()) return availableSubcategories;
    return availableSubcategories.filter((c: any) => 
      c.name.toLowerCase().includes(subcatSearch.toLowerCase())
    );
  }, [availableSubcategories, subcatSearch]);

  const selectedPrimaryCategoryObj = useMemo(() => {
    return primaryCategories.find(c => c.id === selectedPrimaryCategoryId);
  }, [primaryCategories, selectedPrimaryCategoryId]);

  const selectedSubcategoryObj = useMemo(() => {
    return availableSubcategories.find((c: any) => c.id === selectedSubcategoryId);
  }, [availableSubcategories, selectedSubcategoryId]);

  // Pre-populate Stage 8 Attributes if selected Primary Category has attributeConfig
  useEffect(() => {
    if (!isEditing && selectedPrimaryCategoryObj?.attributeConfig) {
      const config = selectedPrimaryCategoryObj.attributeConfig;
      if (typeof config === 'object' && Object.keys(config).length > 0) {
        const defaultAttrs = Object.entries(config).map(([key, val]: [string, any]) => ({
          key: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          value: Array.isArray(val?.values) && val.values.length > 0 ? val.values[0] : (val?.default || 'Standard')
        }));
        if (defaultAttrs.length > 0) {
          setAttributes(defaultAttrs);
        }
      }
    }
  }, [selectedPrimaryCategoryObj, isEditing]);

  // Load Existing Product If Editing
  useEffect(() => {
    if (isEditing && id) {
      const loadProduct = async () => {
        try {
          setIsLoadingProduct(true);
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

            // Placement & Categories
            const pType = p.placementType || (p.subcategoryId ? 'SUBCATEGORY' : 'PRIMARY');
            setPlacementType(pType);
            if (p.categoryId) {
              setSelectedPrimaryCategoryId(p.categoryId);
            }
            if (p.subcategoryId) {
              setSelectedSubcategoryId(p.subcategoryId);
            }

            // Pricing & Tax
            setPrice(p.price !== undefined && p.price !== null ? p.price.toString() : '0');
            setDiscountPrice(p.discountPrice !== null && p.discountPrice !== undefined ? p.discountPrice.toString() : '');
            setCompareAtPrice(p.compareAtPrice ? p.compareAtPrice.toString() : '');
            setCostPrice(p.costPrice ? p.costPrice.toString() : '');
            setCurrency(p.currency || settings.currency || 'INR');
            setTaxMode((p.taxMode || settings.tax_mode || 'INCLUSIVE').toUpperCase() as any);
            const currentTax = p.taxRate !== undefined && p.taxRate !== null ? p.taxRate.toString() : (settings.gst_rate !== undefined ? settings.gst_rate.toString() : '18');
            setTaxRate(currentTax);

            // Media
            setCoverImage(p.thumbnail || p.coverImage || '');
            if (p.previewImages) {
              try {
                const parsed = typeof p.previewImages === 'string' ? JSON.parse(p.previewImages) : p.previewImages;
                if (Array.isArray(parsed)) setGalleryImages(parsed);
              } catch (e) {}
            }

            // Drive File
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

            // Access & Download Limits
            if (p.downloadLimit === 999999 || p.downloadLimit === null || p.downloadLimit === undefined) {
              setDownloadLimitType('UNLIMITED');
            } else {
              setDownloadLimitType('LIMITED');
              setDownloadLimitCount(p.downloadLimit.toString());
            }

            if (p.accessDurationDays === 999999 || p.accessDurationDays === null || p.accessDurationDays === undefined) {
              setAccessDurationType('LIFETIME');
            } else {
              setAccessDurationType('LIMITED');
              setAccessDurationDaysCount(p.accessDurationDays.toString());
            }

            setTokenDurationMinutes(p.tokenDurationMinutes ? p.tokenDurationMinutes.toString() : '60');
            setMaxActiveTokens(p.maxActiveTokens ? p.maxActiveTokens.toString() : '3');
            setRefundPolicy(p.refundPolicy || 'REVOKE_ACCESS');

            // Licence
            setLicenceKeyRequired(Boolean(p.licenceKeyRequired));
            setLicenceType(p.licenceType || 'PERSONAL');
            setLicenceTerms(p.licenceTerms || '');
            setActivationLimit(p.activationLimit ? p.activationLimit.toString() : '1');
            setDomainLimit(p.domainLimit ? p.domainLimit.toString() : '1');
            setDeviceLimit(p.deviceLimit ? p.deviceLimit.toString() : '3');

            // Content & Deliverables
            setVersion(p.version || 'v1.0.0');
            if (p.features) {
              try {
                const parsed = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
                if (Array.isArray(parsed)) {
                  setWhatsIncludedList(parsed);
                } else if (typeof p.features === 'string') {
                  setWhatsIncludedList(p.features.split('\n').filter(Boolean));
                }
              } catch (e) {
                if (typeof p.features === 'string') setWhatsIncludedList(p.features.split('\n').filter(Boolean));
              }
            }

            if (p.requirements) {
              if (typeof p.requirements === 'string') setRequirements(p.requirements);
              else if (p.requirements.text) setRequirements(p.requirements.text);
            }

            if (p.faqs) {
              try {
                const parsed = typeof p.faqs === 'string' ? JSON.parse(p.faqs) : p.faqs;
                if (Array.isArray(parsed)) setFaqs(parsed);
              } catch (e) {}
            }

            // SEO & Metadata
            setSeoTitle(p.seoTitle || '');
            setSeoDescription(p.seoDescription || '');
            setSeoKeywords(p.seoKeywords || '');
            setCanonicalUrl(p.canonicalUrl || '');
            
            // Extract route prefix from canonicalUrl
            if (p.canonicalUrl) {
              const match = p.canonicalUrl.match(/^(\/[^\/]+\/)/);
              if (match) {
                const detected = match[1];
                const standardPrefixes = ['/product/', '/freebies/', '/templates/', '/courses/', '/downloads/', '/item/', '/items/', '/resources/', '/ebooks/', '/tools/', '/presets/'];
                if (standardPrefixes.includes(detected)) {
                  setUrlPrefix(detected);
                } else {
                  setUrlPrefix('custom');
                  setCustomUrlPrefix(detected);
                }
              }
            } else if (p.price === 0 || p.price === '0') {
              setUrlPrefix('/freebies/');
            } else {
              setUrlPrefix('/product/');
            }

            setProductStatus(p.status || 'DRAFT');
            setIsFeatured(Boolean(p.featured));
            setIsBestSeller(Boolean(p.bestSeller));
          }
        } catch (err) {
          toast.error('Failed to load product details');
        } finally {
          setIsLoadingProduct(false);
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

  // Upload Cover Image via /api/upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploadingCover(true);
        const url = await uploadImage(e.target.files[0], 'products');
        if (url) {
          setCoverImage(url);
          toast.success('Cover image uploaded successfully');
        }
      } catch (err: any) {
        toast.error(err.message || 'Cover image upload failed');
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  // Upload Gallery Images via /api/upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setIsUploadingGallery(true);
        const newImages: string[] = [];
        for (let i = 0; i < e.target.files.length; i++) {
          const url = await uploadImage(e.target.files[i], 'products');
          if (url) newImages.push(url);
        }
        setGalleryImages(prev => [...prev, ...newImages]);
        toast.success(`${newImages.length} gallery image(s) uploaded`);
      } catch (err: any) {
        toast.error(err.message || 'Gallery upload failed');
      } finally {
        setIsUploadingGallery(false);
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

  // Create Primary Category on-the-fly
  const handleCreatePrimaryCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category Name is required');
      return;
    }

    try {
      setIsCreatingCategory(true);
      const catSlug = newCategorySlug.trim() || newCategoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const res = await axios.post('/api/categories', {
        name: newCategoryName.trim(),
        slug: catSlug,
        description: newCategoryDesc.trim(),
        parentId: null,
        status: 'ACTIVE'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Primary Category "${newCategoryName}" created!`);
        await fetchCategoryData();
        setSelectedPrimaryCategoryId(res.data.data.id);
        setShowCreateCategoryModal(false);
        setNewCategoryName('');
        setNewCategorySlug('');
        setNewCategoryDesc('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Create Subcategory under a chosen Primary Category on-the-fly
  const handleCreateSubcategory = async () => {
    const parentToUse = subcatParentId || selectedPrimaryCategoryId;
    if (!parentToUse) {
      toast.error('Please select a Primary Category under which to create this subcategory');
      return;
    }
    if (!newSubcatName.trim()) {
      toast.error('Subcategory Name is required');
      return;
    }

    try {
      setIsCreatingSubcategory(true);
      const subSlug = newSubcatSlug.trim() || newSubcatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const res = await axios.post('/api/categories', {
        name: newSubcatName.trim(),
        slug: subSlug,
        description: newSubcatDesc.trim(),
        parentId: parentToUse,
        status: 'ACTIVE'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Subcategory "${newSubcatName}" created under primary category!`);
        await fetchCategoryData();
        setSelectedPrimaryCategoryId(parentToUse);
        setSelectedSubcategoryId(res.data.data.id);
        setShowCreateSubcategoryModal(false);
        setNewSubcatName('');
        setNewSubcatSlug('');
        setNewSubcatDesc('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create subcategory');
    } finally {
      setIsCreatingSubcategory(false);
    }
  };

  // Open Create Subcategory Modal with smart default parent
  const handleOpenCreateSubcategoryModal = () => {
    const defaultParent = selectedPrimaryCategoryId || (primaryCategories[0]?.id || '');
    setSubcatParentId(defaultParent);
    setShowCreateSubcategoryModal(true);
  };

  // Add What's Included Item
  const handleAddWhatsIncluded = () => {
    if (!newWhatsIncludedItem.trim()) return;
    setWhatsIncludedList(prev => [...prev, newWhatsIncludedItem.trim()]);
    setNewWhatsIncludedItem('');
  };

  const handleRemoveWhatsIncluded = (index: number) => {
    setWhatsIncludedList(prev => prev.filter((_, i) => i !== index));
  };

  // Add/Remove FAQ
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) {
      toast.error('Both Question and Answer are required');
      return;
    }
    setFaqs(prev => [...prev, { question: newFaqQ.trim(), answer: newFaqA.trim() }]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== idx));
  };

  // Add/Remove Attribute
  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return;
    setAttributes(prev => [...prev, { key: newAttrKey.trim(), value: newAttrVal.trim() }]);
    setNewAttrKey('');
    setNewAttrVal('');
  };

  // ============================================================================
  // LIVE PRICE & TAX CALCULATIONS (AUTHORITATIVE & MANUAL FREEDOM)
  // ============================================================================
  const parsedTax = taxRate !== '' ? parseFloat(taxRate) : 0;
  const activeTaxRate = (taxMode === 'EXEMPT' || isNaN(parsedTax)) ? 0 : Math.max(0, parsedTax);
  const regularPriceNum = Math.max(0, parseFloat(price) || 0);
  const effectiveSellingPrice = (discountPrice && parseFloat(discountPrice) > 0 && parseFloat(discountPrice) < regularPriceNum)
    ? parseFloat(discountPrice)
    : regularPriceNum;

  const discountPercent = regularPriceNum > 0 && effectiveSellingPrice < regularPriceNum
    ? Math.round(((regularPriceNum - effectiveSellingPrice) / regularPriceNum) * 100)
    : 0;

  const pricingSummary = useMemo(() => {
    if (taxMode === 'EXEMPT' || activeTaxRate === 0) {
      return {
        basePrice: effectiveSellingPrice,
        gstAmount: 0,
        customerPays: effectiveSellingPrice,
        taxModeLabel: 'Tax Exempt / 0% GST'
      };
    } else if (taxMode === 'INCLUSIVE') {
      const base = activeTaxRate > 0 ? (effectiveSellingPrice / (1 + activeTaxRate / 100)) : effectiveSellingPrice;
      const gst = effectiveSellingPrice - base;
      return {
        basePrice: base,
        gstAmount: gst,
        customerPays: effectiveSellingPrice,
        taxModeLabel: 'GST Inclusive (Included in Price)'
      };
    } else {
      const base = effectiveSellingPrice;
      const gst = activeTaxRate > 0 ? (base * (activeTaxRate / 100)) : 0;
      const customerPays = base + gst;
      return {
        basePrice: base,
        gstAmount: gst,
        customerPays: customerPays,
        taxModeLabel: 'GST Exclusive (Added at Checkout)'
      };
    }
  }, [effectiveSellingPrice, activeTaxRate, taxMode]);

  // Stage-by-Stage Completeness and Audit Calculation
  const stageAudits = useMemo(() => {
    const isDriveValid = Boolean(driveFileId && driveValidationStatus === 'VALID');
    const isBasicValid = Boolean(name.trim() && slug.trim() && shortDescription.trim() && description.trim());
    
    let isOrgValid = false;
    let orgLabel = '';
    if (placementType === 'PRIMARY') {
      isOrgValid = Boolean(selectedPrimaryCategoryId);
      const cat = categories.find(c => c.id === selectedPrimaryCategoryId);
      orgLabel = cat ? `Primary: ${cat.name}` : 'Primary Category Unset';
    } else {
      isOrgValid = Boolean(selectedPrimaryCategoryId && selectedSubcategoryId);
      const parent = categories.find(c => c.id === selectedPrimaryCategoryId);
      const sub = availableSubcategories.find((c: any) => c.id === selectedSubcategoryId);
      orgLabel = (parent && sub) ? `${parent.name} > ${sub.name}` : 'Subcategory Incomplete';
    }

    const isPricingValid = !isNaN(regularPriceNum) && regularPriceNum >= 0;
    const isMediaValid = Boolean(coverImage.trim());
    const isAccessValid = true;
    const isLicenceValid = !licenceKeyRequired ? true : Boolean(licenceType && activationLimit);
    const isContentValid = Boolean(version.trim() && whatsIncludedList.length > 0);
    const isSeoValid = Boolean(seoTitle.trim() && (seoDescription.trim() || shortDescription.trim()));

    const audits = [
      { stepIdx: 0, title: 'Google Drive Delivery', pass: isDriveValid, error: isDriveValid ? '' : 'Connect and validate Google Drive file.' },
      { stepIdx: 1, title: 'Basic Information', pass: isBasicValid, error: isBasicValid ? '' : 'Name, slug, short description, and full description are required.' },
      { stepIdx: 2, title: 'Organization & Placement', pass: isOrgValid, error: isOrgValid ? '' : (placementType === 'PRIMARY' ? 'Select a Primary Category.' : 'Select both Primary Category and Subcategory.') },
      { stepIdx: 3, title: 'Pricing & Tax', pass: isPricingValid, error: isPricingValid ? '' : `Enter a valid Regular Price (>= ${currencySymbol}0).` },
      { stepIdx: 4, title: 'Media & Preview', pass: isMediaValid, error: isMediaValid ? '' : 'Upload a product cover image.' },
      { stepIdx: 5, title: 'Access & Download', pass: isAccessValid, error: '' },
      { stepIdx: 6, title: 'Licence Configuration', pass: isLicenceValid, error: isLicenceValid ? '' : 'Configure licence type and activations.' },
      { stepIdx: 7, title: 'Content & FAQs', pass: isContentValid, error: isContentValid ? '' : "Add at least one What's Included item and version." },
      { stepIdx: 8, title: 'SEO & Social', pass: isSeoValid, error: isSeoValid ? '' : 'Configure SEO Title & Description.' },
      { stepIdx: 9, title: 'Final Review Gate', pass: false, error: '' }
    ];

    const allPreviousPassed = audits.slice(0, 9).every(a => a.pass);
    audits[9].pass = allPreviousPassed;
    audits[9].error = allPreviousPassed ? '' : 'Complete all mandatory stages before publishing live.';

    const passedCount = audits.filter(a => a.pass).length;
    const score = Math.round((passedCount / audits.length) * 100);

    return { audits, score, allPreviousPassed, orgLabel };
  }, [
    driveFileId, driveValidationStatus, name, slug, shortDescription, description,
    placementType, selectedPrimaryCategoryId, selectedSubcategoryId, categories, availableSubcategories,
    regularPriceNum, coverImage, licenceKeyRequired, licenceType, activationLimit,
    version, whatsIncludedList, seoTitle, seoDescription
  ]);

  const completeness = stageAudits.score;

  // Save / Publish Product Handler
  const handleSaveProduct = async (desiredStatus: string = 'DRAFT', customScheduleDate?: string) => {
    if (!name.trim()) {
      toast.error('Stage 2: Product Name is required');
      setCurrentStepIndex(1);
      return;
    }

    if (desiredStatus === 'PUBLISHED') {
      if (!driveFileId || driveValidationStatus !== 'VALID') {
        toast.error('Stage 1: Valid Google Drive File connection is required before publishing');
        setCurrentStepIndex(0);
        return;
      }
      if (!selectedPrimaryCategoryId) {
        toast.error('Stage 3: Category selection is required before publishing');
        setCurrentStepIndex(2);
        return;
      }
      if (placementType === 'SUBCATEGORY' && !selectedSubcategoryId) {
        toast.error('Stage 3: Subcategory selection is required when Subcategory placement is selected');
        setCurrentStepIndex(2);
        return;
      }
      if (price === '' || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        toast.error(`Stage 4: Valid selling price (>= ${currencySymbol}0) is required before publishing`);
        setCurrentStepIndex(3);
        return;
      }
      if (!coverImage.trim()) {
        toast.error('Stage 5: Product Cover Image is required before publishing');
        setCurrentStepIndex(4);
        return;
      }
    }

    if (desiredStatus === 'SCHEDULED' && !customScheduleDate && !scheduledDateTime) {
      toast.error('Please select a scheduled publication date & time');
      return;
    }

    try {
      setIsSaving(true);

      const targetSchedule = desiredStatus === 'SCHEDULED' 
        ? (customScheduleDate || scheduledDateTime) 
        : null;

      const primaryCatObj = categories.find(c => c.id === selectedPrimaryCategoryId);
      const subcatObj = availableSubcategories.find((c: any) => c.id === selectedSubcategoryId);

      const cleanSlug = (slug || name)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const computedCanonicalUrl = canonicalUrl.trim() ? canonicalUrl.trim() : `${effectivePrefix}${cleanSlug}`;

      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        urlPrefix: effectivePrefix,
        productType,
        brand: brand.trim() || 'KDW',
        placementType,
        categoryId: selectedPrimaryCategoryId || null,
        subcategoryId: placementType === 'SUBCATEGORY' ? (selectedSubcategoryId || null) : null,
        category: primaryCatObj?.name || null,
        subcategory: placementType === 'SUBCATEGORY' ? (subcatObj?.name || null) : null,
        tags: selectedTags,
        attributes,
        price: parseFloat(price) || 0,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        currency,
        taxMode: taxMode === 'EXEMPT' ? 'INCLUSIVE' : taxMode,
        taxRate: activeTaxRate,
        offerStartAt: offerStartAt || null,
        offerEndAt: offerEndAt || null,
        publishScheduledAt: targetSchedule ? new Date(targetSchedule).toISOString() : null,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        thumbnail: coverImage || null,
        coverImage: coverImage || null,
        previewImages: galleryImages,
        googleDriveFileId: driveFileId || null,
        driveFileName,
        driveFileSize,
        driveMimeType,
        driveAccessStatus: driveFileId ? 'CONNECTED' : 'NOT_CONNECTED',
        downloadLimit: downloadLimitType === 'UNLIMITED' ? 999999 : (parseInt(downloadLimitCount) || 5),
        accessDurationDays: accessDurationType === 'LIFETIME' ? 999999 : (parseInt(accessDurationDaysCount) || 365),
        tokenDurationMinutes: parseInt(tokenDurationMinutes) || 60,
        maxActiveTokens: parseInt(maxActiveTokens) || 3,
        refundPolicy,
        version: version.trim() || 'v1.0.0',
        licenceKeyRequired,
        licenceType,
        activationLimit: parseInt(activationLimit) || 1,
        domainLimit: parseInt(domainLimit) || 1,
        deviceLimit: parseInt(deviceLimit) || 3,
        licenceTerms,
        whatsIncluded: whatsIncludedList,
        features: whatsIncludedList,
        requirements: { text: requirements },
        supportInfo,
        faqs,
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || shortDescription.trim(),
        seoKeywords,
        canonicalUrl: computedCanonicalUrl,
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
            toast.success('✓ Product published live to storefront!');
          } else if (desiredStatus === 'PENDING_REVIEW') {
            await axios.post(`/api/products/${id}/submit-review`, {}, { headers });
            toast.success('Product submitted for review!');
          } else if (desiredStatus === 'SCHEDULED') {
            toast.success(`Product scheduled for ${new Date(targetSchedule!).toLocaleString()}`);
          } else {
            toast.success('Product draft saved successfully!');
          }
          useStore.getState().fetchProducts();
          navigate('/admin/products');
        }
      } else {
        const res = await axios.post('/api/products', payload, { headers });
        if (res.data.success) {
          const newId = res.data.data.id;
          if (desiredStatus === 'PUBLISHED') {
            await axios.post(`/api/products/${newId}/publish`, {}, { headers });
            toast.success('✓ Product created & published live to storefront!');
          } else if (desiredStatus === 'PENDING_REVIEW') {
            await axios.post(`/api/products/${newId}/submit-review`, {}, { headers });
            toast.success('Product submitted for review!');
          } else if (desiredStatus === 'SCHEDULED') {
            toast.success(`Product created & scheduled for ${new Date(targetSchedule!).toLocaleString()}`);
          } else {
            toast.success('Product draft saved successfully!');
          }
          useStore.getState().fetchProducts();
          navigate('/admin/products');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-sm font-bold">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans w-full">
      {/* 1. Header with Breadcrumb & Primary Actions */}
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
            Configure secure Google Drive delivery, metadata, taxonomy, pricing, licences, and storefront assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveProduct('DRAFT')}
            disabled={isSaving}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Save size={15} /> Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveProduct('PUBLISHED')}
            disabled={isSaving || !stageAudits.allPreviousPassed}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
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
            <span className="text-slate-400 font-bold">Completeness:</span>
            <span className={`font-black px-2 py-0.5 rounded-full text-xs ${completeness >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {completeness}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Stepper Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 custom-scrollbar">
          {STEPS.map((s, idx) => {
            const isDone = stageAudits.audits[idx]?.pass;
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurrent 
                    ? 'bg-primary text-white shadow-xs ring-2 ring-primary/30' 
                    : isDone 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {isDone ? <Check size={12} className="text-emerald-700" /> : <span className="font-mono text-[10px] opacity-75">{s.stepNum}</span>}
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Two-Column Layout: Form Step + Right-Hand Product Journey Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Current Step Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs min-h-[500px] flex flex-col justify-between">
          
          {/* ========================================================================= */}
          {/* STAGE 1: GOOGLE DRIVE DELIVERY */}
          {/* ========================================================================= */}
          {currentStepIndex === 0 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <HardDrive size={14} /> Stage 1: Google Drive Delivery
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Google Drive Asset Connection
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connect the private Google Drive digital product file. Raw Drive URLs are never exposed to customers.
                </p>
              </div>

              {/* Zero-URL Exposure Banner */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-relaxed">
                  <strong>Zero-Exposure Security Architecture:</strong> Customers only receive short-lived, SHA-256 encrypted streaming tokens generated by KDW backend servers. Direct Drive links stay 100% private.
                </div>
              </div>

              {/* Google Drive Link Input & Validation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Google Drive Product File URL or ID <span className="text-rose-500">*</span>
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
                    {driveValidationStatus === 'VALID' ? 'Test File Again' : 'Connect & Validate'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepts Google Drive share URLs, direct links, or raw File IDs.
                </p>
              </div>

              {/* Validation Status Feedback Card */}
              {driveValidationStatus === 'VALID' && (
                <div className="p-5 bg-slate-50 border border-emerald-200 rounded-3xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-black text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      ✓ File Ready & Accessible
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
                  <span>✕ File Not Accessible: {driveErrorMessage || 'Google Drive file is not accessible or invalid URL format.'}</span>
                </div>
              )}

              {/* Customer Delivery Configuration */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Customer Delivery Settings
                </h4>
                <div className="space-y-2.5 pt-1 text-xs">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailOnPayment}
                      onChange={(e) => setSendEmailOnPayment(e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="font-bold text-slate-800">
                      Send instant access link to customer email upon verified payment
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
                      Require verified customer account authentication for downloads
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: BASIC INFORMATION */}
          {/* ========================================================================= */}
          {currentStepIndex === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <FileText size={14} /> Stage 2: Basic Information
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Product Identification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Product name, auto-generated immutable Product ID, URL slug, and customer descriptions.
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Product ID (System Assigned)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={productCode || 'KDW-P-AUTO'}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-primary cursor-not-allowed"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Storefront URL Route & Slug Configuration */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider text-xs">
                        Storefront Route & URL Configuration <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Configure the route prefix (e.g. <span className="font-mono text-primary font-bold">/freebies/</span> for free guides, <span className="font-mono text-primary font-bold">/product/</span> for items).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = (name || 'product')
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setSlug(generated);
                        setIsSlugEdited(true);
                        toast.success('Slug updated from Product Name');
                      }}
                      title="Generate slug from Product Name"
                      className="text-[11px] font-bold text-primary hover:text-primary-dark inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg cursor-pointer transition-colors self-start sm:self-auto"
                    >
                      <RefreshCw size={12} /> Sync Slug from Name
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className={urlPrefix === 'custom' ? 'sm:col-span-4' : 'sm:col-span-5'}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Route Prefix
                      </label>
                      <select
                        value={urlPrefix}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUrlPrefix(val);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="/product/">/product/ (Default Product)</option>
                        <option value="/freebies/">/freebies/ (Freebies & Free Assets)</option>
                        <option value="/templates/">/templates/ (Template Asset)</option>
                        <option value="/courses/">/courses/ (Course / Tutorial)</option>
                        <option value="/downloads/">/downloads/ (Digital Download)</option>
                        <option value="/item/">/item/ (Single Item)</option>
                        <option value="/items/">/items/ (Items Catalog)</option>
                        <option value="/resources/">/resources/ (Resource)</option>
                        <option value="/ebooks/">/ebooks/ (E-Book)</option>
                        <option value="/tools/">/tools/ (Tool / Utility)</option>
                        <option value="/presets/">/presets/ (Preset Pack)</option>
                        <option value="custom">Custom Prefix (e.g. /my-path/)...</option>
                      </select>
                    </div>

                    {urlPrefix === 'custom' && (
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Custom Prefix
                        </label>
                        <input
                          type="text"
                          value={customUrlPrefix}
                          onChange={(e) => {
                            let val = e.target.value.toLowerCase().replace(/[^a-z0-9\/-]/g, '');
                            if (!val.startsWith('/')) val = '/' + val;
                            setCustomUrlPrefix(val);
                          }}
                          placeholder="/freebies/"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    )}

                    <div className={urlPrefix === 'custom' ? 'sm:col-span-5' : 'sm:col-span-7'}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          const formatted = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-');
                          setSlug(formatted);
                          setIsSlugEdited(true);
                        }}
                        placeholder="e.g. free-starter-guide"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Live Interactive Storefront URL Preview */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Live Storefront URL Preview:
                      </span>
                      <span className="text-xs font-mono text-emerald-700 font-bold truncate block">
                        https://kanishkdigitalworld.com<span className="text-primary">{effectivePrefix}</span><span className="text-indigo-600">{slug || 'url-slug'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://kanishkdigitalworld.com${effectivePrefix}${slug || ''}`);
                          toast.success('Storefront URL copied to clipboard!');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Copy Live URL"
                      >
                        <Copy size={12} /> Copy URL
                      </button>
                      <a
                        href={`${effectivePrefix}${slug || ''}${productStatus !== 'PUBLISHED' ? '?preview=true' : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        title="Open in new tab"
                      >
                        <ExternalLink size={12} /> View
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Short Description (Catalog cards & Search snippets) <span className="text-rose-500">*</span>
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
                    Full Product Description <span className="text-rose-500">*</span>
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

          {/* ========================================================================= */}
          {/* STAGE 3: ORGANIZATION & PRODUCT PLACEMENT */}
          {/* ========================================================================= */}
          {currentStepIndex === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Layers size={14} /> Stage 3: Organization & Product Placement
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Category Placement & Discovery</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Explicitly specify where this product belongs: directly under a Primary Category or inside a Subcategory.
                </p>
              </div>

              {/* Placement Choice Selector */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Where should this product be placed? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label 
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      placementType === 'PRIMARY' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      setPlacementType('PRIMARY');
                      setSelectedSubcategoryId('');
                    }}
                  >
                    <input 
                      type="radio" 
                      name="placementType" 
                      checked={placementType === 'PRIMARY'} 
                      onChange={() => {}}
                      className="w-4 h-4 text-primary" 
                    />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">○ Primary Category</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Place directly under top-level category (no subcategory needed)</span>
                    </div>
                  </label>

                  <label 
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                      placementType === 'SUBCATEGORY' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setPlacementType('SUBCATEGORY')}
                  >
                    <input 
                      type="radio" 
                      name="placementType" 
                      checked={placementType === 'SUBCATEGORY'} 
                      onChange={() => {}}
                      className="w-4 h-4 text-primary" 
                    />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">○ Subcategory</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Place inside a specific child subcategory</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Dropdowns & Creation Modals */}
              <div className="space-y-4 text-xs">
                {/* OPTION A: Primary Category Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 uppercase tracking-wider">
                        Primary Category <span className="text-rose-500">*</span>
                      </label>
                    </div>

                    {/* Custom Downward-Opening Primary Category Dropdown */}
                    <div ref={primaryCatRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPrimaryCatOpen(prev => !prev)}
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                          isPrimaryCatOpen 
                            ? 'border-primary ring-2 ring-primary/20 bg-white' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <span className={selectedPrimaryCategoryObj ? 'text-slate-800' : 'text-slate-400 font-medium'}>
                          {selectedPrimaryCategoryObj ? selectedPrimaryCategoryObj.name : 'Select Primary Category...'}
                        </span>
                        <ChevronDown 
                          size={16} 
                          className={`text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isPrimaryCatOpen ? 'rotate-180 text-primary' : ''}`} 
                        />
                      </button>

                      {isPrimaryCatOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                          {primaryCategories.length > 5 && (
                            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                              <div className="relative flex items-center">
                                <Search size={14} className="absolute left-2.5 text-slate-400" />
                                <input
                                  type="text"
                                  value={primaryCatSearch}
                                  onChange={(e) => setPrimaryCatSearch(e.target.value)}
                                  placeholder="Search primary category..."
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary text-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            </div>
                          )}

                          <div className="max-h-60 overflow-y-auto py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPrimaryCategoryId('');
                                setSelectedSubcategoryId('');
                                setIsPrimaryCatOpen(false);
                                setPrimaryCatSearch('');
                              }}
                              className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                !selectedPrimaryCategoryId ? 'bg-primary/5 text-primary font-bold' : 'text-slate-500'
                              }`}
                            >
                              <span>Select Primary Category...</span>
                              {!selectedPrimaryCategoryId && <Check size={14} className="text-primary shrink-0" />}
                            </button>

                            {filteredPrimaryCategories.map(c => {
                              const isSelected = selectedPrimaryCategoryId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPrimaryCategoryId(c.id);
                                    setSelectedSubcategoryId('');
                                    setIsPrimaryCatOpen(false);
                                    setPrimaryCatSearch('');
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                    isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-slate-800'
                                  }`}
                                >
                                  <span>{c.name}</span>
                                  {isSelected && <Check size={14} className="text-primary shrink-0" />}
                                </button>
                              );
                            })}

                            {filteredPrimaryCategories.length === 0 && (
                              <div className="px-4 py-3 text-center text-xs text-slate-400">
                                No matching categories found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OPTION B: Subcategory Selection */}
                  {placementType === 'SUBCATEGORY' ? (
                    <div className="space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 uppercase tracking-wider">
                          Subcategory <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      {/* Custom Downward-Opening Subcategory Dropdown */}
                      <div ref={subcatRef} className="relative">
                        <button
                          type="button"
                          disabled={!selectedPrimaryCategoryId}
                          onClick={() => {
                            if (selectedPrimaryCategoryId) {
                              setIsSubcatOpen(prev => !prev);
                            }
                          }}
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSubcatOpen 
                              ? 'border-primary ring-2 ring-primary/20 bg-white' 
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                          }`}
                        >
                          <span className={selectedSubcategoryObj ? 'text-slate-800' : 'text-slate-400 font-medium'}>
                            {selectedSubcategoryObj 
                              ? selectedSubcategoryObj.name 
                              : (selectedPrimaryCategoryId ? 'Select Subcategory...' : 'Select Primary Category First')}
                          </span>
                          <ChevronDown 
                            size={16} 
                            className={`text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isSubcatOpen ? 'rotate-180 text-primary' : ''}`} 
                          />
                        </button>

                        {isSubcatOpen && selectedPrimaryCategoryId && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            {availableSubcategories.length > 5 && (
                              <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                                <div className="relative flex items-center">
                                  <Search size={14} className="absolute left-2.5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={subcatSearch}
                                    onChange={(e) => setSubcatSearch(e.target.value)}
                                    placeholder="Search subcategory..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary text-slate-800"
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                  />
                                </div>
                              </div>
                            )}

                            <div className="max-h-60 overflow-y-auto py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubcategoryId('');
                                  setIsSubcatOpen(false);
                                  setSubcatSearch('');
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                  !selectedSubcategoryId ? 'bg-primary/5 text-primary font-bold' : 'text-slate-500'
                                }`}
                              >
                                <span>Select Subcategory...</span>
                                {!selectedSubcategoryId && <Check size={14} className="text-primary shrink-0" />}
                              </button>

                              {filteredSubcategories.map((c: any) => {
                                const isSelected = selectedSubcategoryId === c.id;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubcategoryId(c.id);
                                      setIsSubcatOpen(false);
                                      setSubcatSearch('');
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                      isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-slate-800'
                                    }`}
                                  >
                                    <span>{c.name}</span>
                                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                                  </button>
                                );
                              })}

                              {filteredSubcategories.length === 0 && (
                                <div className="px-4 py-3 text-center text-xs text-slate-400">
                                  No matching subcategories found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedPrimaryCategoryId && availableSubcategories.length === 0 && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 mt-1">
                          <span className="text-[11px] text-amber-800 font-bold">
                            No subcategories under this primary category yet.
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenCreateSubcategoryModal}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                          >
                            + Create One
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center text-slate-400 text-xs font-medium">
                      Subcategory: Not Applicable (Direct Primary Placement)
                    </div>
                  )}
                </div>

                {/* Discovery Tags */}
                <div className="pt-2">
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
                      placeholder="Add tag (e.g. canva-kit)..."
                      className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                          setSelectedTags([...selectedTags, tagInput.trim()]);
                          setTagInput('');
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-900"
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
                        <button type="button" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 cursor-pointer">
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
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1"
                    />
                    <input
                      type="text"
                      value={newAttrVal}
                      onChange={(e) => setNewAttrVal(e.target.value)}
                      placeholder="Value (e.g. All Levels)"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1"
                    />
                    <button type="button" onClick={handleAddAttribute} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer">
                      + Add
                    </button>
                  </div>
                </div>

                {/* Storefront Promotion & Featured Status */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={16} />
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                      Storefront Promotion & Badges
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mark as Featured */}
                    <label className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                      isFeatured 
                        ? 'border-amber-400 bg-amber-50/60 shadow-xs' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}>
                      <input 
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500/20"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">Mark as Featured Product</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                            ★ Featured
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Display prominent ★ FEATURED badge and prioritize in homepage / shop collections.
                        </span>
                      </div>
                    </label>

                    {/* Mark as Best Seller */}
                    <label className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                      isBestSeller 
                        ? 'border-purple-400 bg-purple-50/60 shadow-xs' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}>
                      <input 
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary/20"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">Mark as Best Seller</span>
                          <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                            Best Seller
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Highlight with high-conversion BEST SELLER badge on catalog cards.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 4: PRICING & TAX (MANUAL FREEDOM + PRESETS) */}
          {/* ========================================================================= */}
          {currentStepIndex === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <IndianRupee size={14} /> Stage 4: Pricing & Taxes
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pricing Architecture & GST</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure regular pricing, optional sale discounts, tax mode, and manual or preset GST percentages.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Regular Price ({currencySymbol}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="999"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sale Price ({currencySymbol}) <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="499"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Compare-At Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="1499"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 size={16} />
                    <span>Customer saves {discountPercent}% off regular price!</span>
                  </div>
                )}

                {regularPriceNum === 0 && price.trim() !== '' && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-2 text-sky-900 font-bold">
                    <CheckCircle2 size={16} className="text-sky-600" />
                    <span>Free Resource ({currencySymbol}0) — This item is free for all customers and will be featured in the Free Resources section.</span>
                  </div>
                )}

                {/* Tax Mode & Manual/Preset GST Percentage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tax Mode
                    </label>
                    <select
                      value={taxMode}
                      onChange={(e) => {
                        const newMode = e.target.value as any;
                        setTaxMode(newMode);
                        if (newMode === 'EXEMPT') {
                          setTaxRate('0');
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="INCLUSIVE">GST Inclusive (Tax included in price)</option>
                      <option value="EXCLUSIVE">GST Exclusive (Tax added at checkout)</option>
                      <option value="EXEMPT">Tax Exempt / Zero Tax (0% GST)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider">
                        GST Rate Percentage (%)
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold">Decide Manually or Select Preset</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct Manual Number Input */}
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          disabled={taxMode === 'EXEMPT'}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 pr-7 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="18"
                        />
                        <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-xs pointer-events-none">%</span>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex-1 grid grid-cols-5 gap-1">
                        {['0', '5', '12', '18', '28'].map(rate => (
                          <button
                            key={rate}
                            type="button"
                            disabled={taxMode === 'EXEMPT'}
                            onClick={() => setTaxRate(rate)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                              taxRate === rate
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Calculated Price Breakdown Card */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Authoritative Price & GST Breakdown
                    </span>
                    <span className="text-[11px] font-bold text-primary">
                      {pricingSummary.taxModeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Base Price</span>
                      <span className="text-sm font-black text-slate-900 mt-0.5 block">
                        {formatCurrency(pricingSummary.basePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        GST ({activeTaxRate}%)
                      </span>
                      <span className="text-sm font-black text-slate-700 mt-0.5 block">
                        {formatCurrency(pricingSummary.gstAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Pays</span>
                      <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                        {formatCurrency(pricingSummary.customerPays)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 5: MEDIA & PREVIEW */}
          {/* ========================================================================= */}
          {currentStepIndex === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <ImageIcon size={14} /> Stage 5: Media & Preview
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Cover Art & Showcase Gallery</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload high-resolution thumbnail cover art and showcase gallery images.
                </p>
              </div>

              <div className="space-y-5 text-xs">
                {/* Cover Image Slot */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Cover Thumbnail Image <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-start gap-4">
                    {coverImage ? (
                      <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setCoverImage('')} 
                          className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-36 h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer shrink-0 transition-colors bg-slate-50">
                        {isUploadingCover ? <Loader2 size={24} className="animate-spin text-primary" /> : <UploadCloud size={24} />}
                        <span className="text-[10px] font-bold mt-1.5">
                          {isUploadingCover ? 'Uploading...' : 'Upload Cover'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      </label>
                    )}

                    <div className="space-y-2 flex-1">
                      <input
                        type="text"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="Permanent cover image URL..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Recommended dimensions: 1200 × 800px (4:3 or 16:9 ratio). High quality PNG/JPG under 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="pt-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Showcase Gallery Images
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    <label className="h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer transition-colors bg-slate-50">
                      {isUploadingGallery ? <Loader2 size={18} className="animate-spin text-primary" /> : <Plus size={18} />}
                      <span className="text-[10px] font-bold mt-1">Add Image</span>
                      <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 6: ACCESS & DOWNLOAD */}
          {/* ========================================================================= */}
          {currentStepIndex === 5 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Lock size={14} /> Stage 6: Access & Download Policies
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Quotas & Link Lifetimes</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enforce download quotas, entitlement access durations, and signed token lifetimes.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Download Limit Selection */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Download Limit <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Controls how many times each customer can download the asset</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-bold transition-all ${downloadLimitType === 'UNLIMITED' ? 'bg-primary/10 border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="dlLimitType"
                        checked={downloadLimitType === 'UNLIMITED'}
                        onChange={() => setDownloadLimitType('UNLIMITED')}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      Unlimited Downloads
                    </label>
                    <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-bold transition-all ${downloadLimitType === 'LIMITED' ? 'bg-primary/10 border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="dlLimitType"
                        checked={downloadLimitType === 'LIMITED'}
                        onChange={() => setDownloadLimitType('LIMITED')}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      Limited Downloads
                    </label>
                    {downloadLimitType === 'LIMITED' && (
                      <div className="flex items-center gap-2 pl-2">
                        <input
                          type="number"
                          min="1"
                          value={downloadLimitCount}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setDownloadLimitCount('');
                            } else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 1) setDownloadLimitCount(num.toString());
                            }
                          }}
                          onBlur={() => {
                            if (!downloadLimitCount || parseInt(downloadLimitCount, 10) < 1) {
                              setDownloadLimitCount('5');
                            }
                          }}
                          className="w-24 px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-black text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                          placeholder="5"
                        />
                        <span className="font-bold text-slate-500">downloads per customer</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Access Duration Selection */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Access Duration <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Controls how long customer has entitlement access from purchase date</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-bold transition-all ${accessDurationType === 'LIFETIME' ? 'bg-primary/10 border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="accDurType"
                        checked={accessDurationType === 'LIFETIME'}
                        onChange={() => setAccessDurationType('LIFETIME')}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      Lifetime Access (Never Expires)
                    </label>
                    <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer font-bold transition-all ${accessDurationType === 'LIMITED' ? 'bg-primary/10 border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="accDurType"
                        checked={accessDurationType === 'LIMITED'}
                        onChange={() => setAccessDurationType('LIMITED')}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      Limited Access Duration
                    </label>
                    {accessDurationType === 'LIMITED' && (
                      <div className="flex items-center gap-2 pl-2">
                        <input
                          type="number"
                          min="1"
                          value={accessDurationDaysCount}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setAccessDurationDaysCount('');
                            } else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 1) setAccessDurationDaysCount(num.toString());
                            }
                          }}
                          onBlur={() => {
                            if (!accessDurationDaysCount || parseInt(accessDurationDaysCount, 10) < 1) {
                              setAccessDurationDaysCount('365');
                            }
                          }}
                          className="w-28 px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-black text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                          placeholder="365"
                        />
                        <span className="font-bold text-slate-500">days from order completion</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Token Lifetime & Active Tokens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Secure Token Lifetime (Link Expiry)
                    </label>
                    <p className="text-[11px] text-slate-400">Signed temporary download links expire after this duration</p>
                    <select
                      value={tokenDurationMinutes}
                      onChange={(e) => setTokenDurationMinutes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                    >
                      <option value="5">5 Minutes</option>
                      <option value="10">10 Minutes</option>
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes (Standard)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Max Concurrent Active Tokens
                    </label>
                    <p className="text-[11px] text-slate-400">Limits concurrent active download links per customer to mitigate sharing</p>
                    <input
                      type="number"
                      min="1"
                      value={maxActiveTokens}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setMaxActiveTokens('');
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 1) setMaxActiveTokens(num.toString());
                        }
                      }}
                      onBlur={() => {
                        if (!maxActiveTokens || parseInt(maxActiveTokens, 10) < 1) {
                          setMaxActiveTokens('3');
                        }
                      }}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                      placeholder="3"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 7: LICENCE */}
          {/* ========================================================================= */}
          {currentStepIndex === 6 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <ShieldCheck size={14} /> Stage 7: Licence Configuration
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Licence Scope & Activations</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Determine if a personal licence key or registration is required for this product.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Licence Required Toggle */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Licence Key Required? <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="licReq"
                        checked={!licenceKeyRequired}
                        onChange={() => setLicenceKeyRequired(false)}
                        className="w-4 h-4 text-primary"
                      />
                      ○ No (Licence Not Required)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="licReq"
                        checked={licenceKeyRequired}
                        onChange={() => setLicenceKeyRequired(true)}
                        className="w-4 h-4 text-primary"
                      />
                      ○ Yes (Require Generated Licence Key)
                    </label>
                  </div>
                </div>

                {!licenceKeyRequired ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 font-bold">
                    <CheckCircle2 size={16} />
                    <span>✓ Licence Key Not Required for this digital download.</span>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Licence Type
                        </label>
                        <select
                          value={licenceType}
                          onChange={(e) => setLicenceType(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <option value="PERSONAL">Personal Licence (Default)</option>
                          <option value="COMMERCIAL">Commercial Licence</option>
                          <option value="EXTENDED">Extended Agency Licence</option>
                          <option value="RESELLER">Reseller Licence</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Activation Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={activationLimit}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setActivationLimit('');
                            } else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 1) setActivationLimit(num.toString());
                            }
                          }}
                          onBlur={() => {
                            if (!activationLimit || parseInt(activationLimit, 10) < 1) {
                              setActivationLimit('1');
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Allowed Domains
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={domainLimit}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setDomainLimit('');
                            } else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 1) setDomainLimit(num.toString());
                            }
                          }}
                          onBlur={() => {
                            if (!domainLimit || parseInt(domainLimit, 10) < 1) {
                              setDomainLimit('1');
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Customer Licence Terms (Printed on Invoice)
                      </label>
                      <textarea
                        value={licenceTerms}
                        onChange={(e) => setLicenceTerms(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 8: CONTENT & FAQS */}
          {/* ========================================================================= */}
          {currentStepIndex === 7 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Sparkles size={14} /> Stage 8: Storefront Content & FAQs
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Structured Content & Deliverables</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Deliverables breakdown, software prerequisites, and product-specific FAQ accordion.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* What's Included dynamic list */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    What's Included / Key Deliverables
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {whatsIncludedList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">✓ {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWhatsIncluded(idx)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWhatsIncludedItem}
                      onChange={(e) => setNewWhatsIncludedItem(e.target.value)}
                      placeholder="e.g. 50+ Custom Figma Components..."
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddWhatsIncluded}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Software Required / Prerequisites
                    </label>
                    <input
                      type="text"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="e.g. Free Canva Account, Figma, or Chrome"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Version (e.g. v2.1.0)
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="v1.0.0"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* FAQs */}
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
                        <button type="button" onClick={() => handleRemoveFaq(idx)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
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
                    <button type="button" onClick={handleAddFaq} className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer">
                      + Add FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 9: SEO & SOCIAL PREVIEW */}
          {/* ========================================================================= */}
          {currentStepIndex === 8 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <Globe size={14} /> Stage 9: SEO & Social Preview
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Search Engine & Social Metadata</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Google search snippet simulation and OpenGraph preview.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Google Search Preview Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Google Search Preview</span>
                  <h4 className="text-blue-700 font-bold text-sm hover:underline cursor-pointer">
                    {seoTitle || name || 'Product Title'} — Kanishk Digital World
                  </h4>
                  <span className="text-emerald-700 text-[11px] block font-mono">
                    https://kanishkdigitalworld.com{effectivePrefix}{slug || 'url-slug'}
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

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Meta Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="canva templates, digital assets, agency kit"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 10: REVIEW & PUBLISH */}
          {/* ========================================================================= */}
          {currentStepIndex === 9 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-2">
                  <CheckCircle2 size={14} /> Stage 10: Final Review & Pre-Publish Audit
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Final Verification Gate</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Audit all 10 stages before publishing live to the storefront. Click any stage with an error to navigate directly.
                </p>
              </div>

              {/* Stage-by-Stage Audit Cards */}
              <div className="space-y-2">
                {stageAudits.audits.map((stage) => (
                  <div
                    key={stage.stepIdx}
                    onClick={() => setCurrentStepIndex(stage.stepIdx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      stage.pass
                        ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                        : 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {stage.pass ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-rose-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          Stage {stage.stepIdx + 1}: {stage.title}
                        </span>
                        {!stage.pass && (
                          <span className="text-[11px] text-rose-700 font-medium block mt-0.5">
                            ✕ {stage.error}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      stage.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {stage.pass ? '✓ Ready' : 'Fix Stage'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promotional Status Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Featured & Promotional Badges</span>
                    <span className="text-[11px] text-slate-500">Enable homepage promotion and catalog badges.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50">
                    <input 
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500/20"
                    />
                    <span className="text-amber-800">★ Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50">
                    <input 
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                    />
                    <span className="text-purple-800">Best Seller</span>
                  </label>
                </div>
              </div>

              {/* Publication Action Footer */}
              <div className="p-5 bg-sky-50 border border-sky-200 text-slate-900 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div>
                  <span className="text-xs text-sky-700 font-bold uppercase tracking-wider">Storefront Readiness</span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                    {completeness}% Ready {stageAudits.allPreviousPassed ? '— Ready to Publish!' : '— Incomplete'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSaveProduct('DRAFT')}
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    Save Draft
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
                onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveProduct('PUBLISHED')}
                disabled={isSaving || !stageAudits.allPreviousPassed}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-2"
              >
                <CheckCircle2 size={15} /> Complete & Publish Live
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-primary block">
                    {productCode || 'KDW-P-AUTO'}
                  </span>
                  {isFeatured && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                      ★ Featured
                    </span>
                  )}
                  {isBestSeller && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                      Best Seller
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 text-xs mt-0.5 line-clamp-1">
                  {name || 'Untitled Digital Product'}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {formatCurrency(pricingSummary.customerPays)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block">
                      {taxMode === 'EXEMPT' || activeTaxRate === 0 ? '0% Tax' : taxMode === 'INCLUSIVE' ? 'Incl. GST' : '+ GST'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-600 block truncate max-w-[120px]">
                      {stageAudits.orgLabel || 'Unassigned'}
                    </span>
                    <span className="text-[9px] text-primary font-bold block">
                      {placementType === 'PRIMARY' ? 'Primary' : 'Subcategory'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkpoints Audit List */}
            <div className="space-y-1.5 text-xs">
              {stageAudits.audits.map((stage) => (
                <div 
                  key={stage.stepIdx} 
                  onClick={() => setCurrentStepIndex(stage.stepIdx)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-slate-700 text-[11px] truncate max-w-[150px]">
                    {stage.stepIdx + 1}. {stage.title}
                  </span>
                  <span className={`text-[10px] font-bold ${stage.pass ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {stage.pass ? '✓ Ready' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE PRIMARY CATEGORY */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-primary">
                <FolderPlus size={20} />
                <h3 className="text-lg font-black text-slate-900">Create Primary Category</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateCategoryModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (!newCategorySlug) setNewCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  placeholder="e.g. Website Templates"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">URL Slug</label>
                <input
                  type="text"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  placeholder="website-templates"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Overview of this primary category..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateCategoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePrimaryCategory}
                disabled={isCreatingCategory}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isCreatingCategory ? <Loader2 size={13} className="animate-spin" /> : <FolderPlus size={13} />}
                Create Primary Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SUBCATEGORY (ALWAYS ACCESSIBLE WITH PRIMARY PARENT SELECTOR) */}
      {showCreateSubcategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-primary">
                <FolderPlus size={20} />
                <h3 className="text-lg font-black text-slate-900">Create Subcategory</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateSubcategoryModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Primary Parent Category Selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Parent Primary Category <span className="text-rose-500">*</span>
                </label>
                {primaryCategories.length > 0 ? (
                  <select
                    value={subcatParentId || selectedPrimaryCategoryId}
                    onChange={(e) => setSubcatParentId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {primaryCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    Please create a Primary Category first before adding subcategories.
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  value={newSubcatName}
                  onChange={(e) => {
                    setNewSubcatName(e.target.value);
                    if (!newSubcatSlug) setNewSubcatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  placeholder="e.g. Landing Pages, Icon Packs, 3D Assets"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">URL Slug</label>
                <input
                  type="text"
                  value={newSubcatSlug}
                  onChange={(e) => setNewSubcatSlug(e.target.value)}
                  placeholder="landing-pages"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={newSubcatDesc}
                  onChange={(e) => setNewSubcatDesc(e.target.value)}
                  placeholder="Overview of this subcategory..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateSubcategoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubcategory}
                disabled={isCreatingSubcategory || primaryCategories.length === 0}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingSubcategory ? <Loader2 size={13} className="animate-spin" /> : <FolderPlus size={13} />}
                Create Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE PUBLICATION MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-blue-50/50">
              <div className="flex items-center gap-2.5 text-blue-700">
                <Calendar size={20} />
                <h3 className="text-lg font-black text-slate-900">Schedule Publication</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Choose the date & time when "{name || 'this product'}" will automatically go live.
              </p>
            </div>

            <div className="p-6 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Publication Date & Time (IST)</label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-slate-400">
                Indian Standard Time (IST). The system automatically publishes when the scheduled timestamp arrives.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!scheduledDateTime) {
                    toast.error('Please select a date & time');
                    return;
                  }
                  setShowScheduleModal(false);
                  handleSaveProduct('SCHEDULED', scheduledDateTime);
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
