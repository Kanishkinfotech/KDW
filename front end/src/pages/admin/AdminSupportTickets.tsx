import { useState, useEffect, useRef } from 'react';
import { Ticket, Search, AlertCircle, Clock, CheckCircle2, X, Send, MessageSquare, Package, User, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/support/admin/tickets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err: any) {
      toast.error('Failed to load tickets');
      console.error(err);
    } finally {
      setLoading(false);
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
      toast.error('Failed to load ticket details');
      setSelectedTicketId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [ticketDetails?.messages]);

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
        fetchTickets(); // Refresh list to update status if it changed
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

  const getStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
      case 'OPEN':
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={12} /> {status.replace('_', ' ')}</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={12} /> Waiting on Cust</span>;
      case 'RESOLVED':
      case 'CLOSED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12} /> {status}</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold w-max">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'urgent': return 'text-red-500 bg-red-50 px-2 py-0.5 rounded-full';
      case 'high': return 'text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full';
      case 'normal': return 'text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full';
      case 'low': return 'text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full';
      default: return 'text-slate-500';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Ticket className="text-primary" size={32} />
            Support Tickets
          </h1>
          <p className="text-slate-500 mt-1">Manage and respond to customer support inquiries.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No tickets found</h3>
            <p className="text-slate-500">There are no tickets matching your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Ticket ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} onClick={() => fetchTicketDetails(ticket.id)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="p-4 pl-6 font-mono text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                      {ticket.ticketNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{ticket.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{ticket.user?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">
                      {ticket.category}
                    </td>
                    <td className="p-4 max-w-xs md:max-w-sm">
                      <div className="text-sm font-bold text-slate-900 truncate" title={ticket.subject}>
                        {ticket.subject}
                      </div>
                      {ticket.description && (
                        <div className="text-xs text-slate-500 truncate mt-0.5" title={ticket.description}>
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {loadingDetails ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                Loading ticket details...
              </div>
            ) : ticketDetails ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500">{ticketDetails.ticketNumber}</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{ticketDetails.subject}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedTicketId(null)} 
                    className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1" ref={scrollContainerRef}>
                  {/* Customer Info Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {ticketDetails.user?.name || 'Guest User'}
                      </div>
                      <div className="text-xs text-slate-500">{ticketDetails.user?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category & Priority</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-full text-xs">
                          {ticketDetails.category}
                        </span>
                        <span className={`text-xs font-bold uppercase ${getPriorityColor(ticketDetails.priority)}`}>
                          {ticketDetails.priority}
                        </span>
                      </div>
                    </div>
                    {ticketDetails.order && (
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Linked Order</div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <Package size={14} className="text-slate-400" />
                          {ticketDetails.order.orderNumber}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Update Status</div>
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

                  {/* Customer Inquiry Body */}
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-primary" /> Customer Inquiry Message / Description
                    </div>
                    <div className="text-base text-slate-900 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {ticketDetails.description}
                    </div>
                  </div>

                  {/* Conversation History & Responses */}
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

                  {/* Send Reply Form */}
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
              <div className="p-12 text-center text-slate-500">Error loading ticket</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
