import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Star, CheckCircle2, LifeBuoy, 
  User, Shield, Clock, AlertCircle, Sparkles, MessageSquare 
} from 'lucide-react';
import SEO from '../../components/SEO';
import { SupportStatusBadge } from '../../components/admin/support/SupportStatusBadge';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
      const res = await axios.get('/api/support/tickets/' + id);
      if (res.data?.success) {
        setTicket(res.data.ticket);
        if (res.data.ticket.satisfaction) {
          setSurveySubmitted(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticket) return;

    setSending(true);
    try {
      const res = await axios.post('/api/support/tickets/' + ticket.id + '/reply', {
        message: replyMessage.trim()
      });
      if (res.data?.success) {
        setReplyMessage('');
        toast.success('Reply posted.');
        fetchTicket();
      } else {
        toast.error(res.data?.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error posting message');
    } finally {
      setSending(false);
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setSubmittingSurvey(true);
    try {
      const res = await axios.post('/api/support/satisfaction', {
        ticketId: ticket.id,
        rating,
        comment: comment.trim() || undefined
      });
      if (res.data?.success) {
        setSurveySubmitted(true);
        toast.success('Thank you for your feedback!');
      } else {
        toast.error(res.data?.message || 'Failed to submit feedback');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error submitting feedback');
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b21b6]"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#faf9f7] py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-[#171325]">Ticket Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
          The requested ticket does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/support/tickets"
          className="inline-block px-5 py-2.5 text-xs font-bold text-white bg-[#5b21b6] rounded-xl"
        >
          &larr; Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171325] font-sans pb-24">
      <SEO 
        title={'Ticket #' + (ticket.ticketNumber || ticket.id) + ' | KDW Support'} 
        description={ticket.subject} 
      />

      {/* Top Navigation */}
      <div className="pt-8 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0] bg-white">
        <div className="max-w-[860px] mx-auto space-y-4">
          <Link
            to="/support/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#5b21b6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Tickets
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-[#5b21b6] text-xs px-2.5 py-0.5 bg-[#ede9fe] rounded-md">
                  #{ticket.ticketNumber || ticket.id}
                </span>
                <SupportStatusBadge status={ticket.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                {ticket.subject}
              </h1>
              <p className="text-xs text-slate-500">
                Opened on {new Date(ticket.createdAt).toLocaleString()} &bull; Category: <strong className="text-slate-700">{ticket.category}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Conversation Stream */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversation Thread</span>
          </div>

          {/* Initial Ticket Description Message */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{ticket.customerName || 'Customer'}</span>
                  <span className="text-[10px] text-slate-400">Original Inquiry</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">{new Date(ticket.createdAt).toLocaleTimeString()}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
              {ticket.description || ticket.subject}
            </p>
          </div>

          {/* Subsequent Conversation Messages */}
          {(ticket.messages || []).map((msg: any) => {
            const isStaff = msg.senderType === 'STAFF' || msg.senderType === 'SYSTEM';
            return (
              <div
                key={msg.id}
                className={'rounded-3xl p-6 sm:p-8 border shadow-2xs space-y-3 ' + (
                  isStaff
                    ? 'bg-[#f5f3ff] border-[#ddd6fe]'
                    : 'bg-white border-[#e2e8f0]'
                )}
              >
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ' + (
                      isStaff ? 'bg-[#5b21b6] text-white' : 'bg-[#ede9fe] text-[#5b21b6]'
                    )}>
                      {isStaff ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {msg.senderName || (isStaff ? 'KDW Support Agent' : 'Customer')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {isStaff ? 'Official Staff Response' : 'Customer Reply'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Submission Box */}
        {ticket.status !== 'CLOSED' ? (
          <form onSubmit={handleSendReply} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#5b21b6]" />
              <span>Send a Reply</span>
            </h3>

            <textarea
              required
              rows={4}
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
              placeholder="Type your response here..."
              className="w-full text-xs p-3.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none resize-y"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="px-6 py-2.5 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {sending ? 'Posting...' : 'Send Reply'} <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs text-slate-500">
            This support ticket is marked as closed. If you have a new question, please open a new ticket.
          </div>
        )}

        {/* Satisfaction Survey (CSAT) */}
        {ticket.status === 'RESOLVED' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 bg-amber-50/20 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-[#171325]">
                How satisfied were you with our support?
              </h3>
              <p className="text-xs text-slate-500">
                Your feedback helps us continuously refine our resolution speeds and quality.
              </p>
            </div>

            {surveySubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your feedback has been recorded.</span>
              </div>
            ) : (
              <form onSubmit={handleSurveySubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={'p-1.5 rounded-lg transition-transform hover:scale-110 cursor-pointer ' + (
                        star <= rating ? 'text-amber-500' : 'text-slate-300'
                      )}
                    >
                      <Star className={'w-6 h-6 ' + (star <= rating ? 'fill-amber-500' : '')} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} of 5 stars</span>
                </div>

                <textarea
                  rows={2}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Optional comment or suggestions..."
                  className="w-full text-xs p-3 bg-white border border-[#e2e8f0] focus:border-[#5b21b6] rounded-xl font-sans focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={submittingSurvey}
                  className="px-5 py-2 bg-[#5b21b6] text-white text-xs font-bold rounded-xl hover:bg-[#6d28d9] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingSurvey ? 'Submitting...' : 'Submit Rating'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
