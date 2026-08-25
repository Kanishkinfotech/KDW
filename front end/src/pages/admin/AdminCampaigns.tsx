import { useState, useEffect } from 'react';
import {
  Mail, Send, Plus, Search, Filter, RefreshCw, Download, CheckCircle, Clock,
  AlertTriangle, Play, Pause, FileText, ChevronRight, Eye, Edit,
  TrendingUp, Users, MessageSquare, Sparkles, CheckSquare, X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminCampaigns() {
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

  // Test Email State
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'SALE_CAMPAIGN',
    channel: 'EMAIL',
    audienceSegment: 'ALL_CUSTOMERS',
    utmCampaign: '',
    emailSubject: '',
    emailPreviewText: '',
    emailFromName: 'KDW Digital World',
    emailReplyTo: 'support@kdw.in',
    emailBodyHtml: '<p>Hi {{customer.first_name}},</p><p>We have an exclusive offer for you!</p><p>Use code: <strong>{{coupon.code}}</strong> at checkout.</p>',
    emailBodyPlain: '',
    whatsAppTemplateName: '',
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
      const res = await axios.get('/api/admin/campaigns', {
        headers: getHeaders(),
        params: {
          status: activeTab === 'DRAFTS' ? 'DRAFT' :
                  activeTab === 'SCHEDULED' ? 'SCHEDULED' :
                  activeTab === 'RUNNING' ? 'RUNNING' :
                  activeTab === 'COMPLETED' ? 'COMPLETED' : 'ALL',
          channel: activeTab === 'EMAIL' ? 'EMAIL' :
                   activeTab === 'WHATSAPP' ? 'WHATSAPP' : channelFilter,
          campaignType: activeTab === 'PRODUCT_LAUNCH' ? 'PRODUCT_LAUNCH' :
                        activeTab === 'ABANDONED_CHECKOUT' ? 'ABANDONED_CHECKOUT' :
                        activeTab === 'PRODUCT_UPDATES' ? 'PRODUCT_UPDATE' :
                        activeTab === 'REVIEW_REQUESTS' ? 'REVIEW_REQUEST' : 'ALL',
          search: searchTerm
        }
      });
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsData();
  }, [activeTab, channelFilter, searchTerm]);

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

  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setModalStep(1);
    setFormData({
      name: '',
      campaignType: 'SALE_CAMPAIGN',
      channel: 'EMAIL',
      audienceSegment: 'ALL_CUSTOMERS',
      utmCampaign: '',
      emailSubject: 'Exciting Update from KDW!',
      emailPreviewText: 'Special discount inside for valued creators...',
      emailFromName: 'KDW Digital World',
      emailReplyTo: 'support@kdw.in',
      emailBodyHtml: '<p>Hi {{customer.first_name}},</p><p>We have an exclusive offer for you!</p><p>Use code: <strong>{{coupon.code}}</strong> at checkout.</p>',
      emailBodyPlain: 'Hi {{customer.first_name}}, Use code {{coupon.code}} at checkout.',
      whatsAppTemplateName: '',
      startAt: '',
      endAt: '',
      status: 'DRAFT'
    });
    fetchAudiencePreview('ALL_CUSTOMERS');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (camp: any) => {
    setEditingCampaign(camp);
    setModalStep(1);
    setFormData({
      name: camp.name,
      campaignType: camp.campaignType || 'SALE_CAMPAIGN',
      channel: camp.channel || 'EMAIL',
      audienceSegment: camp.audienceSegment || 'ALL_CUSTOMERS',
      utmCampaign: camp.utmCampaign || '',
      emailSubject: camp.emailSubject || '',
      emailPreviewText: camp.emailPreviewText || '',
      emailFromName: camp.emailFromName || 'KDW Digital World',
      emailReplyTo: camp.emailReplyTo || 'support@kdw.in',
      emailBodyHtml: camp.emailBodyHtml || '',
      emailBodyPlain: camp.emailBodyPlain || '',
      whatsAppTemplateName: camp.whatsAppTemplateName || '',
      startAt: camp.startAt ? new Date(camp.startAt).toISOString().split('T')[0] : '',
      endAt: camp.endAt ? new Date(camp.endAt).toISOString().split('T')[0] : '',
      status: camp.status || 'DRAFT'
    });
    fetchAudiencePreview(camp.audienceSegment || 'ALL_CUSTOMERS');
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    try {
      if (editingCampaign) {
        const res = await axios.put(`/api/admin/campaigns/${editingCampaign.id}`, formData, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Campaign updated successfully');
          setIsModalOpen(false);
          fetchCampaignsData();
        }
      } else {
        const res = await axios.post('/api/admin/campaigns', formData, {
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

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim() || !editingCampaign) {
      toast.error('Enter a valid test email address');
      return;
    }
    try {
      setSendingTest(true);
      const res = await axios.post(`/api/admin/campaigns/${editingCampaign.id}/test`, {
        testEmail: testEmailAddress.trim()
      }, { headers: getHeaders() });

      if (res.data.success) {
        toast.success(`Preview email sent to ${testEmailAddress}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error sending test email');
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

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing Campaigns</h1>
              <p className="text-sm text-slate-500">Orchestrate Email & WhatsApp announcements, product launches, and automated review requests.</p>
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
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
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
        {[
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
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Campaign Name</th>
                <th className="px-5 py-3.5">Channel & Type</th>
                <th className="px-5 py-3.5">Audience Segment</th>
                <th className="px-5 py-3.5">Delivery Stats</th>
                <th className="px-5 py-3.5">Schedule</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No marketing campaigns created under this tab.
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
                      <div className="text-xs text-slate-800">
                        Sent: <strong>{camp.sentCount}</strong> · Delivered: <strong>{camp.deliveredCount}</strong>
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold">
                        Revenue: ₹{(camp.attributedRevenue || 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {camp.startAt ? new Date(camp.startAt).toLocaleDateString() : 'Immediate'}
                      {' → '}
                      {camp.endAt ? new Date(camp.endAt).toLocaleDateString() : 'Continuous'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        camp.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-700' :
                        camp.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        camp.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
                        camp.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(camp)}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                        value={formData.channel}
                        onChange={e => setFormData({ ...formData, channel: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EMAIL">Email Broadcast</option>
                        <option value="WHATSAPP">WhatsApp Notification</option>
                        <option value="MULTI_CHANNEL">Multi-Channel</option>
                      </select>
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
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL_CUSTOMERS">All Registered Customers</option>
                        <option value="PAID_CUSTOMERS">Paid Buyers Only</option>
                        <option value="NEW_CUSTOMERS">Registered But Never Purchased</option>
                        <option value="HIGH_VALUE">High Value VIPs (&gt; ₹2000)</option>
                        <option value="STUDENTS">Student Segment</option>
                        <option value="AGENCY">Agency Segment</option>
                      </select>
                    </div>
                  </div>

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
                </div>
              ) : (
                /* Step 3: Test & Launch */
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Send Test Preview Email</h4>
                    <p className="text-xs text-slate-500">Dispatch a live rendered sample before broadcasting to your entire audience.</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter test email (e.g. your email)"
                        value={testEmailAddress}
                        onChange={e => setTestEmailAddress(e.target.value)}
                        className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        disabled={sendingTest || !editingCampaign}
                        onClick={handleSendTestEmail}
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
    </div>
  );
}
