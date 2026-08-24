import { useState, useEffect, useRef } from 'react';
import { Save, Mail, MapPin, Clock, HelpCircle, Book, Search, Ticket, Eye, CheckCircle2, AlertCircle, X, Send, Package, Filter, MessageSquare, AlertTriangle, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface SettingItem {
  key: string;
  value: any;
  group: string;
}

export default function AdminSupportPage() {
  const [settings, setSettings] = useState({
    support_email: '',
    support_email_description: '',
    support_phone: '',
    support_phone_description: '',
    business_hours: '',
    business_hours_description: '',
    office_location: '',
    office_location_description: '',
    faq_link: '',
    kb_link: '',
    support_message_count: 0
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State for Viewing Full Support Message
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSettings();
    fetchTickets();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success && res.data.data.length > 0) {
        const fetched: any = { ...settings };
        res.data.data.forEach((s: SettingItem) => {
          if (Object.keys(settings).includes(s.key)) {
            fetched[s.key] = s.value;
          }
        });
        setSettings(fetched);
      }
    } catch (_err) {
      toast.error('Failed to load support page settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/support/admin/tickets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });
      if (res.data && res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch support messages:", err);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      setSelectedTicketId(id);
      const res = await axios.get(`/api/support/tickets/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });
      if (res.data.success) {
        setTicketDetails(res.data.ticket);
      }
    } catch (err: any) {
      toast.error('Failed to load message details');
      setSelectedTicketId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticketDetails) return;

    setIsReplying(true);
    try {
      const res = await axios.post(`/api/support/tickets/${ticketDetails.id}/messages`, {
        message: replyMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true 
      });

      if (res.data.success) {
        setReplyMessage('');
        fetchTicketDetails(ticketDetails.id);
        fetchTickets();
        toast.success('Reply sent');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketDetails) return;
    
    setIsUpdatingStatus(true);
    try {
      const res = await axios.patch(`/api/support/admin/tickets/${ticketDetails.id}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true 
      });

      if (res.data.success) {
        fetchTicketDetails(ticketDetails.id);
        fetchTickets();
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err: any) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;
    try {
      const res = await axios.delete(`/api/support/admin/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success("Response deleted successfully");
        if (selectedTicketId) fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete response");
    }
  };

  const handleSave = async () => {
    if (settings.support_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.support_email)) {
        toast.error('Please enter a valid support email.');
        return;
      }
    }

    setSaving(true);
    try {
      const updates = [
        { key: 'support_email', value: settings.support_email, group: 'support' },
        { key: 'business_hours', value: settings.business_hours, group: 'support' },
        { key: 'office_location', value: settings.office_location, group: 'support' },
        { key: 'faq_link', value: settings.faq_link, group: 'support' },
        { key: 'kb_link', value: settings.kb_link, group: 'support' },
      ];

      const res = await axios.put('/api/admin/settings', updates, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success('Support page settings updated');
      }
    } catch (_err) {
      toast.error('Failed to update support page settings');
    } finally {
      setSaving(false);
    }
  };

  const isTicketOpen = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'OPEN' || s === 'IN_PROGRESS' || s === 'IN PROGRESS' || s === 'WAITING_FOR_CUSTOMER';
  };

  const isTicketResolved = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'RESOLVED' || s === 'CLOSED';
  };

  const filteredTickets = tickets.filter(t => {
    const customerName = t.user?.name || 'Unknown';
    const email = t.user?.email || '';
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch = 
      !query ||
      (t.ticketNumber || '').toLowerCase().includes(query) ||
      (t.subject || '').toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query) ||
      customerName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      (t.category || '').toLowerCase().includes(query);

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'open' ? isTicketOpen(t.status) :
      statusFilter === 'resolved' ? isTicketResolved(t.status) : true;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'OPEN' || s === 'IN_PROGRESS' || s === 'IN PROGRESS') {
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={12} /> {status.replace('_', ' ')}</span>;
    }
    if (s === 'WAITING_FOR_CUSTOMER') {
      return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={12} /> Waiting on Cust</span>;
    }
    if (s === 'RESOLVED' || s === 'CLOSED') {
      return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12} /> {status}</span>;
    }
    return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold w-max">{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Support Page</h1>
          <p className="text-slate-500 mt-1">View submitted customer support messages and configure page content.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={saving}
          className="gap-2"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Support Messages Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl border p-6 flex items-center justify-between shadow-sm cursor-pointer hover:border-primary transition-all ${statusFilter === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'}`}
          title="Click to view all support messages"
        >
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Support Messages</h2>
            <p className="text-3xl font-black text-slate-900 mt-1">{tickets.length}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Mail size={24} />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('open')}
          className={`bg-white rounded-2xl border p-6 flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-500 transition-all ${statusFilter === 'open' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'}`}
          title="Click to filter by open inquiries"
        >
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Inquiries</h2>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {tickets.filter(t => isTicketOpen(t.status)).length}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('resolved')}
          className={`bg-white rounded-2xl border p-6 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-500 transition-all ${statusFilter === 'resolved' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}
          title="Click to filter by resolved messages"
        >
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Messages</h2>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {tickets.filter(t => isTicketResolved(t.status)).length}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* SECTION: Submitted Support Messages List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="text-primary" size={20} />
              Received Support Messages & Inquiries
            </h2>
            <p className="text-sm text-slate-500">All data submitted via the public Contact Support form.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Messages</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Data Table of Support Messages */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer Name & Email</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date Submitted</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">View Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Mail size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-medium">No support messages found.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} onClick={() => fetchTicketDetails(t.id)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{t.user?.name || 'Customer'}</p>
                      <p className="text-xs text-slate-500">{t.user?.email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md text-xs">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 max-w-xs truncate" title={t.subject}>
                        {t.subject}
                      </p>
                      <p className="text-xs text-slate-500 max-w-xs truncate">{t.description}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {t.order?.orderNumber || (t.orderId ? t.orderId : 'N/A')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchTicketDetails(t.id);
                        }}
                        className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View Full Message & Respond"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer showing count (No Prev/Next buttons) */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <span>Showing {filteredTickets.length} of {tickets.length} total messages</span>
        </div>
      </div>

      {/* SECTION: Contact Information Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>
          <p className="text-sm text-slate-500">Configure how customers can reach you on the Contact page.</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Support Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="support@kanishkdigital.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Hours</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Clock size={20} />
              </div>
              <input
                type="text"
                value={settings.business_hours}
                onChange={(e) => setSettings({...settings, business_hours: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Mon–Fri, 9:00 AM – 6:00 PM IST"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Office Location</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin size={20} />
              </div>
              <input
                type="text"
                value={settings.office_location}
                onChange={(e) => setSettings({...settings, office_location: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Bangalore, India"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Support Message Detail Modal */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {loadingDetails ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                Loading support message details...
              </div>
            ) : ticketDetails ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500">{ticketDetails.ticketNumber}</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{ticketDetails.subject}</h2>
                  </div>
                  <button onClick={() => setSelectedTicketId(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                  {/* Customer & Message Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Name</div>
                      <div className="font-bold text-slate-900">{ticketDetails.user?.name || 'N/A'}</div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</div>
                      <div className="font-medium text-slate-700">{ticketDetails.user?.email || 'N/A'}</div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</div>
                      <div className="font-semibold text-primary">{ticketDetails.category}</div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</div>
                      <div className="font-mono font-medium text-slate-700">
                        {ticketDetails.order?.orderNumber || ticketDetails.orderId || 'None provided'}
                      </div>
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Message Status</span>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(ticketDetails.status)}
                      <select 
                        value={ticketDetails.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdatingStatus}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-primary" /> Customer Inquiry Message / Description
                    </div>
                    <div className="text-base text-slate-900 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {ticketDetails.description}
                    </div>
                  </div>

                  {/* Conversation Replies if any */}
                  {ticketDetails.messages && ticketDetails.messages.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responses & History</div>
                      {ticketDetails.messages.map((m: any) => {
                        const isAdminMsg = m.senderType === 'ADMIN' || 
                                          (m.sender?.role && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(String(m.sender.role).toUpperCase()));
                        return (
                          <div key={m.id} className={`p-4 rounded-2xl border text-sm ${isAdminMsg ? 'bg-primary/5 border-primary/20 ml-6' : 'bg-white border-slate-200 mr-6'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900">{m.sender?.name} ({isAdminMsg ? 'ADMIN' : 'CUSTOMER'})</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                                <button 
                                  onClick={() => handleDeleteMessage(m.id)}
                                  className="p-1 text-slate-400 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                                  title="Delete Response"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{m.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Box */}
                  <form onSubmit={handleReply} className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Send Reply to Customer</label>
                    <textarea 
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isReplying || !replyMessage.trim()}
                        className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        <Send size={16} />
                        {isReplying ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">Error loading message</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

