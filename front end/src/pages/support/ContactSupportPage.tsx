import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle2, LifeBuoy, AlertCircle, ArrowLeft } from 'lucide-react';
import SEO from '../../components/SEO';

export default function ContactSupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [queryType, setQueryType] = useState('GENERAL');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSending(true);
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          queryType,
          orderNumber,
          subject: subject || `Inquiry from ${name}`,
          message
        })
      });

      const json = await res.json();
      if (json.success) {
        setTicketResult(json);
      } else {
        alert(json.message || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to support service.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO title="Contact Customer Support | Kanishk Digital World" description="Submit an inquiry to KDW customer support." />

      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          to="/support"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Support Hub
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-xs space-y-6">
          {ticketResult ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Support Inquiry Registered</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your ticket has been generated under ticket number{' '}
                <strong className="font-mono text-blue-600">{ticketResult.ticketNumber}</strong>.
                Our team will review your inquiry and dispatch a response to <strong>{email}</strong> ({ticketResult.expectedResponseTime}).
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link
                  to="/support/my-tickets"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-all"
                >
                  View My Tickets
                </Link>
                <button
                  onClick={() => {
                    setTicketResult(null);
                    setSubject('');
                    setMessage('');
                  }}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 pb-4">
                <h1 className="text-2xl font-black text-slate-900">Contact Support</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Have a question regarding your order, licensing, or custom work? Submit an inquiry below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Inquiry Category</label>
                    <select
                      value={queryType}
                      onChange={e => setQueryType(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="GENERAL">General Support</option>
                      <option value="DOWNLOAD_ISSUE">Download / Fulfillment Issue</option>
                      <option value="LICENCE_ISSUE">Licence & Activation</option>
                      <option value="REFUND_REQUEST">Refund / Billing Request</option>
                      <option value="PAYMENT_QUERY">Payment Query</option>
                      <option value="PARTNERSHIP">Agency / Partnership Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Order Number (Optional)</label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                      placeholder="e.g. KDW-8821"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief summary of your question..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Detailed Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 px-6 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Registering Inquiry...' : 'Submit Support Inquiry'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
