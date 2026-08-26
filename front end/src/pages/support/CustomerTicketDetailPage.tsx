import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Star, CheckCircle2, LifeBuoy } from 'lucide-react';
import SEO from '../../components/SEO';
import { SupportStatusBadge } from '../../components/admin/support/SupportStatusBadge';

export default function CustomerTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  // CSAT Survey State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setTicket(json.ticket);
        if (json.ticket.satisfaction) {
          setSurveySubmitted(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyMessage })
      });
      const json = await res.json();
      if (json.success) {
        setReplyMessage('');
        fetchTicket();
      } else {
        alert(json.message || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSurvey(true);
    try {
      const res = await fetch('/api/support/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId: ticket.id, rating, comment })
      });
      const json = await res.json();
      if (json.success) {
        setSurveySubmitted(true);
      } else {
        alert(json.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-800">Support Ticket Not Found</h2>
        <Link to="/support/my-tickets" className="text-xs font-bold text-blue-600 mt-2 inline-block">
          &larr; Back to My Inquiries
        </Link>
      </div>
    );
  }

  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO title={`Ticket #${ticket.ticketNumber} | KDW Support`} description="View ticket conversation." />

      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/support/my-tickets"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Inquiries
        </Link>

        {/* Ticket Header Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono font-bold text-blue-600 text-xs">{ticket.ticketNumber}</span>
            <SupportStatusBadge status={ticket.status} />
          </div>

          <h1 className="text-xl font-black text-slate-900">{ticket.subject}</h1>
          <p className="text-xs text-slate-400">
            Registered on {new Date(ticket.createdAt).toLocaleString()} &bull; Priority: {ticket.priority}
          </p>
        </div>

        {/* CSAT Survey Prompt if Resolved */}
        {isResolved && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md space-y-3 text-xs">
            <h3 className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              This support inquiry has been marked as Resolved
            </h3>

            {surveySubmitted ? (
              <p className="text-blue-100 font-medium">
                Thank you for your feedback! Your satisfaction survey has been submitted.
              </p>
            ) : (
              <form onSubmit={handleSurveySubmit} className="space-y-3 pt-2">
                <p className="text-blue-100">
                  How satisfied are you with the resolution provided by our support team?
                </p>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl transition-all ${
                        rating >= star ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                  <span className="font-bold ml-2">{rating} / 5 Stars</span>
                </div>

                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Optional comment on your experience..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-hidden"
                />

                <button
                  type="submit"
                  disabled={submittingSurvey}
                  className="px-4 py-2 font-bold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all shadow-xs"
                >
                  {submittingSurvey ? 'Submitting...' : 'Submit CSAT Rating'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Conversation Thread */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conversation</h3>

          <div className="space-y-4">
            {(ticket.messages || []).map((msg: any) => {
              const isStaff = msg.senderType === 'AGENT' || msg.senderType === 'SYSTEM';

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                    isStaff
                      ? 'bg-blue-50/75 border-blue-100 text-slate-900'
                      : 'bg-slate-50 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className={isStaff ? 'text-blue-700' : 'text-slate-900'}>
                      {isStaff ? 'KDW Support Specialist' : 'You'}
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          {!isResolved && (
            <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Reply to Agent</label>
              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your response here..."
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !replyMessage.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
