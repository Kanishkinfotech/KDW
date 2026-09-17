import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, Mail, User, ShieldAlert, FileText, Search, Trash2, CheckCircle, 
  CheckCheck, RefreshCw, Send, Plus, ExternalLink, Filter, Sparkles, Clock, AlertTriangle, ShoppingBag, Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

type TabType = 'all' | 'mail' | 'customer' | 'admin' | 'templates';

export default function AdminNotifications() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getActiveTabFromPath = (): TabType => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/notifications/mail')) return 'mail';
    if (path.includes('/notifications/customer')) return 'customer';
    if (path.includes('/notifications/admin')) return 'admin';
    if (path.includes('/notifications/templates')) return 'templates';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromPath());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, mail: 0, customer: 0, admin: 0, unread: 0, templates: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, UNREAD, READ

  // Template Editing Modal State
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // New Notification Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<'Mail' | 'Customer' | 'Admin'>('Admin');
  const [newLink, setNewLink] = useState('');
  const [creating, setCreating] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const categoryParam = activeTab === 'all' || activeTab === 'templates' ? '' : `category=${activeTab}`;
      const url = `/api/admin/notifications?${categoryParam}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(res.data.data || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (_err) {
      toast.error('Failed to fetch notifications', { id: 'notif-fetch-error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/admin/notifications/templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setTemplates(res.data.data || []);
      }
    } catch (_err) {
      console.error('Failed to fetch templates', _err);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
      setLoading(false);
    } else {
      fetchNotifications();
    }
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'all') navigate('/admin/notifications');
    else if (tab === 'mail') navigate('/admin/notifications/mail');
    else if (tab === 'customer') navigate('/admin/notifications/customer');
    else if (tab === 'admin') navigate('/admin/notifications/admin');
    else if (tab === 'templates') navigate('/admin/notifications/templates');
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await axios.patch(`/api/admin/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        setCounts(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        toast.success('Marked as read');
      }
    } catch (_err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await axios.post('/api/admin/notifications/mark-all-read', {
        category: activeTab === 'all' ? undefined : activeTab
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setCounts(prev => ({ ...prev, unread: 0 }));
        toast.success('All notifications marked as read');
      }
    } catch (_err) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const res = await axios.delete(`/api/admin/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(notifications.filter(n => n.id !== id));
        toast.success('Notification deleted');
        fetchNotifications();
      }
    } catch (_err) {
      toast.error('Failed to delete');
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return toast.error('Message is required');

    setCreating(true);
    try {
      const res = await axios.post('/api/admin/notifications', {
        title: newTitle.trim() || undefined,
        message: newMessage.trim(),
        type: newCategory,
        link: newLink.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success('Notification dispatched');
        setShowCreateModal(false);
        setNewTitle('');
        setNewMessage('');
        setNewLink('');
        fetchNotifications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch notification');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setSavingTemplate(true);
    try {
      const res = await axios.patch(`/api/admin/notifications/templates/${editingTemplate.id}`, {
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        isActive: editingTemplate.isActive
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success('Notification template saved');
        setTemplates(templates.map(t => t.id === editingTemplate.id ? res.data.data : t));
        setEditingTemplate(null);
      }
    } catch (_err) {
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      (n.message || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.type || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'UNREAD') return !n.isRead;
    if (selectedFilter === 'READ') return n.isRead;
    return true;
  });

  const getIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('mail') || t.includes('email')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
          <Mail size={18} />
        </div>
      );
    }
    if (t.includes('customer') || t.includes('buyer') || t.includes('order')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
          <User size={18} />
        </div>
      );
    }
    if (t.includes('alert') || t.includes('security') || t.includes('danger')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
        <ShieldAlert size={18} />
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10">
            Categorized channel delivery for Mail, Customer events, Admin alerts, and standardized notification templates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (activeTab === 'templates') fetchTemplates();
              else fetchNotifications();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {activeTab !== 'templates' && notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Send Notification
          </button>
        </div>
      </div>

      {/* 2. The 4 Requested Sub-Tabs (Classification) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/60 no-scrollbar">
        {[
          { id: 'mail', label: 'Mail Notification', icon: Mail, count: counts.mail },
          { id: 'customer', label: 'Customer Notification', icon: User, count: counts.customer },
          { id: 'admin', label: 'Admin Notification', icon: ShieldAlert, count: counts.admin },
          { id: 'templates', label: 'Notification Template', icon: FileText, count: counts.templates || templates.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content */}
      {activeTab === 'templates' ? (
        /* Template Management Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Notification Templates ({templates.length})
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      tpl.category === 'MAIL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      tpl.category === 'CUSTOMER' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {tpl.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">&bull; {tpl.channel}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${tpl.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {tpl.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 italic font-mono">
                    Subject: {tpl.subject}
                  </p>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
                  {tpl.body}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 flex-wrap">
                    {(tpl.variables || []).map((v: string) => (
                      <span key={v} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setEditingTemplate(tpl)}
                    className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                  >
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Notifications List View for (Mail / Customer / Admin) */
        <div className="space-y-4">
          {/* Filter / Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNREAD">Unread Only</option>
                <option value="READ">Read Only</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>

          {/* List Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden min-h-[360px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <span className="text-xs font-semibold">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Bell className="w-12 h-12 mb-3 opacity-20 text-slate-600" />
                <p className="text-sm font-bold text-slate-700">No notifications found</p>
                <p className="text-xs text-slate-400 mt-1">There are currently no events matching this category.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4.5 hover:bg-slate-50/70 transition-colors flex items-start gap-4 ${
                      !n.isRead ? 'bg-blue-50/20 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {n.title && (
                            <h4 className="text-xs font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                              {n.title}
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse"></span>
                              )}
                            </h4>
                          )}
                          <p className={`text-xs leading-relaxed ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-slate-400">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold uppercase text-[10px]">
                              {n.type}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                            {n.link && (
                              <>
                                <span>&bull;</span>
                                <a
                                  href={n.link}
                                  className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  <span>View Details</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Mark as Read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Template Editor</span>
                <h2 className="text-base font-bold text-slate-900">Edit {editingTemplate.name}</h2>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Line</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Notification Body Template</label>
                <textarea
                  rows={5}
                  value={editingTemplate.body}
                  onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-800">Template Active</span>
                <input
                  type="checkbox"
                  checked={editingTemplate.isActive}
                  onChange={e => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
                >
                  {savingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Broadcast Event</span>
                <h2 className="text-base font-bold text-slate-900">Dispatch Notification</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Classification</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="Mail">Mail Notification</option>
                  <option value="Customer">Customer Notification</option>
                  <option value="Admin">Admin Notification</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Title (Optional)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Storage Diagnostics Alert"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Detailed notification content..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Action Link (Optional)</label>
                <input
                  type="text"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  placeholder="/admin/orders or https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {creating ? 'Dispatching...' : 'Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

