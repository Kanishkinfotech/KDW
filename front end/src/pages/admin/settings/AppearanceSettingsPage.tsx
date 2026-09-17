import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';
import { Palette, Eye, Sparkles, Save, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AppearanceSettingsPage() {
  const [showFeatured, setShowFeatured] = useState(true);
  const [accentSystem, setAccentSystem] = useState('violet');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/settings/public');
      if (res.data?.success && res.data.data) {
        if (res.data.data.show_featured_collection !== undefined) {
          setShowFeatured(res.data.data.show_featured_collection === 'true' || res.data.data.show_featured_collection === true);
        }
        if (res.data.data.store_accent_system) {
          setAccentSystem(res.data.data.store_accent_system);
        }
      }
    } catch (err) {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.post('/api/admin/settings', {
        settings: {
          show_featured_collection: String(showFeatured),
          store_accent_system: accentSystem
        }
      }, { withCredentials: true });
      toast.success('Appearance settings saved');
      window.dispatchEvent(new CustomEvent('kdw:settings-updated'));
      try {
        localStorage.setItem('kdw_settings_updated', Date.now().toString());
      } catch (e) {}
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save appearance settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Appearance & Storefront Design"
      subtitle="Configure visual merchandising, category display visibility, and brand accent themes."
      onSave={handleSave}
      isSaving={isSaving}
      onRefresh={fetchSettings}
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Show Featured Collection */}
        <div className="kdw-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                MERCHANDISING
              </span>
            </div>

            <div>
              <h3 className="text-base font-serif font-bold text-[#171325]">
                Show featured collection
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">
                Controls whether the curated 4-item product band is displayed on the primary customer homepage.
              </p>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeatured}
                  onChange={e => setShowFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#5b21b6] rounded border-slate-300 focus:ring-[#5b21b6]"
                />
                <span className="text-xs font-medium text-slate-700 font-sans">
                  Enable featured collection band
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-semibold font-sans transition-colors kdw-button-press"
            >
              Save Pill
            </button>
          </div>
        </div>

        {/* Card 2: Store Accent System */}
        <div className="kdw-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                THEME ACCENT
              </span>
            </div>

            <div>
              <h3 className="text-base font-serif font-bold text-[#171325]">
                Store accent system
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">
                Select the primary visual accent system applied to buttons, badges, chips, and focal graphics.
              </p>
            </div>

            <div className="pt-2">
              <select
                value={accentSystem}
                onChange={e => setAccentSystem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans text-slate-800 focus:outline-none focus:border-[#5b21b6]"
              >
                <option value="violet">KDW Royal Violet (#5b21b6 / #ede9fe)</option>
                <option value="indigo">Deep Indigo (#4338ca / #e0e7ff)</option>
                <option value="plum">Classic Plum (#3b0764 / #f3e8ff)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-semibold font-sans transition-colors kdw-button-press"
            >
              Save Pill
            </button>
          </div>
        </div>

      </div>
    </SettingsLayout>
  );
}
