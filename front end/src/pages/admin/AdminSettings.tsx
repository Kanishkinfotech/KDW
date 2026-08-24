import { useState, useEffect } from 'react';
import { Settings, Save, Store, CreditCard, Truck, Link as LinkIcon, Lock } from 'lucide-react';
import Button from '../../components/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface SettingItem {
  key: string;
  value: any;
  group: string;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, any>>({
    store_name: 'Kanishk Digital World',
    support_email: '',
    support_phone: '',
    store_address: '',
    
    razorpay_key_id: '',
    razorpay_key_secret: '',
    currency: 'INR',
    tax_rate: '0',
    
    default_shipping_cost: '0',
    free_shipping_threshold: '500',
    
    facebook_url: '',
    instagram_url: '',
    twitter_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success && res.data.data.length > 0) {
          const fetched: Record<string, any> = { ...settings };
          res.data.data.forEach((s: SettingItem) => {
            fetched[s.key] = s.value;
          });
          setSettings(fetched);
        }
      } catch (_err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    // Frontend Validation
    if (settings.support_email) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\.[^\\s@]+$/;
      if (!emailRegex.test(settings.support_email)) {
        toast.error('Please enter a valid support email.');
        return;
      }
    }
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\\w \.-]*)*\/?$/;
    if (settings.facebook_url && !urlRegex.test(settings.facebook_url)) {
      toast.error('Please enter a valid Facebook URL.');
      return;
    }
    if (settings.instagram_url && !urlRegex.test(settings.instagram_url)) {
      toast.error('Please enter a valid Instagram URL.');
      return;
    }
    if (settings.twitter_url && !urlRegex.test(settings.twitter_url)) {
      toast.error('Please enter a valid Twitter URL.');
      return;
    }

    setSaving(true);
    try {
      const updates = [
        { key: 'store_name', value: settings.store_name, group: 'general' },
        { key: 'support_email', value: settings.support_email, group: 'general' },
        { key: 'store_address', value: settings.store_address, group: 'general' },
        
        { key: 'razorpay_key_id', value: settings.razorpay_key_id, group: 'payment' },
        { key: 'razorpay_key_secret', value: settings.razorpay_key_secret, group: 'payment' },
        { key: 'currency', value: settings.currency, group: 'payment' },
        { key: 'tax_rate', value: settings.tax_rate, group: 'payment' },
        
        { key: 'facebook_url', value: settings.facebook_url, group: 'social' },
        { key: 'instagram_url', value: settings.instagram_url, group: 'social' },
        { key: 'twitter_url', value: settings.twitter_url, group: 'social' },
      ];

      const res = await axios.put('/api/admin/settings', updates, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const tabs = [
    { id: 'general', label: 'General', icon: <Store size={18} /> },
    { id: 'payment', label: 'Payment API', icon: <CreditCard size={18} /> },
    { id: 'social', label: 'Social Links', icon: <LinkIcon size={18} /> },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-primary" />
            Global Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">Configure global platform settings, API keys, and business details.</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="flex items-center gap-2">
          <Save size={18} />
          Save Changes
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-bold border-b border-slate-100 last:border-0 transition-colors ${
                  activeTab === tab.id ? 'bg-primary/5 text-primary border-r-2 border-r-primary' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[500px]">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Store Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Store Name</label>
                  <input type="text" value={settings.store_name} onChange={e => handleChange('store_name', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Support Email</label>
                  <input type="email" value={settings.support_email} onChange={e => handleChange('support_email', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" placeholder="support@yourstore.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Business Address</label>
                  <textarea rows={3} value={settings.store_address} onChange={e => handleChange('store_address', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary resize-none" placeholder="123 Commerce St..." />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <h2 className="text-lg font-bold text-slate-900">Razorpay Integration</h2>
                <Lock size={16} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 mb-4">Enter your Razorpay API keys to process real payments securely.</p>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Key ID</label>
                  <input type="text" value={settings.razorpay_key_id} onChange={e => handleChange('razorpay_key_id', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" placeholder="rzp_test_..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Key Secret</label>
                  <input type="password" value={settings.razorpay_key_secret} onChange={e => handleChange('razorpay_key_secret', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" placeholder="••••••••••••••••" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">Pricing Display</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Base Currency</label>
                  <select value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Default Tax Rate (%)</label>
                  <input type="number" value={settings.tax_rate} onChange={e => handleChange('tax_rate', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}


          {activeTab === 'social' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Social Media Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Facebook URL</label>
                  <input type="url" value={settings.facebook_url} onChange={e => handleChange('facebook_url', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Instagram URL</label>
                  <input type="url" value={settings.instagram_url} onChange={e => handleChange('instagram_url', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Twitter (X) URL</label>
                  <input type="url" value={settings.twitter_url} onChange={e => handleChange('twitter_url', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary" placeholder="https://twitter.com/..." />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
