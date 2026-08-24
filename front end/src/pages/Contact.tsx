import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Clock, Send, AlertCircle, CheckCircle2, Phone, MessageSquare, Package, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderId: orderIdParam || '',
    subject: '',
    categoryId: orderIdParam ? 'order' : 'general',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingMyTickets, setLoadingMyTickets] = useState(false);
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [supportSettings, setSupportSettings] = useState({
    support_email: 'support@kanishkdigital.com',
    support_email_description: 'Our primary support channel.',
    support_phone: '+91 98765 43210',
    support_phone_description: 'Call us during business hours for urgent assistance.',
    business_hours: 'Mon–Fri, 9:00 AM – 6:00 PM IST',
    business_hours_description: 'Our support team is available during these hours.',
    office_location: 'Bangalore, India',
    office_location_description: 'Our primary office and support operations location.',
    faq_link: '/faq',
    kb_link: '/docs'
  });

  const fetchMyTickets = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingMyTickets(true);
      const res = await axios.get('/api/support/tickets/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });
      if (res.data && res.data.success) {
        setMyTickets(res.data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch user support tickets', error);
    } finally {
      setLoadingMyTickets(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
      fetchMyTickets();
    }

    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings/public');
        if (res.data.success && res.data.data) {
          setSupportSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (error) {
        console.error('Failed to fetch support settings', error);
      }
    };
    fetchSettings();
  }, [isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('You must be logged in to submit a support ticket via this form.');
      navigate('/login?redirect=/contact');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/support/tickets', {
        subject: formData.subject,
        category: formData.categoryId === 'general' ? 'General' : 
                  formData.categoryId === 'product' ? 'Product' :
                  formData.categoryId === 'order' ? 'Orders' :
                  formData.categoryId === 'payment' ? 'Billing' :
                  formData.categoryId === 'download' ? 'Downloads' :
                  formData.categoryId === 'license' ? 'Licenses' :
                  formData.categoryId === 'refund' ? 'Refunds' :
                  formData.categoryId === 'technical' ? 'Technical' : 'Other',
        priority: 'Normal',
        description: formData.message,
        orderId: formData.orderId || undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });
      
      if (res.data.success) {
        toast.success('Your support message has been submitted!');
        setFormData(prev => ({
          ...prev,
          subject: '',
          message: '',
          orderId: ''
        }));
        fetchMyTickets();
      }
    } catch (error: any) {
      console.error('Failed to submit contact form', error);
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerReply = async (ticketId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setIsSendingReply(true);
      const res = await axios.post(`/api/support/tickets/${ticketId}/messages`, {
        message: replyText
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });

      if (res.data.success) {
        toast.success('Reply sent');
        setReplyText('');
        setReplyingTicketId(null);
        fetchMyTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'OPEN':
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-xs flex items-center gap-1"><AlertCircle size={12} /> {status.replace('_', ' ')}</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Action Needed</span>;
      case 'RESOLVED':
      case 'CLOSED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs flex items-center gap-1"><CheckCircle2 size={12} /> {status}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen py-16 px-6 bg-slate-50/50 pb-24">
      <SEO title="Contact Us | Kanishk Digital World" description="Need help? Contact the Kanishk Digital World support team." />
      
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Contact Kanishk Digital World</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Need help with a product, order, download, payment, licence, or another KDW service? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          {/* Contact Form */}
          <div>
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
              
              {!isAuthenticated && (
                <div className="flex items-start gap-3 bg-amber-50 text-amber-800 p-4 rounded-xl mb-8 border border-amber-200">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold mb-1">You are not logged in.</p>
                    <p>To submit a support ticket via this form, please <Link to="/login?redirect=/contact" className="underline font-bold text-amber-900 hover:text-amber-950">log in</Link> first. Alternatively, you can email us directly at support@kanishkdigital.com.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Your Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      required 
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isAuthenticated}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      required 
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isAuthenticated}
                      readOnly={isAuthenticated}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed font-medium" 
                      placeholder="john@example.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Category *</label>
                    <select 
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="product">Product Question</option>
                      <option value="order">Order Issue</option>
                      <option value="payment">Payment Issue</option>
                      <option value="download">Download Issue</option>
                      <option value="license">License Question</option>
                      <option value="refund">Refund Request</option>
                      <option value="technical">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="e.g. ORD-12345678" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Subject *</label>
                  <input 
                    type="text" 
                    name="subject"
                    required 
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="Brief summary of your inquiry" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Message *</label>
                  <textarea 
                    name="message"
                    required 
                    rows={6} 
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none" 
                    placeholder="Please describe your issue or question in detail..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={18} /> Send Message
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* SECTION: Submitted Messages & Admin Panel Replies */}
        {isAuthenticated && (
          <div className="max-w-6xl mx-auto mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <MessageSquare className="text-primary" size={28} />
                  Your Support Messages
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Sent by account: <span className="font-bold text-slate-700">{user?.name} ({user?.email})</span>
                </p>
              </div>
              <button 
                onClick={fetchMyTickets} 
                disabled={loadingMyTickets}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw size={14} className={loadingMyTickets ? 'animate-spin' : ''} />
                Refresh Replies
              </button>
            </div>

            {loadingMyTickets ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                Loading your support history...
              </div>
            ) : myTickets.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                <Mail size={40} className="mx-auto text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-lg">No support messages submitted yet</h3>
                <p className="text-sm mt-1">When you submit a message using the form above, it will appear here along with replies from our support team.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                    {/* Ticket Summary Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{ticket.ticketNumber}</span>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-full text-xs">
                            {ticket.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">{ticket.subject}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    {/* Customer's Original Sent Message */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs uppercase">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{user?.name} ({user?.email})</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                      {ticket.order?.orderNumber && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Package size={14} className="text-slate-400" /> Linked Order: {ticket.order.orderNumber}
                        </div>
                      )}
                    </div>

                    {/* Support Team Replies & Conversation History */}
                    {ticket.messages && ticket.messages.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <MessageSquare size={14} className="text-primary" /> Support Team Responses & Conversation
                        </h4>
                        {ticket.messages.map((msg: any) => {
                          const isAdmin = msg.senderType === 'ADMIN' || 
                                          (msg.sender?.role && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(String(msg.sender.role).toUpperCase()));
                          return (
                            <div 
                              key={msg.id} 
                              className={`p-5 rounded-2xl border ${
                                isAdmin 
                                  ? 'bg-primary/5 border-primary/20 ml-4 md:ml-8' 
                                  : 'bg-slate-50 border-slate-200 mr-4 md:mr-8'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isAdmin ? (
                                    <span className="px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                                      <ShieldCheck size={13} /> Support Team
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-800">{msg.sender?.name || user?.name}</span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic bg-amber-500/5 p-4 rounded-2xl border border-amber-200/60 flex items-center gap-2">
                        <Clock size={16} className="text-amber-600 shrink-0" />
                        <span>Waiting for a response from our support team. Replies will be displayed right here as soon as sent.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


