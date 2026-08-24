import { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function SubmitTicket() {
  const [searchParams] = useSearchParams();
  const paramOrderId = searchParams.get('orderId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [validationError, setValidationError] = useState('');
  const [purchases, setPurchases] = useState<any[]>([]);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    category: paramOrderId ? 'Orders' : '',
    priority: 'Normal',
    description: '',
    orderId: paramOrderId || ''
  });

  const categories = [
    "Account & Login",
    "Orders",
    "Payments",
    "Downloads",
    "Licenses",
    "Products",
    "Invoices",
    "Refunds",
    "Coupons",
    "Technical Issues",
    "Other"
  ];

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        try {
          const res = await axios.get('/api/purchases');
          if (res.data.success) {
            setPurchases(res.data.purchases);
          }
        } catch (error) {
          console.error("Failed to fetch purchases for tickets");
        }
      };
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (!isAuthenticated) {
      toast.error('You must be logged in to submit a ticket.');
      navigate('/login?redirect=/support/ticket');
      return;
    }

    // Validation
    if (!formData.category) {
      setValidationError('Please select a topic.');
      return;
    }
    
    const subject = formData.subject.trim();
    if (!subject) {
      setValidationError('Subject is required.');
      return;
    }
    if (subject.length > 150) {
      setValidationError('Subject is too long (maximum 150 characters).');
      return;
    }

    const description = formData.description.trim();
    if (!description) {
      setValidationError('Please describe your issue.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await axios.post('/api/support/tickets', {
        category: formData.category,
        priority: formData.priority,
        subject,
        description,
        orderId: formData.orderId || undefined
      }, {
        withCredentials: true
      });
      
      if (res.data.success) {
        setTicketNumber(res.data.ticket.ticketNumber);
        setIsSubmitted(true);
        toast.success('Support ticket created successfully!');
      }
    } catch (error: any) {
      console.error('Failed to submit ticket', error);
      toast.error(error.response?.data?.message || 'Unable to submit your ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 px-6 flex items-center justify-center">
        <SEO title="Ticket Submitted | KDW Marketplace" description="Your support ticket has been submitted successfully." />
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Ticket submitted successfully!</h2>
          <p className="text-slate-600 mb-4 font-medium">
            Your support ticket <span className="font-bold text-primary">{ticketNumber}</span> has been created.
          </p>
          <p className="text-slate-500 mb-8 text-sm">
            Status: Open<br/>
            Our team will review your request and get back to you shortly.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/support/my-tickets" className="inline-block w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
              View My Tickets
            </Link>
            <Link to="/" className="inline-block w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <SEO title="Submit a Ticket | KDW Marketplace" description="Contact our support team for help with your products." />
      
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Raise a Ticket</h1>
          <p className="text-slate-600">
            Having trouble with a product, billing, or your account? Fill out the form below and we'll help you sort it out.
          </p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-3 bg-blue-50 text-blue-800 p-4 rounded-xl mb-8 border border-blue-100">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-600" />
            <p className="text-sm font-medium">
              Before submitting a ticket, please check our <Link to="/docs" className="underline hover:text-blue-900">Knowledge Base</Link> or <Link to="/faq" className="underline hover:text-blue-900">FAQs</Link>. The answer you're looking for might already be there!
            </p>
          </div>

          {validationError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle size={18} />
              <p className="text-sm font-medium">{validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Category / Topic</label>
              <select 
                value={formData.category}
                onChange={(e) => {
                  setFormData({...formData, category: e.target.value});
                  setValidationError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a topic...</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <input 
                  required 
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({...formData, subject: e.target.value});
                    setValidationError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all" 
                  placeholder="Brief summary of the issue" 
                  maxLength={150}
                />
              </div>
            </div>



            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Related Order (Optional)</label>
              <select 
                value={formData.orderId}
                onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">No order selected (General inquiry)</option>
                {purchases.map(p => (
                  <option key={p.id} value={p.orderId || p.id}>
                    Order #{p.orderNumber || p.id} - {p.name} ({new Date(p.purchasedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea 
                required 
                rows={6} 
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value});
                  setValidationError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" 
                placeholder="Please describe your issue in detail. Include any relevant URLs, error messages, or steps to reproduce."
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} /> Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
