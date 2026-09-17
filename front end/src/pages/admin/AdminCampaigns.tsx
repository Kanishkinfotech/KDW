import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Mail, Send, Plus, Search, Filter, RefreshCw, Download, CheckCircle, Clock,
  AlertTriangle, Play, Pause, FileText, ChevronRight, Eye, Edit,
  TrendingUp, Users, MessageSquare, Sparkles, CheckSquare, X,
  Trash2, MousePointer, ExternalLink, BarChart3, UserCheck
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminCampaigns() {
  const location = useLocation();
  const isEmailOnly = location.pathname.endsWith('/email');
  const isWhatsAppOnly = location.pathname.endsWith('/whatsapp');

  // Navigation Sub-Views
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'DRAFTS' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'EMAIL' | 'WHATSAPP' | 'PRODUCT_LAUNCH' | 'ABANDONED_CHECKOUT' | 'PRODUCT_UPDATES' | 'REVIEW_REQUESTS' | 'REPORTS'
  >('ALL');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalCampaigns: 0,
    runningCampaigns: 0,
    scheduledCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Multi-Step Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1); // 1: Info & Audience, 2: Content & Template, 3: Test & Launch
  const [audiencePreview, setAudiencePreview] = useState<{ totalEligible: number; suppressedCount: number } | null>(null);

  // Sender Email Presets
  const SENDER_PRESETS = [
    { id: 'support', label: 'Customer Support (support@kdw.in)', email: 'support@kdw.in', name: 'KDW Support Team' },
    { id: 'sales', label: 'Sales & Offers (sales@kdw.in)', email: 'sales@kdw.in', name: 'KDW Deals & Offers' },
    { id: 'info', label: 'Announcements & Updates (info@kdw.in)', email: 'info@kdw.in', name: 'KDW Digital World' },
    { id: 'newsletter', label: 'Newsletter (newsletter@kdw.in)', email: 'newsletter@kdw.in', name: 'KDW Weekly Digest' },
    { id: 'custom', label: 'Custom Sender Email (Type your own below)', email: '', name: '' }
  ];
  const [selectedSenderPreset, setSelectedSenderPreset] = useState('support');

  // Sender WhatsApp Phone Presets
  const SENDER_PHONE_PRESETS = [
    { id: 'wa_support', label: 'Official WhatsApp Support (+91 98765 43210)', phone: '+91 98765 43210', name: 'KDW Official Support' },
    { id: 'wa_sales', label: 'Deals & Offers WhatsApp (+91 98765 43211)', phone: '+91 98765 43211', name: 'KDW Deals & Offers' },
    { id: 'wa_updates', label: 'Order & Account Updates (+91 98765 43212)', phone: '+91 98765 43212', name: 'KDW Order Updates' },
    { id: 'custom', label: 'Custom WhatsApp Business Number (Type your own below)', phone: '', name: '' }
  ];
  const [selectedPhonePreset, setSelectedPhonePreset] = useState('wa_support');

  const handleSelectSenderPreset = (presetId: string) => {
    setSelectedSenderPreset(presetId);
    const found = SENDER_PRESETS.find(p => p.id === presetId);
    if (found && presetId !== 'custom') {
      setFormData(prev => ({
        ...prev,
        senderEmail: found.email,
        emailFromName: found.name,
        emailReplyTo: found.email
      }));
    }
  };

  const handleSelectPhonePreset = (presetId: string) => {
    setSelectedPhonePreset(presetId);
    const found = SENDER_PHONE_PRESETS.find(p => p.id === presetId);
    if (found && presetId !== 'custom') {
      setFormData(prev => ({
        ...prev,
        senderPhone: found.phone,
        whatsAppSenderName: found.name
      }));
    }
  };

  // Recipient Drilldown & Campaign Report Modal State
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [selectedCampaignForReport, setSelectedCampaignForReport] = useState<any | null>(null);
  const [recipientLogs, setRecipientLogs] = useState<any[]>([]);
  const [recipientSummary, setRecipientSummary] = useState<{
    totalRecipients: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    converted: number;
    failed: number;
    unread: number;
  }>({ totalRecipients: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, converted: 0, failed: 0, unread: 0 });
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'OPENED' | 'UNREAD' | 'CLICKED' | 'REPLIED' | 'CONVERTED' | 'FAILED'>('ALL');
  const [recipientSearch, setRecipientSearch] = useState('');

  // Test Dispatches State
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testMobileNumber, setTestMobileNumber] = useState('+91 98765 43210');
  const [sendingTest, setSendingTest] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'SALE_CAMPAIGN',
    channel: isWhatsAppOnly ? 'WHATSAPP' : 'EMAIL',
    audienceSegment: 'VERIFIED_CUSTOMERS',
    utmCampaign: '',
    emailSubject: '',
    emailPreviewText: '',
    emailFromName: 'KDW Support Team',
    senderEmail: 'support@kdw.in',
    senderPhone: '+91 98765 43210',
    whatsAppSenderName: 'KDW Official Support',
    emailReplyTo: 'support@kdw.in',
    emailBodyHtml: '<p>Hi {{customer.first_name}},</p><p>We have an exclusive offer for you!</p><p>Use code: <strong>{{coupon.code}}</strong> at checkout.</p>',
    emailBodyPlain: 'Hi {{customer.first_name}}, We have an exclusive update from KDW! Use code {{coupon.code}} to get an instant discount. Store link: {{storefront.url}}',
    whatsAppTemplateName: 'kdw_customer_deal_v1',
    whatsAppLanguage: 'en',
    startAt: '',
    endAt: '',
    status: 'DRAFT'
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('adminAuth')}`
  });

  const fetchCampaignsData = async () => {
    try {
      setLoading(true);
      const targetChannel = isEmailOnly ? 'EMAIL' :
                            isWhatsAppOnly ? 'WHATSAPP' :
                            (activeTab === 'EMAIL' ? 'EMAIL' : activeTab === 'WHATSAPP' ? 'WHATSAPP' : channelFilter);

      const res = await axios.get('/api/admin/campaigns', {
        headers: getHeaders(),
        params: {
          status: activeTab === 'DRAFTS' ? 'DRAFT' :
                  activeTab === 'SCHEDULED' ? 'SCHEDULED' :
                  activeTab === 'RUNNING' ? 'RUNNING' :
                  activeTab === 'COMPLETED' ? 'COMPLETED' : 'ALL',
          channel: targetChannel,
          campaignType: activeTab === 'PRODUCT_LAUNCH' ? 'PRODUCT_LAUNCH' :
                        activeTab === 'ABANDONED_CHECKOUT' ? 'ABANDONED_CHECKOUT' :
                        activeTab === 'PRODUCT_UPDATES' ? 'PRODUCT_UPDATE' :
                        activeTab === 'REVIEW_REQUESTS' ? 'REVIEW_REQUEST' : 'ALL',
          search: searchTerm
        }
      });
      if (res.data.success) {
        // Ensure no duplicate campaigns in list
        const raw = res.data.campaigns || [];
        const seen = new Set();
        const unique = raw.filter((c: any) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
        setCampaigns(unique);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEmailOnly && activeTab === 'SCHEDULED') {
      setActiveTab('ALL');
    }
  }, [isEmailOnly, activeTab]);

  useEffect(() => {
    fetchCampaignsData();
  }, [activeTab, channelFilter, searchTerm, location.pathname]);

  const fetchAudiencePreview = async (segment: string) => {
    try {
      const res = await axios.get('/api/admin/campaigns/audience-preview', {
        headers: getHeaders(),
        params: { segment }
      });
      if (res.data.success) {
        setAudiencePreview({
          totalEligible: res.data.totalEligible,
          suppressedCount: res.data.suppressedCount
        });
      }
    } catch (e) {
      console.error('Error fetching audience preview:', e);
    }
  };

  const handleOpenCreateModal = (presetCategory?: any, presetStartAt?: string) => {
    setEditingCampaign(null);
    setModalStep(1);
    const defaultChannel = isWhatsAppOnly ? 'WHATSAPP' : 'EMAIL';
    setSelectedSenderPreset('support');
    setSelectedPhonePreset('wa_support');

    const initialCategory = (typeof presetCategory === 'string' ? presetCategory : undefined) || (
      activeTab === 'PRODUCT_LAUNCH' ? 'PRODUCT_LAUNCH' :
      activeTab === 'ABANDONED_CHECKOUT' ? 'ABANDONED_CHECKOUT' :
      activeTab === 'PRODUCT_UPDATES' ? 'PRODUCT_UPDATE' :
      activeTab === 'REVIEW_REQUESTS' ? 'REVIEW_REQUEST' : 'SALE_CAMPAIGN'
    );

    const initialStartAt = (typeof presetStartAt === 'string' ? presetStartAt : undefined) || (
      activeTab === 'SCHEDULED' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : ''
    );

    setFormData({
      name: '',
      campaignType: initialCategory,
      channel: defaultChannel,
      audienceSegment: 'VERIFIED_CUSTOMERS',
      utmCampaign: '',
      emailSubject: initialCategory === 'PRODUCT_LAUNCH' ? '🚀 Special Product Launch Announcement!' :
                    initialCategory === 'ABANDONED_CHECKOUT' ? 'You left something in your cart!' :
                    'Exciting Update from KDW!',
      emailPreviewText: 'Special discount inside for valued creators...',
      emailFromName: 'KDW Support Team',
      senderEmail: 'support@kdw.in',
      senderPhone: '+91 98765 43210',
      whatsAppSenderName: 'KDW Official Support',
      emailReplyTo: 'support@kdw.in',
      emailBodyHtml: '<p>Hi {{customer.first_name}},</p><p>We have an exclusive offer for you!</p><p>Use code: <strong>{{coupon.code}}</strong> at checkout.</p>',
      emailBodyPlain: defaultChannel === 'WHATSAPP'
        ? 'Hi {{customer.first_name}},\n\nExclusive offer from KDW! Use code {{coupon.code}} to get an instant discount at checkout.\n\nShop now: {{storefront.url}}'
        : 'Hi {{customer.first_name}}, Use code {{coupon.code}} at checkout.',
      whatsAppTemplateName: 'kdw_customer_deal_v1',
      whatsAppLanguage: 'en',
      startAt: initialStartAt,
      endAt: '',
      status: 'DRAFT'
    });
    fetchAudiencePreview('VERIFIED_CUSTOMERS');
    setIsModalOpen(true);
  };

  const handleOpenRecipientReport = async (camp: any) => {
    setSelectedCampaignForReport(camp);
    setIsRecipientModalOpen(true);
    setRecipientFilter('ALL');
    setRecipientSearch('');
    await fetchRecipientLogs(camp.id, 'ALL', '');
  };

  const fetchRecipientLogs = async (campaignId: string, statusFilter: string, search: string) => {
    try {
      setRecipientLoading(true);
      const res = await axios.get(`/api/admin/campaigns/${campaignId}/recipients`, {
        headers: getHeaders(),
        params: { status: statusFilter, search }
      });
      if (res.data.success) {
        setRecipientLogs(res.data.recipients || []);
        if (res.data.summary) {
          setRecipientSummary(res.data.summary);
        }
      }
    } catch (e) {
      console.error('Error fetching recipient logs:', e);
      toast.error('Failed to load recipient breakdown');
    } finally {
      setRecipientLoading(false);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const res = await axios.post(`/api/admin/campaigns/${campaignId}/pause`, {}, { headers: getHeaders() });
      if (res.data.success) {
        toast.success('Campaign paused');
        fetchCampaignsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error pausing campaign');
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const res = await axios.post(`/api/admin/campaigns/${campaignId}/resume`, {}, { headers: getHeaders() });
      if (res.data.success) {
        toast.success('Campaign resumed to running');
        fetchCampaignsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error resuming campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${campaignName}"? This will also remove its delivery and read logs.`)) {
      return;
    }
    try {
      const res = await axios.delete(`/api/admin/campaigns/${campaignId}`, { headers: getHeaders() });
      if (res.data.success) {
        toast.success('Campaign deleted successfully');
        fetchCampaignsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting campaign');
    }
  };

  const handleOpenEditModal = (camp: any) => {
    setEditingCampaign(camp);
    setModalStep(1);
    const currentSenderEmail = camp.senderEmail || 'support@kdw.in';
    const matchedPreset = SENDER_PRESETS.find(p => p.email.toLowerCase() === currentSenderEmail.toLowerCase());
    setSelectedSenderPreset(matchedPreset ? matchedPreset.id : 'custom');

    const currentSenderPhone = camp.whatsAppParameters?.senderPhone || (camp.channel === 'WHATSAPP' ? camp.senderEmail : '') || '+91 98765 43210';
    const matchedPhonePreset = SENDER_PHONE_PRESETS.find(p => p.phone === currentSenderPhone);
    setSelectedPhonePreset(matchedPhonePreset ? matchedPhonePreset.id : 'custom');

    setFormData({
      name: camp.name,
      campaignType: camp.campaignType || 'SALE_CAMPAIGN',
      channel: camp.channel || (isWhatsAppOnly ? 'WHATSAPP' : 'EMAIL'),
      audienceSegment: camp.audienceSegment || 'VERIFIED_CUSTOMERS',
      utmCampaign: camp.utmCampaign || '',
      emailSubject: camp.emailSubject || '',
      emailPreviewText: camp.emailPreviewText || '',
      emailFromName: camp.emailFromName || 'KDW Support Team',
      senderEmail: currentSenderEmail,
      senderPhone: currentSenderPhone,
      whatsAppSenderName: camp.whatsAppParameters?.senderName || camp.emailFromName || 'KDW Official Support',
      emailReplyTo: camp.emailReplyTo || currentSenderEmail,
      emailBodyHtml: camp.emailBodyHtml || '',
      emailBodyPlain: camp.emailBodyPlain || '',
      whatsAppTemplateName: camp.whatsAppTemplateName || 'kdw_customer_deal_v1',
      whatsAppLanguage: 'en',
      startAt: camp.startAt ? new Date(camp.startAt).toISOString().split('T')[0] : '',
      endAt: camp.endAt ? new Date(camp.endAt).toISOString().split('T')[0] : '',
      status: camp.status || 'DRAFT'
    });
    fetchAudiencePreview(camp.audienceSegment || 'VERIFIED_CUSTOMERS');
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    try {
      const isWA = formData.channel === 'WHATSAPP' || isWhatsAppOnly;
      const payload = {
        ...formData,
        whatsAppLanguage: 'en',
        ...(isEmailOnly || formData.channel === 'EMAIL' ? { startAt: '', endAt: '' } : {}),
        ...(isWA ? {
          senderEmail: formData.senderPhone || '+91 98765 43210',
          emailFromName: formData.whatsAppSenderName || 'KDW Official Support'
        } : {})
      };

      if (editingCampaign) {
        const res = await axios.put(`/api/admin/campaigns/${editingCampaign.id}`, payload, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Campaign updated successfully');
          setIsModalOpen(false);
          fetchCampaignsData();
        }
      } else {
        const res = await axios.post('/api/admin/campaigns', payload, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Campaign created successfully');
          setIsModalOpen(false);
          fetchCampaignsData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save campaign');
    }
  };

  const handleSendTestMessage = async () => {
    if (!editingCampaign) {
      toast.error('Save campaign draft first to enable preview test sending');
      return;
    }

    const isWA = formData.channel === 'WHATSAPP';
    if (isWA && !testMobileNumber.trim()) {
      toast.error('Enter a valid test mobile number for WhatsApp');
      return;
    }
    if (!isWA && !testEmailAddress.trim()) {
      toast.error('Enter a valid test email address');
      return;
    }

    try {
      setSendingTest(true);
      const res = await axios.post(`/api/admin/campaigns/${editingCampaign.id}/test`, {
        testEmail: isWA ? undefined : testEmailAddress.trim(),
        testMobile: isWA ? testMobileNumber.trim() : undefined
      }, { headers: getHeaders() });

      if (res.data.success) {
        toast.success(res.data.message || (isWA ? `Preview WhatsApp message sent to ${testMobileNumber}` : `Preview email sent to ${testEmailAddress}`));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error sending test preview');
    } finally {
      setSendingTest(false);
    }
  };

  const handleApprove = async (campaignId: string) => {
    try {
      const res = await axios.post(`/api/admin/campaigns/${campaignId}/approve`, {}, {
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success('Campaign approved for delivery');
        fetchCampaignsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error approving campaign');
    }
  };

  const handleLaunch = async (campaignId: string) => {
    try {
      toast('Launching campaign delivery...', { icon: '🚀' });
      const res = await axios.post(`/api/admin/campaigns/${campaignId}/send`, {}, {
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success(`Dispatched to ${res.data.deliveryResult?.delivered || 0} recipients`);
        fetchCampaignsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error launching campaign');
    }
  };

  const exportCampaignsCSV = () => {
    window.open('/api/admin/campaigns/export', '_blank');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isWhatsAppOnly ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {isWhatsAppOnly ? <MessageSquare className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isEmailOnly ? 'Email Marketing' : isWhatsAppOnly ? 'WhatsApp Marketing' : 'Marketing Campaigns'}
                </h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isWhatsAppOnly ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isEmailOnly ? 'Email Broadcasts' : isWhatsAppOnly ? 'WhatsApp Broadcasts' : 'All Channels'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEmailOnly
                  ? 'Broadcast newsletters, offers, and announcements to verified customer emails with customizable sender identity.'
                  : isWhatsAppOnly
                  ? 'Send automated and bulk WhatsApp promotions, order notifications, and customer engagement broadcasts.'
                  : 'Orchestrate Email & WhatsApp announcements, product launches, and automated review requests.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaignsData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCampaignsCSV}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal()}
            className={`px-4 py-2.5 text-white rounded-xl shadow-sm transition flex items-center gap-2 text-sm font-semibold ${
              isWhatsAppOnly ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isEmailOnly ? 'Create Email Campaign' : isWhatsAppOnly ? 'Create WhatsApp Campaign' : 'Create Campaign'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'ALL' ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Campaigns</span>
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalCampaigns}</div>
          <div className="text-xs text-slate-400 mt-1">All broadcasts</div>
        </div>

        <div
          onClick={() => setActiveTab('RUNNING')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'RUNNING' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Running</span>
            <Play className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.runningCampaigns}</div>
          <div className="text-xs text-emerald-700 mt-1">Active delivery</div>
        </div>

        {isEmailOnly ? (
          <div
            onClick={() => setActiveTab('DRAFTS')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              activeTab === 'DRAFTS' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Drafts</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">{kpis.draftCampaigns || 0}</div>
            <div className="text-xs text-amber-700 mt-1">Saved drafts</div>
          </div>
        ) : (
          <div
            onClick={() => setActiveTab('SCHEDULED')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              activeTab === 'SCHEDULED' ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Scheduled</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-2">{kpis.scheduledCampaigns}</div>
            <div className="text-xs text-purple-700 mt-1">Queued for future</div>
          </div>
        )}

        <div
          onClick={() => setActiveTab('EMAIL')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'EMAIL' ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Sent</span>
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{kpis.totalSent}</div>
          <div className="text-xs text-indigo-700 mt-1">Total dispatches</div>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          className="p-4 rounded-xl border bg-white border-slate-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Delivered</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600 mt-2">{kpis.totalDelivered}</div>
          <div className="text-xs text-teal-700 mt-1">Successfully reached inbox</div>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          className="p-4 rounded-xl border bg-white border-slate-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Opens / Clicks</span>
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{kpis.totalOpened} / {kpis.totalClicked}</div>
          <div className="text-xs text-amber-700 mt-1">Engagement rate</div>
        </div>

        <div
          onClick={() => setActiveTab('REPORTS')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'REPORTS' ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Attributed Sales</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">₹{kpis.totalRevenue.toLocaleString('en-IN')}</div>
          <div className="text-xs text-blue-700 mt-1">Direct sales boost</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(isEmailOnly ? [
          { id: 'ALL', label: 'All Email Campaigns', icon: Mail },
          { id: 'DRAFTS', label: 'Drafts', icon: FileText },
          { id: 'RUNNING', label: 'Running', icon: Play },
          { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
          { id: 'PRODUCT_LAUNCH', label: 'Product Launches', icon: Sparkles },
          { id: 'ABANDONED_CHECKOUT', label: 'Abandoned Cart', icon: AlertTriangle },
          { id: 'REPORTS', label: 'Email Reports', icon: TrendingUp },
        ] : isWhatsAppOnly ? [
          { id: 'ALL', label: 'All WhatsApp Campaigns', icon: MessageSquare },
          { id: 'DRAFTS', label: 'Drafts', icon: FileText },
          { id: 'SCHEDULED', label: 'Scheduled', icon: Clock },
          { id: 'RUNNING', label: 'Running', icon: Play },
          { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
          { id: 'REPORTS', label: 'WhatsApp Reports', icon: TrendingUp },
        ] : [
          { id: 'ALL', label: 'All Campaigns', icon: Mail },
          { id: 'DRAFTS', label: 'Drafts', icon: FileText },
          { id: 'SCHEDULED', label: 'Scheduled', icon: Clock },
          { id: 'RUNNING', label: 'Running', icon: Play },
          { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
          { id: 'EMAIL', label: 'Email Campaigns', icon: Mail },
          { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
          { id: 'PRODUCT_LAUNCH', label: 'Product Launches', icon: Sparkles },
          { id: 'ABANDONED_CHECKOUT', label: 'Abandoned Cart', icon: AlertTriangle },
          { id: 'PRODUCT_UPDATES', label: 'Product Updates', icon: RefreshCw },
          { id: 'REVIEW_REQUESTS', label: 'Review Requests', icon: CheckSquare },
          { id: 'REPORTS', label: 'Campaign Reports', icon: TrendingUp },
        ]).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? isWhatsAppOnly ? 'bg-emerald-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reports Tab Content */}
      {activeTab === 'REPORTS' ? (
        <div className="space-y-6">
          {/* Executive Delivery & Read Rate Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isWhatsAppOnly ? 'WhatsApp Delivery Rate' : 'Inbox Delivery Rate'}
                </span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {kpis.totalSent > 0 ? ((kpis.totalDelivered / kpis.totalSent) * 100).toFixed(1) : '100'}%
                </span>
                <span className="text-xs text-teal-600 font-semibold">
                  {kpis.totalDelivered} / {kpis.totalSent} received
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isWhatsAppOnly ? 'Verified mobile deliverability across WhatsApp broadcasts' : 'Verified customer deliverability across broadcasts'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isWhatsAppOnly ? 'WhatsApp Read / Seen Rate' : 'Email Read / Open Rate'}
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-600">
                  {kpis.totalDelivered > 0 ? ((kpis.totalOpened / kpis.totalDelivered) * 100).toFixed(1) : '0.0'}%
                </span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {kpis.totalOpened} {isWhatsAppOnly ? 'seen (blue ticks)' : 'readers'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isWhatsAppOnly ? 'Recipients who opened and read the WhatsApp broadcast' : 'Recipients who opened and read email contents'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Click-Through Rate (CTR)</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <MousePointer className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-600">
                  {kpis.totalDelivered > 0 ? ((kpis.totalClicked / kpis.totalDelivered) * 100).toFixed(1) : '0.0'}%
                </span>
                <span className="text-xs text-indigo-700 font-semibold">
                  {kpis.totalClicked} total clicks
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isWhatsAppOnly ? 'Recipients who clicked the storefront link in WhatsApp' : 'Recipients engaging with call-to-actions'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Attributed Revenue</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  ₹{kpis.totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-blue-700 font-semibold">
                  {kpis.totalOrders || 0} orders
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isWhatsAppOnly ? 'Storefront orders and sales attributed to WhatsApp broadcasts' : 'Direct storefront sales tied to UTM tracking'}
              </p>
            </div>
          </div>

          {/* Campaign-by-Campaign Delivery & Read Analysis Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isWhatsAppOnly ? 'WhatsApp Broadcast Delivery & Engagement Analysis' : 'Campaign Delivery & Readership Analysis'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isWhatsAppOnly
                    ? 'Detailed analysis of how many customers received each WhatsApp broadcast, opened/seen it, replied, and visited the store.'
                    : 'Detailed analysis of how many customers received each email and how many opened/read it.'}
                </p>
              </div>
              <button
                onClick={exportCampaignsCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Audit CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Campaign Details</th>
                    <th className="px-5 py-3.5">Audience &amp; Sent</th>
                    <th className="px-5 py-3.5">Received (Delivered)</th>
                    <th className="px-5 py-3.5">{isWhatsAppOnly ? 'Read / Seen' : 'Read (Opened)'}</th>
                    <th className="px-5 py-3.5">Clicks</th>
                    <th className="px-5 py-3.5">Revenue</th>
                    <th className="px-5 py-3.5 text-right">Recipient Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        {isWhatsAppOnly ? 'No WhatsApp broadcast records available for reporting.' : 'No email campaign records available for reporting.'}
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((camp: any) => {
                      const deliveryPct = camp.sentCount > 0 ? ((camp.deliveredCount / camp.sentCount) * 100).toFixed(0) : '0';
                      const readPct = camp.deliveredCount > 0 ? ((camp.openedCount / camp.deliveredCount) * 100).toFixed(0) : '0';
                      const clickPct = camp.openedCount > 0 ? ((camp.clickedCount / camp.openedCount) * 100).toFixed(0) : '0';

                      return (
                        <tr key={camp.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm">{camp.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {camp.channel === 'WHATSAPP'
                                ? `Sender: ${camp.whatsAppParameters?.senderPhone || camp.senderEmail || '+91 98765 43210'}`
                                : `Subject: ${camp.emailSubject || 'No Subject'}`}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                                camp.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {camp.channel}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {camp.campaignType}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800 text-sm">{camp.sentCount} sent</div>
                            <div className="text-xs text-slate-400">{camp.audienceSegment || 'VERIFIED_CUSTOMERS'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{camp.deliveredCount}</span>
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full font-bold text-xs">
                                {deliveryPct}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {isWhatsAppOnly ? 'received on WhatsApp' : 'received in inbox'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-600 text-sm">{camp.openedCount}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                                {readPct}% seen
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {isWhatsAppOnly ? 'seen (blue ticks)' : 'opened & read'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-600 text-sm">{camp.clickedCount}</span>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-xs">
                                {clickPct}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {isWhatsAppOnly ? 'storefront clicks' : 'link clicks'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm">
                              ₹{(camp.revenueGenerated || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-emerald-600 font-medium">
                              {camp.convertedOrdersCount || 0} orders
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleOpenRecipientReport(camp)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm ${
                                isWhatsAppOnly
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Recipient Analysis</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Main Content Table for Standard Tabs */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Campaign Name</th>
                  <th className="px-5 py-3.5">Channel &amp; Type</th>
                  <th className="px-5 py-3.5">Audience Segment</th>
                  <th className="px-5 py-3.5">Delivery &amp; Read Stats</th>
                  {!isEmailOnly && <th className="px-5 py-3.5">Schedule</th>}
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={isEmailOnly ? 6 : 7} className="text-center py-12 text-slate-400">
                      {activeTab === 'DRAFTS' ? (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <FileText className="w-9 h-9 text-slate-400 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No draft campaigns found</p>
                          <p className="text-xs text-slate-500">
                            Save an unlaunched campaign as draft to configure templates and recipients before broadcasting.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal()}
                            className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus size={14} /> Create Draft Campaign
                          </button>
                        </div>
                      ) : activeTab === 'SCHEDULED' ? (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <Clock className="w-9 h-9 text-purple-500 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No scheduled broadcasts in queue</p>
                          <p className="text-xs text-slate-500">
                            There are currently no upcoming scheduled campaigns. To schedule a campaign, set a future start date.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal(undefined, new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                            className={`mt-1 px-4 py-2 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm ${
                              isWhatsAppOnly ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            <Plus size={14} /> Schedule a Campaign
                          </button>
                        </div>
                      ) : activeTab === 'RUNNING' ? (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <Play className="w-9 h-9 text-emerald-500 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No live broadcasts currently running</p>
                          <p className="text-xs text-slate-500">
                            When a campaign is approved and launched, its live dispatches will appear here.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal()}
                            className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus size={14} /> Launch a Campaign
                          </button>
                        </div>
                      ) : activeTab === 'COMPLETED' ? (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <CheckCircle className="w-9 h-9 text-teal-500 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No completed campaigns yet</p>
                          <p className="text-xs text-slate-500">
                            Delivered broadcasts with final attribution stats and open rates will appear here.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal()}
                            className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus size={14} /> Create a Campaign
                          </button>
                        </div>
                      ) : activeTab === 'PRODUCT_LAUNCH' ? (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <Sparkles className="w-9 h-9 text-amber-500 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No product launch campaigns</p>
                          <p className="text-xs text-slate-500">
                            Create dedicated launch broadcasts to announce new digital assets and products to your verified customers.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal('PRODUCT_LAUNCH')}
                            className="mt-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus size={14} /> Create Product Launch Campaign
                          </button>
                        </div>
                      ) : activeTab === 'ABANDONED_CHECKOUT' ? (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <AlertTriangle className="w-9 h-9 text-rose-500 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No abandoned cart recovery campaigns</p>
                          <p className="text-xs text-slate-500">
                            Re-engage customers who left items in their checkout with automated recovery incentives.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal('ABANDONED_CHECKOUT')}
                            className="mt-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus size={14} /> Create Abandoned Cart Campaign
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-w-md mx-auto py-4">
                          <Mail className="w-9 h-9 text-slate-400 mx-auto" />
                          <p className="font-bold text-slate-800 text-base">No campaigns found under this view</p>
                          <p className="text-xs text-slate-500">
                            Broadcast announcements, newsletters, or offers to your customers.
                          </p>
                          <button
                            onClick={() => handleOpenCreateModal()}
                            className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus size={14} /> Create Campaign
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp: any) => (
                    <tr key={camp.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-base">{camp.name}</div>
                        <div className="text-xs text-slate-400">UTM: {camp.utmCampaign || 'None'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-xs uppercase">
                          {camp.channel}
                        </span>
                        <div className="text-xs text-slate-500 font-medium mt-1">{camp.campaignType}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{camp.audienceSegment}</div>
                        <div className="text-xs text-slate-400">{camp.audienceCount} recipients ({camp.suppressedCount || 0} suppressed)</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-800 font-medium">
                          Sent: <strong>{camp.sentCount}</strong> · Received: <strong className="text-teal-700">{camp.deliveredCount}</strong>
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                          Read: <strong>{camp.openedCount}</strong> readers · ₹{(camp.revenueGenerated || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      {!isEmailOnly && (
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {camp.startAt ? new Date(camp.startAt).toLocaleDateString() : 'Immediate'}
                          {' → '}
                          {camp.endAt ? new Date(camp.endAt).toLocaleDateString() : 'Continuous'}
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          camp.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-700' :
                          camp.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                          camp.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          camp.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
                          camp.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenRecipientReport(camp)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                          title="View Delivery & Read Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(camp)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                          title="Edit Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {camp.status === 'DRAFT' && (
                          <button
                            onClick={() => handleApprove(camp.id)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                          >
                            Approve
                          </button>
                        )}
                        {(camp.status === 'APPROVED' || camp.status === 'DRAFT') && (
                          <button
                            onClick={() => handleLaunch(camp.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold shadow-sm transition"
                          >
                            Launch Now
                          </button>
                        )}
                        {camp.status === 'RUNNING' && (
                          <button
                            onClick={() => handlePauseCampaign(camp.id)}
                            className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                            title="Pause Campaign"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {camp.status === 'PAUSED' && (
                          <button
                            onClick={() => handleResumeCampaign(camp.id)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="Resume Campaign"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Multi-Step Campaign Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-blue-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCampaign ? `Edit Campaign (${editingCampaign.name})` : 'Campaign Builder'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-blue-800 font-medium">
                  <span className={modalStep === 1 ? 'font-bold underline' : ''}>1. Audience & Channel</span>
                  <span>→</span>
                  <span className={modalStep === 2 ? 'font-bold underline' : ''}>2. Content & Templates</span>
                  <span>→</span>
                  <span className={modalStep === 3 ? 'font-bold underline' : ''}>3. Test & Launch</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {modalStep === 1 ? (
                /* Step 1: Info & Audience */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. VIP Independence Mega Sale"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Channel *</label>
                      <select
                        disabled={isEmailOnly || isWhatsAppOnly}
                        value={formData.channel}
                        onChange={e => setFormData({ ...formData, channel: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 font-semibold"
                      >
                        <option value="EMAIL">Email Broadcast</option>
                        <option value="WHATSAPP">WhatsApp Notification</option>
                        <option value="MULTI_CHANNEL">Multi-Channel</option>
                      </select>
                      {(isEmailOnly || isWhatsAppOnly) && (
                        <p className="text-[11px] text-blue-600 mt-1 font-medium">
                          Channel preset for {isEmailOnly ? 'Email Marketing' : 'WhatsApp Marketing'} module
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign Category</label>
                      <select
                        value={formData.campaignType}
                        onChange={e => setFormData({ ...formData, campaignType: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SALE_CAMPAIGN">Sale / Discount Promotion</option>
                        <option value="PRODUCT_LAUNCH">New Product Announcement</option>
                        <option value="ABANDONED_CHECKOUT">Abandoned Checkout Recovery</option>
                        <option value="PRODUCT_UPDATE">Product Major Update</option>
                        <option value="REVIEW_REQUEST">Post-Purchase Review Request</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Audience Segment *</label>
                      <select
                        value={formData.audienceSegment}
                        onChange={e => {
                          setFormData({ ...formData, audienceSegment: e.target.value });
                          fetchAudiencePreview(e.target.value);
                        }}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                      >
                        <option value="VERIFIED_CUSTOMERS">⭐ All Verified Customers (Email Verified - Recommended)</option>
                        <option value="ALL_CUSTOMERS">All Registered Customers (All Active Accounts)</option>
                        <option value="PAID_CUSTOMERS">Paid Customers (Completed At Least 1 Purchase)</option>
                        <option value="NEW_CUSTOMERS">Registered Without Orders (New Leads)</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Classified with 100% verified database customer and order records.</p>
                    </div>
                  </div>

                  {formData.channel !== 'WHATSAPP' && (
                    <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                          Sender Email &amp; Identity
                        </label>
                        <span className="text-[11px] text-blue-700 font-semibold bg-blue-100/90 px-2 py-0.5 rounded w-fit">
                          Choose Preset or Customize Freely
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Choose Sender Profile / Preset
                        </label>
                        <select
                          value={selectedSenderPreset}
                          onChange={e => handleSelectSenderPreset(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                        >
                          {SENDER_PRESETS.map(preset => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Sender Name
                          </label>
                          <input
                            type="text"
                            value={formData.emailFromName}
                            onChange={e => setFormData({ ...formData, emailFromName: e.target.value })}
                            placeholder="e.g. KDW Support Team"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Appears as sender name</p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Sender Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.senderEmail}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData({ ...formData, senderEmail: val });
                              const matched = SENDER_PRESETS.find(p => p.email.toLowerCase() === val.trim().toLowerCase());
                              setSelectedSenderPreset(matched ? matched.id : 'custom');
                            }}
                            placeholder="e.g. support@kdw.in"
                            className="w-full px-3 py-2 border border-blue-400 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-blue-950"
                          />
                          <p className="text-[10px] text-blue-600 mt-0.5">Editable: customize to any email address</p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Reply-To Email
                          </label>
                          <input
                            type="email"
                            value={formData.emailReplyTo}
                            onChange={e => setFormData({ ...formData, emailReplyTo: e.target.value })}
                            placeholder="e.g. support@kdw.in"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Customer replies go here</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.channel === 'WHATSAPP' && (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          Sender WhatsApp Number &amp; Identity
                        </label>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/90 px-2 py-0.5 rounded w-fit">
                          Customizable WhatsApp Sender Phone
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Choose Sender Profile / Preset
                        </label>
                        <select
                          value={selectedPhonePreset}
                          onChange={e => handleSelectPhonePreset(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                        >
                          {SENDER_PHONE_PRESETS.map(preset => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Sender Business Name
                          </label>
                          <input
                            type="text"
                            value={formData.whatsAppSenderName}
                            onChange={e => setFormData({ ...formData, whatsAppSenderName: e.target.value })}
                            placeholder="e.g. KDW Official Support"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-900"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Appears on business profile</p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Sender WhatsApp Phone <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.senderPhone}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData({ ...formData, senderPhone: val });
                              const matched = SENDER_PHONE_PRESETS.find(p => p.phone === val.trim());
                              setSelectedPhonePreset(matched ? matched.id : 'custom');
                            }}
                            placeholder="e.g. +91 98765 43210"
                            className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-emerald-950"
                          />
                          <p className="text-[10px] text-emerald-600 mt-0.5">Editable: customize to your business phone number</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isEmailOnly && formData.channel !== 'EMAIL' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Schedule Start Date (Optional)</label>
                        <input
                          type="date"
                          value={formData.startAt}
                          onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Leave blank to activate/launch immediately</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign End Date (Optional)</label>
                        <input
                          type="date"
                          value={formData.endAt}
                          onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Leave blank for continuous delivery</p>
                      </div>
                    </div>
                  )}

                  {audiencePreview && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                      <div>
                        <strong>Estimated Reach:</strong> {audiencePreview.totalEligible} customer(s)
                      </div>
                      <div className="text-slate-500">
                        {audiencePreview.suppressedCount} suppressed (unsubscribed/opt-outs)
                      </div>
                    </div>
                  )}
                </div>
              ) : modalStep === 2 ? (
                /* Step 2: Content & Templates */
                <div className="space-y-4">
                  {formData.channel !== 'WHATSAPP' && (
                    /* Sender Identity Review & Customization in Step 2 */
                    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                          Sender Identity &amp; Routing
                        </label>
                        <span className="text-[11px] text-blue-700 font-semibold bg-blue-100/80 px-2 py-0.5 rounded">
                          Customizable Sender Email
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sender Name</label>
                          <input
                            type="text"
                            value={formData.emailFromName}
                            onChange={e => setFormData({ ...formData, emailFromName: e.target.value })}
                            placeholder="e.g. KDW Support Team"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Sender Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.senderEmail}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData({ ...formData, senderEmail: val });
                              const matched = SENDER_PRESETS.find(p => p.email.toLowerCase() === val.trim().toLowerCase());
                              setSelectedSenderPreset(matched ? matched.id : 'custom');
                            }}
                            placeholder="e.g. support@kdw.in"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-900"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Will show as the sender</p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Reply-To Email</label>
                          <input
                            type="email"
                            value={formData.emailReplyTo}
                            onChange={e => setFormData({ ...formData, emailReplyTo: e.target.value })}
                            placeholder="e.g. support@kdw.in"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Where customer replies go</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.channel !== 'WHATSAPP' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Subject *</label>
                          <input
                            type="text"
                            required
                            value={formData.emailSubject}
                            onChange={e => setFormData({ ...formData, emailSubject: e.target.value })}
                            placeholder="e.g. Special Deal for you, {{customer.name}}!"
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preview Snippet</label>
                          <input
                            type="text"
                            value={formData.emailPreviewText}
                            onChange={e => setFormData({ ...formData, emailPreviewText: e.target.value })}
                            placeholder="Summary text visible in email inbox previews"
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase">Email Body (HTML Template)</label>
                          <span className="text-xs text-blue-600 font-mono font-medium">Supports {'{{customer.first_name}}'}, {'{{coupon.code}}'}</span>
                        </div>
                        <textarea
                          rows={6}
                          value={formData.emailBodyHtml}
                          onChange={e => setFormData({ ...formData, emailBodyHtml: e.target.value })}
                          className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    /* WhatsApp Controls */
                    <div className="space-y-4">
                      {/* Sender Review Badge for WhatsApp */}
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-slate-800">
                            Sender: <strong className="text-emerald-800">{formData.senderPhone || '+91 98765 43210'}</strong> ({formData.whatsAppSenderName || 'KDW Official Support'})
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full w-fit">
                          Language: English (en)
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Template / Broadcast Identifier</label>
                        <input
                          type="text"
                          value={formData.whatsAppTemplateName}
                          onChange={e => setFormData({ ...formData, whatsAppTemplateName: e.target.value })}
                          placeholder="e.g. kdw_festive_offer_v1"
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Official broadcast identifier (in English)</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase">WhatsApp Broadcast Message (English)</label>
                          <span className="text-xs text-emerald-600 font-mono font-medium">Supports {'{{customer.first_name}}'}, {'{{coupon.code}}'}, {'{{storefront.url}}'}</span>
                        </div>
                        <textarea
                          rows={6}
                          value={formData.emailBodyPlain}
                          onChange={e => setFormData({ ...formData, emailBodyPlain: e.target.value })}
                          placeholder="Type WhatsApp broadcast message in English e.g. Hi {{customer.first_name}}, exclusive offer from KDW! Use code {{coupon.code}} at checkout..."
                          className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-sans"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Step 3: Test & Launch */
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      {formData.channel === 'WHATSAPP' ? 'Send Test Preview WhatsApp' : 'Send Test Preview Email'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {formData.channel === 'WHATSAPP'
                        ? 'Dispatch a live WhatsApp preview sample before broadcasting.'
                        : 'Dispatch a live rendered sample before broadcasting to your entire audience.'}
                    </p>
                    <div className="flex gap-2">
                      {formData.channel === 'WHATSAPP' ? (
                        <input
                          type="tel"
                          placeholder="Enter test mobile (e.g. +919876543210)"
                          value={testMobileNumber}
                          onChange={e => setTestMobileNumber(e.target.value)}
                          className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <input
                          type="email"
                          placeholder="Enter test email (e.g. your email)"
                          value={testEmailAddress}
                          onChange={e => setTestEmailAddress(e.target.value)}
                          className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      <button
                        type="button"
                        disabled={sendingTest || !editingCampaign}
                        onClick={handleSendTestMessage}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      >
                        {sendingTest ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                    {!editingCampaign && (
                      <p className="text-xs text-amber-600">Save campaign draft first to enable preview test sending.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  {modalStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setModalStep((modalStep - 1) as any)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {modalStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setModalStep((modalStep + 1) as any)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                    >
                      {editingCampaign ? 'Save Campaign' : 'Save as Draft'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipient Delivery & Readership Drilldown Modal */}
      {isRecipientModalOpen && selectedCampaignForReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className={`p-5 border-b border-slate-200 flex items-center justify-between ${
              selectedCampaignForReport.channel === 'WHATSAPP' ? 'bg-emerald-50/80' : 'bg-blue-50/70'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  {selectedCampaignForReport.channel === 'WHATSAPP' ? (
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-blue-600" />
                  )}
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedCampaignForReport.channel === 'WHATSAPP'
                      ? 'WhatsApp Recipient Delivery, Read & Reply Breakdown'
                      : 'Recipient Delivery & Readership Breakdown'}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Campaign: <strong className="text-slate-900">{selectedCampaignForReport.name}</strong> ·
                  {selectedCampaignForReport.channel === 'WHATSAPP' ? (
                    <span> Sender Phone: <strong className="text-emerald-700">{selectedCampaignForReport.whatsAppParameters?.senderPhone || selectedCampaignForReport.senderEmail || '+91 98765 43210'}</strong> · Channel: <strong className="text-emerald-700">WHATSAPP</strong></span>
                  ) : (
                    <span> Sender: <strong className="text-blue-700">{selectedCampaignForReport.senderEmail || 'support@kdw.in'}</strong> · Channel: <strong className="text-blue-700">{selectedCampaignForReport.channel}</strong></span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsRecipientModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Dispatched</span>
                <span className="text-lg font-bold text-slate-900">{recipientSummary.totalRecipients}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-teal-200 text-center">
                <span className="text-[11px] font-semibold text-teal-600 uppercase block">Delivered</span>
                <span className="text-lg font-bold text-teal-700">{recipientSummary.delivered}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase block">
                  {selectedCampaignForReport.channel === 'WHATSAPP' ? 'Seen (Blue Ticks)' : 'Opened & Read'}
                </span>
                <span className="text-lg font-bold text-emerald-700">{recipientSummary.opened}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-purple-200 text-center">
                <span className="text-[11px] font-semibold text-purple-600 uppercase block">Replied</span>
                <span className="text-lg font-bold text-purple-700">{recipientSummary.replied || 0}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-indigo-200 text-center">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase block">Clicked Link</span>
                <span className="text-lg font-bold text-indigo-700">{recipientSummary.clicked || 0}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-center">
                <span className="text-[11px] font-semibold text-amber-600 uppercase block">Converted Sales</span>
                <span className="text-lg font-bold text-amber-700">{recipientSummary.converted || 0}</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(['ALL', 'OPENED', 'REPLIED', 'CLICKED', 'CONVERTED', 'FAILED'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setRecipientFilter(tab);
                      fetchRecipientLogs(selectedCampaignForReport.id, tab, recipientSearch);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      recipientFilter === tab
                        ? selectedCampaignForReport.channel === 'WHATSAPP'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Recipients' :
                     tab === 'OPENED' ? (selectedCampaignForReport.channel === 'WHATSAPP' ? 'Seen (Blue Ticks)' : 'Read / Opened') :
                     tab === 'REPLIED' ? 'Customer Replies' :
                     tab === 'CLICKED' ? 'Clicked Link' :
                     tab === 'CONVERTED' ? 'Purchased / Orders' : 'Failed'}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by phone, email, name..."
                  value={recipientSearch}
                  onChange={e => {
                    const q = e.target.value;
                    setRecipientSearch(q);
                    fetchRecipientLogs(selectedCampaignForReport.id, recipientFilter, q);
                  }}
                  className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Recipient Logs Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {recipientLoading ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  <p className="text-xs">Loading recipient delivery breakdown...</p>
                </div>
              ) : recipientLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-700 text-sm">No recipients found</p>
                  <p className="text-xs text-slate-400">Try changing the status filter or search term.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Customer / Mobile</th>
                        <th className="px-4 py-3">Delivery Status</th>
                        <th className="px-4 py-3">Delivered At</th>
                        <th className="px-4 py-3">Seen / Read At</th>
                        <th className="px-4 py-3">Engagement &amp; Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recipientLogs.map((log: any) => {
                        const isReplied = log.deliveryStatus === 'REPLIED' || (log.failureReason && log.failureReason.startsWith('Replied:'));
                        const isConverted = log.deliveryStatus === 'CONVERTED' || (log.convertedRevenue && log.convertedRevenue > 0);
                        const isClicked = log.deliveryStatus === 'CLICKED' || !!log.clickedAt;
                        const isRead = log.deliveryStatus === 'OPENED' || isReplied || isConverted || isClicked || !!log.openedAt;
                        const isDelivered = ['DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'CONVERTED'].includes(log.deliveryStatus) || !!log.deliveredAt;
                        const isFailed = log.deliveryStatus === 'FAILED' || log.deliveryStatus === 'BOUNCED';

                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{log.customer?.name || 'Customer'}</div>
                              <div className="text-emerald-700 font-mono text-[11px] font-semibold">
                                {log.phone || log.customer?.mobile || log.email || 'No Phone'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isReplied ? (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                                  <MessageSquare className="w-3 h-3" /> Replied
                                </span>
                              ) : isConverted ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                                  <CheckCircle className="w-3 h-3" /> Purchased ₹{log.convertedRevenue || 1499}
                                </span>
                              ) : isClicked ? (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                                  <MousePointer className="w-3 h-3" /> Visited Store
                                </span>
                              ) : isRead ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                                  <Eye className="w-3 h-3" /> Read (Blue Ticks)
                                </span>
                              ) : isDelivered ? (
                                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                                  <CheckCircle className="w-3 h-3" /> Delivered
                                </span>
                              ) : isFailed ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                                  <AlertTriangle className="w-3 h-3" /> Failed
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold text-[11px]">
                                  {log.deliveryStatus}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString('en-IN') : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {log.openedAt ? (
                                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                  {new Date(log.openedAt).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not seen yet</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isReplied ? (
                                <span className="text-xs font-semibold text-purple-700">
                                  {log.failureReason || 'Customer replied to broadcast'}
                                </span>
                              ) : isConverted ? (
                                <span className="text-xs font-semibold text-emerald-700">
                                  {log.convertedOrderId ? `Order ${log.convertedOrderId} · ₹${log.convertedRevenue}` : `Converted ₹${log.convertedRevenue}`}
                                </span>
                              ) : isClicked ? (
                                <span className="text-xs font-medium text-indigo-700">
                                  Clicked storefront link at {log.clickedAt ? new Date(log.clickedAt).toLocaleTimeString('en-IN') : ''}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No direct response yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {recipientLogs.length} recipient delivery events
              </span>
              <button
                onClick={() => setIsRecipientModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
