import { useState, useEffect } from 'react';
import { Ticket, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import Button from '../components/Button';

export default function MyTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const {} = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get('/api/support/tickets/my', {
          withCredentials: true
        });
        if (res.data.success) {
          setTickets(res.data.tickets);
        }
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={14} /> Open</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14} /> Pending</span>;
      case 'resolved':
      case 'closed':
        return <span className="px-3 py-1 bg-success/10 text-success-dark rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> {status}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-slate-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <SEO title="My Tickets | Support" description="View and manage your support tickets." />
      
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Ticket className="text-primary" size={32} />
              My Support Tickets
            </h1>
            <p className="text-slate-500 mt-2">Track the status of your inquiries and communicate with our support team.</p>
          </div>
          <Link to="/support/ticket">
            <Button>Raise New Ticket</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading your tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket size={32} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No tickets yet</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't submitted any support requests. If you need help, feel free to reach out!</p>
            <Link to="/support/ticket">
              <Button>Contact Support</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Ticket ID</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/support/my-tickets/${ticket.id}`}>
                      <td className="p-4 pl-6 font-mono text-sm font-bold text-slate-700">
                        {ticket.ticketNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{ticket.subject}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MessageSquare size={14} /> {ticket._count?.messages || 0} messages
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold capitalize ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 font-medium">
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

