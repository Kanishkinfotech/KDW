import { useState, useEffect } from 'react';
import {
  X, User, Shield, CreditCard, HardDrive, Key, Download, DollarSign,
  MessageSquare, FileText, History as HistoryIcon, Ban, CheckCircle2, AlertTriangle,
  Send, RotateCcw, Clock, Copy, Check, ExternalLink, RefreshCw, Tag,
  Building, Globe, Phone, Mail, Eye, Trash2, Lock, ShieldAlert,
  ChevronRight, Calendar, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatCurrency } from '../../utils/currency';

interface AdminCustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AdminCustomerDetailModal({
  customerId,
  onClose,
  onRefresh
}: AdminCustomerDetailModalProps) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'profile' | 'orders' | 'entitlements' | 'downloads' | 'licences' | 'refunds' | 'support' | 'consents' | 'tags' | 'notes' | 'security' | 'data-requests' | 'timeline' | 'audit'
  >('overview');

  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editBusinessType, setEditBusinessType] = useState('');
  const [editGstNumber, setEditGstNumber] = useState('');
  const [editCountry, setEditCountry] = useState('IN');
  const [editState, setEditState] = useState('');
  const [editFraudRisk, setEditFraudRisk] = useState('LOW');
  const [editSupportPriority, setEditSupportPriority] = useState('NORMAL');

  // Action Dialog Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockScope, setBlockScope] = useState('FULL');
  const [blockReason, setBlockReason] = useState('');

  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('INTERNAL');

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const c = res.data.customer;
        setCustomer(c);
        setEditName(c.name || '');
        setEditMobile(c.mobile || '');
        setEditBusinessName(c.businessName || '');
        setEditBusinessType(c.businessType || '');
        setEditGstNumber(c.gstNumber || '');
        setEditCountry(c.country || 'IN');
        setEditState(c.state || '');
        setEditFraudRisk(c.fraudRisk || 'LOW');
        setEditSupportPriority(c.supportPriority || 'NORMAL');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load customer profile');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // 1. Save Profile Edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/admin/customers/${customer.id}`, {
        name: editName,
        mobile: editMobile,
        businessName: editBusinessName,
        businessType: editBusinessType,
        gstNumber: editGstNumber,
        country: editCountry,
        state: editState,
        fraudRisk: editFraudRisk,
        supportPriority: editSupportPriority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Customer profile saved successfully!');
        fetchCustomerDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Block Customer
  const handleBlockCustomer = async () => {
    if (!blockReason.trim()) {
      toast.error('Block justification reason is required.');
      return;
    }
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customer.id}/block`, {
        scope: blockScope,
        reason: blockReason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(`Customer blocked under scope ${blockScope}`);
        setShowBlockModal(false);
        setBlockReason('');
        fetchCustomerDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to block customer');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Unblock Customer
  const handleUnblockCustomer = async () => {
    if (!window.confirm('Are you sure you want to unblock this customer account?')) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customer.id}/unblock`, {
        reason: 'Administrative manual unblock'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Customer unblocked successfully!');
        fetchCustomerDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unblock customer');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Add Standardized Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customer.id}/tags`, {
        tagName: newTagName.trim(),
        reason: 'Console tag assignment'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Tag assigned successfully!');
        setNewTagName('');
        setShowTagModal(false);
        fetchCustomerDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add tag');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Remove Tag
  const handleRemoveTag = async (tagId: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/admin/customers/${customer.id}/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Tag removed');
        fetchCustomerDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove tag');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Update Consent Status
  const handleUpdateConsent = async (consentType: string, status: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customer.id}/consents`, {
        consentType,
        status,
        reason: `Consent status updated to ${status} by admin`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(`Consent for ${consentType} updated to ${status}`);
        fetchCustomerDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update consent');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customer.id}/notes`, {
        content: newNote.trim(),
        noteType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Note added to customer record');
        setNewNote('');
        fetchCustomerDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <RefreshCw className="animate-spin text-primary mx-auto" size={32} />
          <h3 className="font-bold text-slate-900 text-lg">Loading Customer Profile</h3>
          <p className="text-xs text-slate-500">Retrieving full multi-relation customer history, entitlements, and consents...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER BAR */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center border border-primary/20 shrink-0">
              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{customer.name}</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700">
                  {customer.customerCode || customer.id.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(customer.customerCode || customer.id, 'Customer Code')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                >
                  {copiedLabel === 'Customer Code' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{customer.email}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  customer.customerType === 'ACCOUNT' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {customer.customerType}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  customer.emailVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {customer.emailVerified ? 'Verified Email' : 'Unverified'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                  customer.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  Status: {customer.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Lifetime Value</span>
              <span className="text-xl font-black text-slate-900">{formatCurrency(customer.metrics?.netRevenue || 0)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ACTION BAR STRIP */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Quick Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Add Tag */}
            <button
              type="button"
              onClick={() => setShowTagModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Tag size={13} />
              Add Tag
            </button>

            {/* Block / Unblock */}
            {customer.status === 'BLOCKED' ? (
              <button
                type="button"
                onClick={handleUnblockCustomer}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={13} />
                Unblock Account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBlockModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 font-bold text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-800/60"
              >
                <Ban size={13} />
                Block Account
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto bg-slate-50/70 shrink-0">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'profile', label: 'Contact & Business', icon: Building },
            { id: 'orders', label: `Orders (${customer.orders?.length || 0})`, icon: CreditCard },
            { id: 'entitlements', label: `Entitlements (${customer.purchases?.length || 0})`, icon: HardDrive },
            { id: 'downloads', label: `Downloads (${customer.downloadHistory?.length || 0})`, icon: Download },
            { id: 'licences', label: `Licences (${customer.licenceKeys?.length || 0})`, icon: Key },
            { id: 'support', label: `Support (${customer.supportTickets?.length || 0})`, icon: MessageSquare },
            { id: 'consents', label: `Consent Registry (${customer.consents?.length || 0})`, icon: Shield },
            { id: 'tags', label: `Tags (${customer.customerTags?.length || 0})`, icon: Tag },
            { id: 'notes', label: `Notes (${customer.customerNotes?.length || 0})`, icon: FileText },
            { id: 'security', label: 'Security & Logins', icon: Lock },
            { id: 'data-requests', label: `Data Requests (${customer.dataRequests?.length || 0})`, icon: ShieldAlert },
            { id: 'timeline', label: `Timeline (${customer.timelineEvents?.length || 0})`, icon: HistoryIcon },
            { id: 'audit', label: `Audit Log (${customer.customerAuditLogs?.length || 0})`, icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Net Revenue (CLV)</span>
                  <span className="text-lg font-black text-slate-900 block mt-1">{formatCurrency(customer.metrics?.netRevenue || 0)}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Orders</span>
                  <span className="text-lg font-black text-slate-900 block mt-1">{customer.orders?.length || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Active Licences</span>
                  <span className="text-lg font-black text-slate-900 block mt-1">{customer.metrics?.activeLicencesCount || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Open Tickets</span>
                  <span className="text-lg font-black text-slate-900 block mt-1">{customer.metrics?.openTicketsCount || 0}</span>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" /> Recent Orders
                </h4>
                {customer.orders && customer.orders.length > 0 ? (
                  <div className="space-y-2">
                    {customer.orders.slice(0, 3).map((o: any) => (
                      <div key={o.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
                          <span className="text-slate-500 text-[11px] block">{new Date(o.createdAt).toLocaleDateString()} • {o.items?.length || 1} item(s)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 block">{formatCurrency(o.totalAmount)}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {o.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">No orders recorded for this customer.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & BUSINESS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    placeholder="e.g. Acme Media Corp"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">GST Number</label>
                  <input
                    type="text"
                    value={editGstNumber}
                    onChange={(e) => setEditGstNumber(e.target.value)}
                    placeholder="e.g. 29ABCDE1234F2Z5"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Fraud Risk Tier</label>
                  <select
                    value={editFraudRisk}
                    onChange={(e) => setEditFraudRisk(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Support Priority</label>
                  <select
                    value={editSupportPriority}
                    onChange={(e) => setEditSupportPriority(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="VIP">VIP Customer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {customer.orders && customer.orders.length > 0 ? (
                customer.orders.map((o: any) => (
                  <div key={o.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">{o.orderNumber}</span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">{new Date(o.createdAt).toLocaleString()} • {o.items?.length || 1} item(s)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm block">{formatCurrency(o.totalAmount)}</span>
                      <div className="flex gap-1.5 justify-end mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                          {o.paymentStatus}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                          {o.fulfilmentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No orders found.</p>
              )}
            </div>
          )}

          {/* TAB 4: ENTITLEMENTS */}
          {activeTab === 'entitlements' && (
            <div className="space-y-3">
              {customer.purchases && customer.purchases.length > 0 ? (
                customer.purchases.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.product?.thumbnail || p.bundle?.coverImage || '/placeholder.png'}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100"
                      />
                      <div>
                        <span className="font-bold text-slate-900">{p.product?.name || p.bundle?.title}</span>
                        <span className="text-slate-500 block text-[11px]">Downloads Used: {p.downloadCount || 0}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.accessStatus}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No active entitlements found.</p>
              )}
            </div>
          )}

          {/* TAB 5: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-2">
              {customer.downloadHistory && customer.downloadHistory.length > 0 ? (
                customer.downloadHistory.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{new Date(d.downloadedAt).toLocaleString()}</span>
                      <span className="text-slate-500 block text-[11px]">IP: {d.ipAddress || '127.0.0.1'} • {d.userAgent?.slice(0, 35) || 'Browser'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      d.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {d.result}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No downloads recorded.</p>
              )}
            </div>
          )}

          {/* TAB 6: LICENCES */}
          {activeTab === 'licences' && (
            <div className="space-y-2">
              {customer.licenceKeys && customer.licenceKeys.length > 0 ? (
                customer.licenceKeys.map((l: any) => (
                  <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{l.keyMasked}</span>
                      <span className="text-slate-500 block text-[11px]">Tier: {l.licenceType} • Activations: {l.activationCount}/{l.activationLimit}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {l.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No licence keys issued.</p>
              )}
            </div>
          )}

          {/* TAB 7: CONSENT REGISTRY */}
          {activeTab === 'consents' && (
            <div className="space-y-3">
              {[
                { type: 'TRANSACTIONAL_EMAIL', label: 'Transactional Email (Order & Access Delivery)' },
                { type: 'MARKETING_EMAIL', label: 'Marketing Newsletters & Promotions' },
                { type: 'WHATSAPP_MARKETING', label: 'WhatsApp Updates & Offers' },
                { type: 'PRODUCT_UPDATES', label: 'Product Version & Critical Updates' },
                { type: 'REVIEW_REQUESTS', label: 'Post-Purchase Review Invitations' }
              ].map(cType => {
                const record = customer.consents?.find((c: any) => c.consentType === cType.type);
                const isOptedIn = record?.status === 'OPTED_IN';
                return (
                  <div key={cType.type} className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{cType.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Source: {record?.source || 'SYSTEM'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateConsent(cType.type, isOptedIn ? 'OPTED_OUT' : 'OPTED_IN')}
                      disabled={actionLoading}
                      className={`px-3 py-1 rounded-xl font-bold text-[11px] cursor-pointer transition-colors ${
                        isOptedIn ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                      }`}
                    >
                      {isOptedIn ? 'Opted In (Click to Revoke)' : 'Opted Out (Click to Grant)'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 8: TAGS */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {customer.customerTags && customer.customerTags.length > 0 ? (
                  customer.customerTags.map((t: any) => (
                    <span key={t.id} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold text-xs flex items-center gap-1.5">
                      #{t.tag?.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t.tagId)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-slate-400">No tags currently assigned.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="font-bold text-slate-900 block">Add Customer Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer support context, billing arrangements..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading || !newNote.trim()}
                    className="px-4 py-1.5 bg-primary text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {customer.customerNotes?.map((n: any) => (
                  <div key={n.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{n.authorName} ({n.noteType})</span>
                      <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Chronological Timeline</h4>
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {customer.timelineEvents?.map((evt: any) => (
                  <div key={evt.id} className="relative text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{evt.eventType}</span>
                      <span className="text-[10px] text-slate-400">{new Date(evt.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-2">
              {customer.customerAuditLogs?.map((log: any) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-500 block text-[11px]">{log.reason} • Actor: {log.actorEmail}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* BLOCK MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <h3 className="font-black text-rose-900 text-base">Block Customer Account</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Block Scope</label>
              <select
                value={blockScope}
                onChange={(e) => setBlockScope(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="FULL">Full Account Block</option>
                <option value="LOGIN">Block Login Only</option>
                <option value="PURCHASES">Block Purchases</option>
                <option value="DOWNLOADS">Block Downloads</option>
                <option value="LICENCES">Block Licences</option>
                <option value="MARKETING">Block Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Chargeback dispute / Fraudulent activity..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="flex-1 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockCustomer}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TAG MODAL */}
      {showTagModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base">Assign Customer Tag</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. vip, agency, beta-user, freelancer"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                className="flex-1 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTag}
                disabled={actionLoading}
                className="flex-1 py-2 bg-primary text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Assign Tag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
