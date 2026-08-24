import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Truck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/currency';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch order by id. We use mock fetch here based on store/api if available
    const fetchOrder = async () => {
      try {
        // const res = await axios.get(`/api/orders/${id}`);
        // if(res.data.success) setOrder(res.data.data);
        
        // Mock data since /api/orders/:id might not be fully wired up yet for single fetches
        setTimeout(() => {
          setOrder({
            orderId: id || 'ORD-2026-1029',
            status: 'Shipped',
            totalAmount: 149.00,
            date: new Date().toISOString(),
            items: [
              { name: 'SaaS Framer Template', quantity: 1, price: 99.00, coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200' },
              { name: 'Dashboard UI Kit', quantity: 1, price: 50.00, coverImage: 'https://images.unsplash.com/photo-1512758117929-08ce414d4858?w=200' }
            ],
            statusHistory: [
              { status: 'Ordered', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Order placed successfully' },
              { status: 'Packed', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), note: 'Items packed and ready for shipping' },
              { status: 'Shipped', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), note: 'Handed over to delivery partner' }
            ],
            trackingNumber: 'TRK9876543210'
          });
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrder();
  }, [id]);

  if (isLoading) return <div className="min-h-screen py-12 flex items-center justify-center">Loading tracking details...</div>;
  if (!order) return <div className="min-h-screen py-12 flex items-center justify-center">Order not found</div>;

  const timelineSteps = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentStepIndex = timelineSteps.indexOf(order.status);
  // Fallback if status is something like cancelled
  const isCancelled = order.status === 'Cancelled' || order.status === 'Refunded';

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50">
      <SEO title={`Track Order ${order.orderId}`} description="Track your order status and timeline." />
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Order {order.orderId}</h1>
                  <p className="text-slate-500 text-sm mt-1">Placed on {new Date(order.date).toLocaleDateString()}</p>
                </div>
                {order.trackingNumber && (
                  <div className="text-right">
                    <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Tracking Number</div>
                    <div className="font-mono text-primary font-bold">{order.trackingNumber}</div>
                  </div>
                )}
              </div>

              {isCancelled ? (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-danger flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-danger">Order {order.status}</h3>
                    <p className="text-sm text-danger/80">This order has been {order.status.toLowerCase()}. Please contact support if you have questions.</p>
                  </div>
                </div>
              ) : (
                <div className="relative pt-8 pb-4 pl-4 sm:pl-0 sm:px-8">
                  <div className="absolute left-6 sm:left-8 top-12 bottom-12 w-0.5 bg-slate-100 sm:left-8 sm:right-8 sm:top-12 sm:w-auto sm:h-0.5 z-0 hidden sm:block"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-8 sm:gap-0 relative z-10">
                    {timelineSteps.map((step, idx) => {
                      const isCompleted = currentStepIndex >= idx;
                      const isCurrent = currentStepIndex === idx;
                      const historyItem = order.statusHistory?.find((h: any) => h.status === step);

                      let Icon = Package;
                      if (step === 'Shipped') Icon = Truck;
                      if (step === 'Delivered') Icon = CheckCircle2;

                      return (
                        <div key={step} className="flex sm:flex-col items-start sm:items-center relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold relative z-10 transition-colors ${
                            isCompleted ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-600 border-2 border-white'
                          }`}>
                            <Icon size={18} />
                          </div>
                          
                          {/* Mobile Connector Line */}
                          {idx !== timelineSteps.length - 1 && (
                            <div className={`absolute left-5 top-10 bottom-[-2rem] w-0.5 sm:hidden ${isCompleted && currentStepIndex > idx ? 'bg-primary' : 'bg-slate-100'}`}></div>
                          )}

                          <div className="ml-4 sm:ml-0 sm:mt-4 sm:text-center">
                            <h4 className={`font-bold ${isCurrent ? 'text-primary' : isCompleted ? 'text-slate-900' : 'text-slate-600'}`}>
                              {step}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-[120px]">
                              {historyItem ? new Date(historyItem.timestamp).toLocaleDateString() : 'Pending'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Detailed Updates</h2>
              <div className="space-y-6">
                {[...(order.statusHistory || [])].reverse().map((history: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 text-right flex-shrink-0">
                      <div className="text-sm font-bold text-slate-900">{new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</div>
                      <div className="text-xs text-slate-500">{new Date(history.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div className="w-px bg-slate-200 relative my-2">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary bg-white"></div>
                    </div>
                    <div className="py-1">
                      <h4 className="font-bold text-slate-800">{history.status}</h4>
                      <p className="text-sm text-slate-600">{history.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Order Summary</h3>
              <div className="space-y-4 mb-6">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <img src={item.coverImage} className="w-16 h-16 object-cover rounded-lg border border-slate-100" />
                    <div>
                      <div className="font-semibold text-slate-800 text-sm line-clamp-2">{item.name}</div>
                      <div className="text-sm text-slate-500 mt-1">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total</span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
