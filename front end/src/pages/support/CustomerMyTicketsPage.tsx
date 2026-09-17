import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, ArrowLeft, ArrowRight, CheckCircle2, Clock, 
  LifeBuoy, Sparkles, Plus, AlertCircle 
} from 'lucide-react';
import SEO from '../../components/SEO';
import { SupportStatusBadge } from '../../components/admin/support/SupportStatusBadge';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function CustomerMyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/support/my-tickets');
      if (res.data?.success) {
        setTickets(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const filterOptions = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const filteredTickets = statusFilter === 'ALL'
    ? tickets
    : tickets.filter(t => {
        const s = (t.status || '').toUpperCase();
        if (statusFilter === 'OPEN') return s === 'OPEN' || s === 'NEW';
        if (statusFilter === 'IN_PROGRESS') return s === 'IN_PROGRESS' || s === 'PENDING_FINANCE' || s === 'UNDER_REVIEW';
        if (statusFilter === 'RESOLVED') return s === 'RESOLVED';
        if (statusFilter === 'CLOSED') return s === 'CLOSED';
        return true;
      });

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171325] font-sans pb-24">
      <SEO 
        title="My Support Inquiries | KDW" 
        description="Track your submitted tickets, resolution updates, and conversation history." 
      />

      {/* Top Header */}
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0] bg-white">
        <div className="max-w-[1040px] mx-auto space-y-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/support" className="hover:text-[#5b21b6] transition-colors">Support Center</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">My Tickets</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[10px] font-bold tracking-[0.2em] uppercase">
                <Ticket className="w-3 h-3 text-[#7c3aed]" />
                <span>CUSTOMER TICKETS</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#171325]">
                My Support Inquiries
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-sans">
                Track live status updates and communication threads for your customer support inquiries.
              </p>
            </div>

            <Link
              to="/support/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Open New Ticket
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterOptions.map((opt) => {
            const isSelected = statusFilter === opt;
            const label = opt === 'ALL' ? 'All' : opt === 'IN_PROGRESS' ? 'In Progress' : opt.charAt(0) + opt.slice(1).toLowerCase();
            return (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={'px-4 py-1.5 rounded-full text-xs font-sans font-bold whitespace-nowrap transition-all cursor-pointer ' + (
                  isSelected
                    ? 'bg-[#5b21b6] text-white shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-2xs space-y-4">
          {loading ? (
            <div className="py-16 flex justify-center items-center gap-2 text-slate-400 text-xs">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5b21b6]"></div>
              <span>Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-14 h-14 bg-[#ede9fe] text-[#5b21b6] rounded-2xl flex items-center justify-center mx-auto">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-serif font-bold text-[#171325]">
                  No support tickets found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans leading-relaxed">
                  {statusFilter === 'ALL' 
                    ? "You haven't opened any support requests yet. Reach out if you need assistance with an order, bundle, or license."
                    : "No tickets found matching the '" + statusFilter.toLowerCase() + "' status filter."}
                </p>
              </div>
              <Link
                to="/support/contact"
                className="inline-block px-5 py-2.5 text-xs font-bold text-[#5b21b6] bg-[#ede9fe] hover:bg-[#ddd6fe] rounded-xl transition-all"
              >
                Submit an Inquiry &rarr;
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate('/support/tickets/' + t.id)}
                  className="py-4.5 px-3 hover:bg-[#faf9f7] rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-[#5b21b6] text-xs">
                        #{t.ticketNumber || t.id}
                      </span>
                      <SupportStatusBadge status={t.status} />
                      {t.category && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {t.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors line-clamp-1">
                      {t.subject}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Updated {new Date(t.updatedAt || t.createdAt).toLocaleDateString()} &bull; {t.messages?.length || 1} messages
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#5b21b6] shrink-0 self-end sm:self-center">
                    <span>View Thread</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
