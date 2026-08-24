import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Activity, Server, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function AdminAuditLogs() {
  const { logout } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/admin/audit-logs?page=${page}&search=${debouncedSearch}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          const mappedLogs = (res.data.logs || []).map((log: any) => ({
            ...log,
            _id: log.id,
            entityType: log.entity,
            entityId: '',
            user: log.admin,
            createdAt: log.timestamp,
            status: 'success'
          }));
          setLogs(mappedLogs);
          setTotalPages(res.data.pagination?.pages || 1);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, debouncedSearch, logout]);

  // Use logs directly since backend handles search
  const filteredLogs = logs;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Order': return <Activity size={16} />;
      case 'Product': return <FileText size={16} />;
      case 'Setting': return <Server size={16} />;
      default: return <Shield size={16} />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="text-primary" /> Audit Logs
          </h1>
          <p className="text-slate-500 mt-1">Security logs tracking all system and admin actions.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="Search by action, entity, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

      </div>

      {/* Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Shield size={48} className="mx-auto text-slate-700 mb-4" />
                    <p>No audit logs found matching your criteria.</p>
                  </td>
                </tr>
              ) : filteredLogs.map((log: any) => (
                <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{(log.action || 'UNKNOWN_ACTION').replace(/_/g, ' ')}</div>
                    {log.details && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                        {getEntityIcon(log.entityType)}
                      </div>
                      <div>
                        <div className="font-medium">{log.entityType}</div>
                        <div className="text-xs text-slate-600">{log.entityId?.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">
                      {log.user?.email || 'System Default'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${log.status === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                      {log.status === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  page === p
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

