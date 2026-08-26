import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, RefreshCw, CheckCircle2, Clock, FileText, Calendar, Filter } from 'lucide-react';
import SEO from '../../../components/SEO';

export default function AdminExportCenter() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [format, setFormat] = useState('CSV');
  const [range, setRange] = useState('30d');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports/exports');
      const json = await res.json();
      if (json.success) {
        setJobs(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleGenerateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/reports/exports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          format,
          filters: { range }
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Export "${json.job.fileName}" successfully created.`);
        fetchJobs();

        // Trigger immediate browser download of mock CSV content
        const dummyData = `Report,${reportType.toUpperCase()}\nGenerated At,${new Date().toISOString()}\nFormat,${format}\nStatus,Verified\nSample Data Row 1,100,5000\nSample Data Row 2,120,6200`;
        const blob = new Blob([dummyData], { type: format === 'CSV' ? 'text/csv' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = json.job.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setActionMessage('Failed to generate export file.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Export Center & File Vault | KDW Admin" description="Generate bulk financial, entitlement, customer, and telemetry export files" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Export Center & Archival Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Generate standardized CSV and JSON extracts for offline financial modeling, accounting, and compliance.</p>
        </div>
        <button onClick={fetchJobs} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-normal">Dismiss</button>
        </div>
      )}

      {/* Generator Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-1">Generate New Data Export</h3>
        <p className="text-xs text-slate-500 mb-6">Select report stream and output parameters</p>

        <form onSubmit={handleGenerateExport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Report Dataset</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-slate-800"
            >
              <option value="sales">Sales & Commercial Orders</option>
              <option value="revenue">Revenue Waterfall & Gateway Fees</option>
              <option value="product_performance">Product Health & Performance</option>
              <option value="downloads">Download Activity & Telemetry</option>
              <option value="failed_downloads">Failed Download Triage Queue</option>
              <option value="reviews">Customer Reviews & Ratings</option>
              <option value="refunds">Refunds & Revocations</option>
              <option value="customers">Customer LTV & Profiles</option>
              <option value="licences">Software Licences Ledger</option>
              <option value="overrides">Administrative Overrides Audit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">File Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-slate-800"
            >
              <option value="CSV">Comma Separated Values (.CSV)</option>
              <option value="JSON">JavaScript Object Notation (.JSON)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Time Horizon</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-slate-800"
            >
              <option value="today">Today (24 Hours)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">Year to Date (YTD)</option>
              <option value="all_time">Complete All-Time Data</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={15} />
              {generating ? 'Compiling File...' : 'Generate & Download'}
            </button>
          </div>
        </form>
      </div>

      {/* Export History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[360px]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Export History & Secure Temporary Links</h3>
            <p className="text-xs text-slate-500 mt-0.5">Exports are retained for 7 days before automated cleanup</p>
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading exports history...
          </div>
        ) : jobs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm">
            <FileSpreadsheet size={36} className="opacity-20 mb-2" />
            <p>No exports generated yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">File Name</th>
                  <th className="px-5 py-3.5">Report Stream</th>
                  <th className="px-5 py-3.5">Format & Size</th>
                  <th className="px-5 py-3.5">Generated At</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Download Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" />
                      {job.fileName}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 uppercase">{job.reportType}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono">{job.format} • {job.fileSize || '142 KB'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          const dummy = `Report,${job.reportType}\nGenerated,${job.createdAt}\nStatus,Completed`;
                          const blob = new Blob([dummy], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = job.fileName;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                      >
                        <Download size={12} /> Download
                      </button>
                    </td>
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
