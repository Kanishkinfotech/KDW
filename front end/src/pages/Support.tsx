import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, Download, ShieldCheck, Send, CheckCircle2, 
  RefreshCw, MessageSquare, ArrowRight, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import SEO from '../components/SEO';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Mail, Phone, Clock, MapPin } from 'lucide-react';

export default function Support() {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    message: '',
    orderId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill out all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/support/tickets', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        message: formData.message,
        orderId: formData.orderId || undefined
      });

      if (res.data?.success && res.data.data) {
        setSubmittedTicket(res.data.data);
        toast.success(`Support ticket ${res.data.data.ticketNumber || res.data.data.id} recorded`);
      } else {
        toast.error(res.data?.message || 'Failed to submit ticket');
      }
    } catch (err: any) {
      console.error('Support ticket error:', err);
      toast.error(err.response?.data?.message || 'Error submitting support inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-12 lg:py-16">
      <SEO 
        title="Support & Assistance | KDW" 
        description="A clearer route to an answer. Contact KDW support for help with downloads, licences, and technical products."
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="space-y-3 max-w-2xl">
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            CUSTOMER ASSISTANCE
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#171325] leading-tight">
            A clearer route to an answer.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Need help with an existing purchase, download access, or licensing guidelines? Our support queue operates with structured resolution SLA targets.
          </p>
        </div>

        {/* Two-Column Support Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Side: Three Stacked White Mini-Cards */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Card 1: Product Questions */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#171325]">
                Product questions
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Compatibility, software requirements, included source assets, and customization questions.
              </p>
            </div>

            {/* Card 2: Download Help */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#171325]">
                Download help
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Expired link regeneration, access token renewals, Google Drive permissions, and ZIP integrity checks.
              </p>
            </div>

            {/* Card 3: Licences & Policies */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#171325]">
                Licences & policies
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Commercial deployment boundaries, multi-client usage rights, refunds, and terms of service.
              </p>
            </div>

            {/* Card 4: Live Direct Contact Points */}
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-3">
              <h3 className="text-sm font-serif font-bold text-[#171325] border-b border-slate-100 pb-2">
                Direct Contact Channels
              </h3>
              <div className="space-y-2 text-xs font-sans text-slate-600">
                {settings?.support_email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-[#5b21b6] shrink-0" />
                    <a href={`mailto:${settings.support_email}`} className="hover:text-[#5b21b6] transition-colors font-medium">
                      {settings.support_email}
                    </a>
                  </div>
                )}
                {settings?.support_phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-[#5b21b6] shrink-0" />
                    <a href={`tel:${settings.support_phone}`} className="hover:text-[#5b21b6] transition-colors font-medium">
                      {settings.support_phone}
                    </a>
                  </div>
                )}
                {settings?.business_hours && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-[#5b21b6] shrink-0" />
                    <span className="text-slate-500">{settings.business_hours}</span>
                  </div>
                )}
                {settings?.office_location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#5b21b6] shrink-0" />
                    <span className="text-slate-500">{settings.office_location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-sans space-y-1">
              <div className="font-bold text-[#171325]">Self-Service Knowledge Base</div>
              <p className="text-[11px] text-slate-400">
                Browse our published FAQs for immediate answers to common technical questions.
              </p>
              <Link to="/faq" className="inline-block text-[#5b21b6] font-semibold text-xs pt-1 hover:underline">
                View Frequently Asked Questions →
              </Link>
            </div>

          </div>

          {/* Right Side: Large Rounded Support Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#e2e8f0] shadow-xs">
            
            {submittedTicket ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#171325]">
                  Support Ticket Recorded
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
                  Your inquiry has been assigned reference <span className="font-mono font-bold text-[#5b21b6]">{submittedTicket.ticketNumber || submittedTicket.id}</span>. Our support team will review your details and respond directly.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        subject: '',
                        category: 'GENERAL_INQUIRY',
                        priority: 'MEDIUM',
                        message: '',
                        orderId: ''
                      });
                    }}
                    className="px-6 py-2.5 rounded-full border border-[#e2e8f0] text-xs font-semibold text-slate-700 hover:bg-slate-50 font-sans transition-all"
                  >
                    Submit another inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
                    HELP DESK FORM
                  </span>
                  <h2 className="text-xl font-serif font-bold text-[#171325] mt-1">
                    Describe your request
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 font-sans">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vishwa Sharma"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 font-sans">
                      Contact Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 font-sans">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans text-slate-800 focus:outline-none focus:border-[#5b21b6]"
                    >
                      <option value="GENERAL_INQUIRY">Product Questions & Clarifications</option>
                      <option value="DOWNLOAD_ACCESS">Download Delivery & Token Access</option>
                      <option value="LICENSING_TERMS">Commercial Licences & Policies</option>
                      <option value="ORDER_ISSUE">Order & Payment Verification</option>
                      <option value="TECHNICAL_BUG">Bug Report & Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 font-sans">
                      Order Reference (If Applicable)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-1724819..."
                      value={formData.orderId}
                      onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">
                    Subject Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your question or issue"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">
                    Detailed Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Provide full context, affected files, or specific questions..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs font-sans placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans tracking-wide uppercase flex items-center justify-center gap-2 transition-all kdw-button-press shadow-md"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Submit support request</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
