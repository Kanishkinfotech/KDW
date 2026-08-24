import { useState, useEffect } from 'react';
import { Bell, Search, Filter, Trash2, CheckCircle, AlertTriangle, Info, ShoppingBag, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (_err) {
      toast.error('Failed to fetch notifications', { id: 'notif-fetch-error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await axios.patch(`/api/admin/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (_err) {
      toast.error('Failed to mark as read');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const res = await axios.delete(`/api/admin/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setNotifications(notifications.filter(n => n.id !== id));
        toast.success('Notification deleted');
      }
    } catch (_err) {
      toast.error('Failed to delete');
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'Order': return <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"><ShoppingBag size={20} /></div>;
      case 'System': return <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><Info size={20} /></div>;
      case 'Alert': return <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0"><AlertTriangle size={20} /></div>;
      case 'Customer': return <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0"><User size={20} /></div>;
      default: return <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0"><Bell size={20} /></div>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="text-primary" /> Notifications
          </h1>
          <p className="text-slate-500 mt-1">System alerts and admin announcements.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

      </div>

      {/* List */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <Bell size={48} className="mb-4 opacity-20" />
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => (
              <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 ${n.isRead ? 'opacity-70' : 'bg-primary/5 border-l-2 border-l-primary'}`}>
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm ${n.isRead ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>{n.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                        <span>{n.type}</span>
                        <span>•</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.isRead && (
                        <button onClick={() => markAsRead(n.id)} className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark as Read">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-slate-200 text-sm text-slate-500 flex justify-between items-center">
          <span>Showing {filteredNotifications.length} records</span>
        </div>
      </div>
    </div>
  );
}
