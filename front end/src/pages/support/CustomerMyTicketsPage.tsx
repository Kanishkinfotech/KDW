import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, ArrowLeft, ArrowRight, CheckCircle2, Clock, LifeBuoy } from 'lucide-react';
import SEO from '../../components/SEO';
import { SupportStatusBadge } from '../../components/admin/support/SupportStatusBadge';

export default function CustomerMyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/my-tickets', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setTickets(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO title="My Support Inquiries | Kanishk Digital World" description="Track your submitted tickets and agent replies." />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/support"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Support Hub
          </Link>

          <Link
            to="/contact"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Open New Inquiry
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl font-black text-slate-900">My Support Tickets</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review history and live status updates for all your customer support inquiries.
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Support Tickets Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven't opened any support tickets yet. If you need assistance with an order or product, contact our team.
              </p>
              <Link
                to="/contact"
                className="inline-block mt-2 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl"
              >
                Contact Support
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/support/my-tickets/${t.id}`)}
                  className="py-4 hover:bg-slate-50/75 p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 text-xs">{t.ticketNumber}</span>
                      <SupportStatusBadge status={t.status} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                    <span className="text-[11px] text-slate-400">
                      Opened on {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">
                      View Thread <ArrowRight className="w-3.5 h-3.5" />
                    </span>
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
