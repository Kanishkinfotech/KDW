import { useState, useEffect } from 'react';
import { Download, FileText, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { formatCurrency } from '../../utils/currency';

export default function AdminReports() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30days');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics/reports?type=${reportType}&range=${dateRange}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      
      const data = await res.json();
      setReportData(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateRange]);

  const handleDownloadCSV = () => {
    if (!reportData.length) return;
    
    // Convert to CSV
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SEO title="Reports | Admin" description="Admin Reports" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Generate and download detailed system reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadCSV}
            disabled={!reportData.length || loading}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-600" />
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="sales">Sales & Revenue</option>
            <option value="taxes">Tax Collection</option>
            <option value="inventory">Inventory Status</option>
            <option value="customers">Customer Acquisition</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-slate-600" />
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            Generating Report...
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>No data found for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-6 py-4 text-slate-700">
                        {typeof val === 'number' && Object.keys(row)[j].toLowerCase().includes('amount') || Object.keys(row)[j].toLowerCase().includes('revenue') 
                          ? formatCurrency(val) 
                          : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

