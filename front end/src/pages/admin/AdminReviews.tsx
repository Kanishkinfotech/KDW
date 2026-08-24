import { useState, useEffect } from 'react';
import { MessageSquare, Star, Trash2, Check, X, Search, Filter, ShieldAlert, Reply, AlertTriangle } from 'lucide-react';
import Button from '../../components/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Review {
  _id: string;
  product: { _id: string, name: string, coverImage: string };
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  createdAt: string;
  creatorReply?: { text: string };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState('all'); // all, pending, reported

  const fetchReviews = async () => {
    try {
      const res = await axios.get('/api/reviews/admin', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (_err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.put(`/api/reviews/admin/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Review ${status}`);
        fetchReviews();
      }
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await axios.delete(`/api/reviews/admin/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Review deleted');
        fetchReviews();
      }
    } catch (_err) {
      toast.error('Failed to delete review');
    }
  };

  const handleReply = async (id: string) => {
    const text = replyText[id];
    if (!text) return;
    try {
      const res = await axios.post(`/api/reviews/${id}/reply`, { text }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Reply posted');
        setReplyText({ ...replyText, [id]: '' });
        fetchReviews();
      }
    } catch (_err) {
      toast.error('Failed to post reply');
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.product && r.product.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'pending') return matchesSearch && r.status === 'pending';
    if (activeTab === 'reported') return matchesSearch && r.status === 'hidden'; // Example logic for reported
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">Rejected</span>;
      case 'hidden': return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full border border-gray-200"><AlertTriangle className="w-3 h-3 inline mr-1"/>Hidden</span>;
      default: return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">Pending</span>;
    }
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    avg: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0',
    reported: reviews.filter(r => r.status === 'hidden').length
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-blue-600" />
            Review Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Monitor, moderate, and reply to customer feedback.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <span className="text-gray-500 text-sm font-medium">Total Reviews</span>
          <span className="text-3xl font-black text-gray-900 mt-1">{stats.total}</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <span className="text-amber-600 text-sm font-medium">Pending Approval</span>
          <span className="text-3xl font-black text-amber-700 mt-1">{stats.pending}</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <span className="text-gray-500 text-sm font-medium">Average Rating</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900">{stats.avg}</span>
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-red-200 bg-red-50/30 shadow-sm flex flex-col justify-center">
          <span className="text-red-600 text-sm font-medium">Reported / Spam</span>
          <span className="text-3xl font-black text-red-700 mt-1">{stats.reported}</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          <button onClick={() => setActiveTab('all')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>All</button>
          <button onClick={() => setActiveTab('pending')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'pending' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-600 hover:text-amber-700'}`}>
            Pending {stats.pending > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-xs">{stats.pending}</span>}
          </button>
          <button onClick={() => setActiveTab('reported')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'reported' ? 'bg-white shadow-sm text-red-700' : 'text-gray-600 hover:text-red-700'}`}>
            <ShieldAlert className="w-3.5 h-3.5" /> Reported
          </button>
        </div>
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by customer, product, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? filteredReviews.map((review) => (
          <div key={review._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              
              {/* Left Column: Info & Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{review.customerName}</div>
                      <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(review.status)}
                  </div>
                </div>

                {review.product && (
                  <div className="mb-4 inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <img src={review.product.coverImage || '/placeholder.png'} alt="product" className="w-6 h-6 rounded object-cover" />
                    <span className="text-xs font-medium text-gray-600">{review.product.name}</span>
                  </div>
                )}

                <div className="flex mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < review.rating ? '#fbbf24' : 'none'} className={i < review.rating ? 'text-amber-400' : 'text-gray-300'} />
                  ))}
                </div>

                <h4 className="font-bold text-gray-900 mb-1">{review.title}</h4>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{review.comment}</p>

                {/* Creator Reply Section */}
                {review.creatorReply?.text ? (
                  <div className="bg-blue-50/50 border-l-2 border-blue-500 p-3 rounded-r-lg mt-4">
                    <div className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                      <Reply className="w-3.5 h-3.5" /> Your Reply
                    </div>
                    <p className="text-sm text-gray-700">{review.creatorReply.text}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Write a public reply..." 
                      value={replyText[review._id] || ''}
                      onChange={(e) => setReplyText({...replyText, [review._id]: e.target.value})}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => handleReply(review._id)}
                      disabled={!replyText[review._id]}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Actions */}
              <div className="lg:w-48 lg:border-l lg:border-gray-100 lg:pl-6 flex flex-row lg:flex-col gap-2 pt-4 lg:pt-0 border-t border-gray-100 lg:border-t-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 hidden lg:block">Actions</span>
                
                {review.status !== 'approved' && (
                  <button onClick={() => handleUpdateStatus(review._id, 'approved')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors">
                    <Check size={16} /> Approve
                  </button>
                )}
                
                {review.status !== 'rejected' && (
                  <button onClick={() => handleUpdateStatus(review._id, 'rejected')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                    <X size={16} /> Reject
                  </button>
                )}

                <button onClick={() => handleDelete(review._id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg text-sm font-medium transition-colors lg:mt-auto">
                  <Trash2 size={16} /> Delete
                </button>
              </div>

            </div>
          </div>
        )) : (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
            <MessageSquare size={32} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

