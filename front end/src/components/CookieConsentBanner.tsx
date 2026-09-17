import React, { useState, useEffect, useCallback } from 'react';
import { Cookie, X, Settings2, ShieldCheck, Check, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface PrivacySettings {
  enable_cookie_banner?: boolean;
  cookie_banner_position?: 'BOTTOM_RIGHT' | 'BOTTOM_FULL' | 'CENTER_MODAL';
  require_explicit_cookie_consent?: boolean;
  allow_customer_data_export?: boolean;
  allow_customer_account_deletion?: boolean;
}

interface CookieConsentData {
  status: 'ACCEPTED_ALL' | 'REJECTED_ALL' | 'CUSTOM';
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hasStoredConsent, setHasStoredConsent] = useState(false);

  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const fetchSettingsAndCheckConsent = useCallback(async (forceOpen = false) => {
    try {
      const res = await fetch(`/api/settings/public?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data) {
        const pubSettings: PrivacySettings = data.data;
        setSettings(pubSettings);

        const raw = localStorage.getItem('kwd_cookie_consent');
        if (raw) {
          setHasStoredConsent(true);
          try {
            const parsed: CookieConsentData = JSON.parse(raw);
            setAnalyticsConsent(Boolean(parsed.analytics));
            setMarketingConsent(Boolean(parsed.marketing));
          } catch (e) {}

          if (forceOpen) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } else {
          setHasStoredConsent(false);
          // If enabled, show banner
          if (pubSettings.enable_cookie_banner !== false) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        }
      }
    } catch (err) {
      console.error('Error loading cookie settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettingsAndCheckConsent();

    const handleSettingsUpdated = () => {
      fetchSettingsAndCheckConsent();
    };

    const handleOpenCookieSettings = () => {
      fetchSettingsAndCheckConsent(true);
      setShowPreferences(false);
    };

    window.addEventListener('kdw:settings-updated', handleSettingsUpdated);
    window.addEventListener('kdw:open-cookie-settings', handleOpenCookieSettings);
    window.addEventListener('storage', handleSettingsUpdated);

    return () => {
      window.removeEventListener('kdw:settings-updated', handleSettingsUpdated);
      window.removeEventListener('kdw:open-cookie-settings', handleOpenCookieSettings);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, [fetchSettingsAndCheckConsent]);

  const saveConsent = (consent: CookieConsentData, message: string) => {
    localStorage.setItem('kwd_cookie_consent', JSON.stringify(consent));
    setHasStoredConsent(true);
    setAnalyticsConsent(consent.analytics);
    setMarketingConsent(consent.marketing);
    setIsVisible(false);
    setShowPreferences(false);

    // Broadcast event for any tracking, analytics, or UI components
    window.dispatchEvent(new CustomEvent('kdw:cookie-consent-updated', { detail: consent }));
    toast.success(message, { id: 'cookie-toast', icon: '🍪' });
  };

  const handleAcceptAll = () => {
    const consent: CookieConsentData = {
      status: 'ACCEPTED_ALL',
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent, 'All cookies accepted.');
  };

  const handleRejectAll = () => {
    const consent: CookieConsentData = {
      status: 'REJECTED_ALL',
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent, 'Non-essential cookies declined.');
  };

  const handleSavePreferences = () => {
    const consent: CookieConsentData = {
      status: 'CUSTOM',
      essential: true,
      analytics: analyticsConsent,
      marketing: marketingConsent,
      timestamp: new Date().toISOString()
    };
    saveConsent(consent, 'Cookie preferences saved.');
  };

  // If cookie banner is disabled in admin settings, do not render anything
  if (settings && settings.enable_cookie_banner === false) {
    return null;
  }

  // Position
  const position = settings?.cookie_banner_position || 'BOTTOM_RIGHT';

  return (
    <>
      {/* 1. Floating Cookie Settings Reopen Badge (visible when banner is closed) */}
      {!isVisible && hasStoredConsent && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(true);
            setShowPreferences(false);
          }}
          className="fixed bottom-4 left-4 z-40 p-2.5 bg-white/95 hover:bg-white text-slate-700 hover:text-[#5b21b6] rounded-full shadow-lg border border-slate-200/80 transition-all transform hover:scale-105 group flex items-center gap-2 text-xs font-semibold backdrop-blur-xs"
          title="Cookie & Privacy Preferences"
          aria-label="Manage cookie preferences"
        >
          <div className="p-1 bg-amber-100/80 text-amber-800 rounded-full">
            <Cookie className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline pr-1 text-[11px] text-slate-600 group-hover:text-slate-900">Cookies</span>
        </button>
      )}

      {/* 2. Banner / Modal Display */}
      {isVisible && (
        <>
          {/* OPTION A: CENTER MODAL OVERLAY */}
          {position === 'CENTER_MODAL' && (
            <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
                      <Cookie className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-slate-900">Cookie & Privacy Consent</h3>
                      <p className="text-xs text-slate-500">Manage your cookie and data preferences</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRejectAll}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                    title="Decline & Close"
                    aria-label="Close banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  We use cookies and related telemetry to ensure secure checkout, authenticate your digital downloads, and optimize our digital marketplace performance. You can accept all or reject non-essential cookies at any time. Review our{' '}
                  <Link to="/privacy" className="text-[#5b21b6] font-semibold underline hover:text-[#4c1d95]">
                    Privacy Policy
                  </Link>.
                </p>

                {showPreferences && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800 block">Strictly Necessary Cookies</span>
                        <span className="text-[11px] text-slate-500">Required for checkout, security, and digital delivery access.</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                        Always Active
                      </span>
                    </div>

                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition">
                      <div>
                        <span className="font-bold text-slate-800 block">Analytics & Performance Cookies</span>
                        <span className="text-[11px] text-slate-500">Helps us monitor site speed, download integrity, and error telemetry.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={analyticsConsent}
                        onChange={e => setAnalyticsConsent(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition">
                      <div>
                        <span className="font-bold text-slate-800 block">Marketing & Product Recommendations</span>
                        <span className="text-[11px] text-slate-500">Personalized product bundles, release updates, and offers.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={e => setMarketingConsent(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </label>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPreferences(!showPreferences)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition underline order-last sm:order-first"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {showPreferences ? 'Hide Options' : 'Customize Options'}
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {showPreferences ? (
                      <button
                        type="button"
                        onClick={handleSavePreferences}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Save Preferences
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleRejectAll}
                          className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                          Reject All
                        </button>
                        <button
                          type="button"
                          onClick={handleAcceptAll}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          Accept All Cookies
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION B: FULL-WIDTH BOTTOM BANNER */}
          {position === 'BOTTOM_FULL' && (
            <aside
              aria-label="Cookie consent banner"
              className="fixed bottom-0 inset-x-0 z-[9999] bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 text-white shadow-2xl animate-in slide-in-from-bottom duration-300"
            >
              <div className="max-w-7xl mx-auto space-y-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                      <Cookie className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Cookie & Privacy Preferences</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                        We use essential cookies to keep your digital purchases secure and optional cookies to optimize store analytics. You can accept all or reject non-essential cookies. Review our{' '}
                        <Link to="/privacy" className="text-amber-400 underline hover:text-amber-300 font-semibold">
                          Privacy Policy
                        </Link>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowPreferences(!showPreferences)}
                      className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white underline transition"
                    >
                      {showPreferences ? 'Hide Options' : 'Customize'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectAll}
                      className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 rounded-xl transition"
                    >
                      Reject All
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptAll}
                      className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition"
                    >
                      Accept All Cookies
                    </button>
                  </div>
                </div>

                {showPreferences && (
                  <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-3">
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Strictly Necessary</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Always Active
                      </span>
                    </div>

                    <label className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition">
                      <span className="text-slate-300 font-medium">Analytics Cookies</span>
                      <input
                        type="checkbox"
                        checked={analyticsConsent}
                        onChange={e => setAnalyticsConsent(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <label className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition">
                      <span className="text-slate-300 font-medium">Marketing Cookies</span>
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={e => setMarketingConsent(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSavePreferences}
                        className="px-4 py-1.5 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* OPTION C: FLOATING BOTTOM RIGHT CARD (DEFAULT) */}
          {position === 'BOTTOM_RIGHT' && (
            <aside
              aria-label="Cookie consent banner"
              className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] sm:w-full bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-5 text-slate-900 space-y-4 animate-in slide-in-from-bottom-5 duration-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <Cookie className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-slate-900 leading-tight">Cookie & Privacy Choices</h3>
                    <p className="text-[11px] text-slate-500">We value your privacy on our digital store</p>
                  </div>
                </div>
                <button
                  onClick={handleRejectAll}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                  title="Decline & Close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                We use cookies to secure your downloads, keep you logged in, and analyze performance. You can accept all or reject non-essential cookies. Review our{' '}
                <Link to="/privacy" className="text-[#5b21b6] font-semibold underline hover:text-[#4c1d95]">
                  Privacy Policy
                </Link>.
              </p>

              {showPreferences && (
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Strictly Necessary</span>
                      <span className="text-[10px] text-slate-500">Authentication & Order delivery</span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Required
                    </span>
                  </div>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Analytics & Performance</span>
                      <span className="text-[10px] text-slate-500">Platform stability & download telemetry</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={analyticsConsent}
                      onChange={e => setAnalyticsConsent(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Marketing & Recommendations</span>
                      <span className="text-[10px] text-slate-500">Product releases & special offers</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={e => setMarketingConsent(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition underline"
                >
                  {showPreferences ? 'Done' : 'Preferences'}
                </button>

                <div className="flex items-center gap-2">
                  {showPreferences ? (
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-xs"
                    >
                      Save
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleRejectAll}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
                      >
                        Reject All
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptAll}
                        className="px-3.5 py-1.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Accept All
                      </button>
                    </>
                  )}
                </div>
              </div>
            </aside>
          )}
        </>
      )}
    </>
  );
}

