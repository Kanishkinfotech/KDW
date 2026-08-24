import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Ticket, ArrowLeft, Clock, CheckCircle2, AlertCircle, MessageSquare, Send, Package, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const { authState, user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authState === 'unauthenticated') {
      navigate('/login?redirect=/support/my-tickets');
    }
  }, [authState, navigate]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/support/tickets/${id}`, {
        withCredentials: true
      });
      if (res.data.success) {
        setTicket(res.data.ticket);
      } else {
        setError('Failed to load ticket.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && authState === 'authenticated') {
      fetchTicket();
      window.scrollTo(0, 0); // Ensure the page starts at the top
    }
  }, [id, authState]);

  useEffect(() => {
    // Scroll to bottom of messages when ticket loads or updates
    // Using scroll container to prevent the whole window from scrolling down
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [ticket?.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const res = await axios.post(`/api/support/tickets/${id}/messages`, {
        message: replyMessage
      }, { withCredentials: true });

      if (res.data.success) {
        setReplyMessage('');
        fetchTicket(); // Refresh to get updated status and new message
        toast.success('Reply sent successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
      case 'OPEN':
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={14} /> {status.replace('_', ' ')}</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14} /> Action Required</span>;
      case 'RESOLVED':
      case 'CLOSED':
        return <span className="px-3 py-1 bg-success/10 text-success-dark rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={14} /> {status}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold w-max">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'urgent': return 'text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100';
      case 'high': return 'text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100';
      case 'normal': return 'text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100';
      case 'low': return 'text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200';
      default: return 'text-slate-500';
    }
  };

  if (loading && !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6 flex items-center justify-center">
        <div className="text-slate-500 font-medium animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
          Loading ticket details...
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center mt-20 bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ticket Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "The ticket you're looking for doesn't exist or you don't have permission to view it."}</p>
          <Link to="/support/my-tickets" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
            Return to My Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <SEO title={`Ticket ${ticket.ticketNumber} | Support`} description="View your support ticket details." />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/support/my-tickets" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
            <ArrowLeft size={18} /> Back to My Tickets
          </Link>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded border border-slate-200 shadow-sm">
                  {ticket.ticketNumber}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority} Priority
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {ticket.subject}
              </h1>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {getStatusBadge(ticket.status)}
              <span className="text-sm font-medium text-slate-500">
                Created on {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Details & Description */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare size={16} /> Description
              </h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                {ticket.description}
              </div>
            </div>
            
            <div className="w-full md:w-1/3 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Category</h3>
                <p className="text-slate-800 font-medium bg-slate-50 px-4 py-2 rounded-xl inline-block border border-slate-100">{ticket.category}</p>
              </div>
              
              {ticket.order && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Linked Order</h3>
                  <Link to={`/dashboard?tab=purchases`} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100 group">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{ticket.order.orderNumber}</div>
                      <div className="text-xs text-slate-500">View Order Details</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
