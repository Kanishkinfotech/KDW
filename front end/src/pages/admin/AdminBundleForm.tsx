import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon, Search, UploadCloud, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/uploadImage';

export default function AdminBundleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discount: 0,
    coverImage: '',
    status: 'ACTIVE',
    featured: false,
    productIds: [] as string[]
  });

  useEffect(() => {
    fetchProducts();
    if (isEditing) {
      fetchBundle();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchBundle = async () => {
    try {
      const res = await axios.get(`/api/bundles/${id}`);
      if (res.data.success) {
        const b = res.data.data;
        setFormData({
          title: b.title || '',
          slug: b.slug || '',
          description: b.description || '',
          price: b.price || 0,
          originalPrice: b.originalPrice || 0,
          discount: b.discount || 0,
          coverImage: b.coverImage || '',
          status: b.status || 'ACTIVE',
          featured: b.featured || false,
          productIds: b.products ? b.products.map((p: any) => p.id) : []
        });
      }
    } catch (error) {
      toast.error('Failed to load bundle');
      navigate('/admin/bundles');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'price') {
      const newPrice = parseFloat(value) || 0;
      setFormData(prev => ({ 
        ...prev, 
        price: newPrice,
        discount: prev.originalPrice > newPrice ? prev.originalPrice - newPrice : 0
      }));
    } else if (name === 'originalPrice') {
      const newOriginalPrice = parseFloat(value) || 0;
      setFormData(prev => ({ 
        ...prev, 
        originalPrice: newOriginalPrice,
        discount: newOriginalPrice > prev.price ? newOriginalPrice - prev.price : 0
      }));
    } else if (name === 'discount') {
      setFormData(prev => ({ ...prev, discount: parseFloat(value) || 0 }));
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
          setFormData(prev => ({ ...prev, coverImage: url }));
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

  const handleProductToggle = (productId: string) => {
    setFormData(prev => {
      const isSelected = prev.productIds.includes(productId);
      const newProductIds = isSelected 
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId];
        
      // Auto-calculate original price
      let newOriginalPrice = 0;
      newProductIds.forEach(id => {
        const product = products.find(p => p.id === id);
        if (product) newOriginalPrice += product.price || 0;
      });
      
      const newDiscount = newOriginalPrice - prev.price;
      
      return {
        ...prev,
        productIds: newProductIds,
        originalPrice: newOriginalPrice,
        discount: newDiscount > 0 ? newDiscount : 0
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { withCredentials: true };
      
      const payload = { ...formData, itemsIncluded: formData.productIds.length };
      
      if (isEditing) {
        await axios.put(`/api/bundles/${id}`, payload, config);
        toast.success('Bundle updated successfully');
      } else {
        await axios.post('/api/bundles', payload, config);
        toast.success('Bundle created successfully');
      }
      navigate('/admin/bundles');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update bundle' : 'Failed to create bundle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/bundles')}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isEditing ? 'Edit Bundle' : 'Create New Bundle'}
            </h1>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isEditing ? 'Save Changes' : 'Create Bundle'}
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Info</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Bundle Title</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">URL Slug</label>
              <input 
                type="text" 
                name="slug" 
                value={formData.slug} 
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cover Image</label>
              <label className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden h-32">
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleCoverImageChange} disabled={isUploading} />
                {formData.coverImage ? (
                  <>
                    <img src={formData.coverImage} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="text-white animate-spin" size={32} />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <UploadCloud size={24} className="text-slate-400 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Click to upload image</p>
                  </>
                )}
              </label>
            </div>
            <div className="space-y-2 flex flex-col justify-end">
               <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl bg-slate-50">
                <input 
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
                <span className="font-bold text-slate-700">Feature on Homepage</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Pricing</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sale Price (₹)</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Original Price (₹)</label>
              <input 
                type="number" 
                name="originalPrice" 
                value={formData.originalPrice} 
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Discount Label (₹ OFF)</label>
              <input 
                type="number" 
                name="discount" 
                value={formData.discount} 
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-slate-900">Included Products</h2>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {formData.productIds.length} Selected
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(product => {
              const isSelected = formData.productIds.includes(product.id);
              return (
                <label 
                  key={product.id}
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleProductToggle(product.id)}
                      className="w-5 h-5 rounded text-primary focus:ring-primary"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 m-2.5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-900'}`}>{product.name}</div>
                        <div className="text-xs text-slate-500">₹{product.price}</div>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}

