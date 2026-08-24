import { useState } from 'react';
import { Search, Filter, Download, MoreVertical } from 'lucide-react';
import type { TableConfig } from '../../data/adminTableConfig';

interface DynamicAdminTableProps {
  config: TableConfig;
}

export default function DynamicAdminTable({ config }: DynamicAdminTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Very basic search filtering across all text fields
  const filteredData = config.data.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getBadgeColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('paid') || s.includes('success') || s.includes('synced') || s.includes('published') || s.includes('healthy') || s.includes('optimized') || s.includes('resolved')) return 'bg-success/10 text-success';
    if (s.includes('pending') || s.includes('draft') || s.includes('overdue') || s.includes('open') || s.includes('needs work')) return 'bg-amber-500/10 text-amber-600';
    if (s.includes('failed') || s.includes('expired') || s.includes('revoked') || s.includes('suspended')) return 'bg-danger/10 text-danger';
    return 'bg-slate-200 text-slate-600';
  };

  const formatCell = (val: any, type?: string) => {
    if (type === 'currency') return `$${Number(val).toFixed(2)}`;
    if (type === 'badge') {
      return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getBadgeColor(val)}`}>
          {val}
        </span>
      );
    }
    return val;
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{config.title}</h1>
          <p className="text-slate-500 mt-1">{config.description}</p>
        </div>
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 w-full sm:w-auto justify-center">
          <Download size={18} />
          Export Data
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                {config.columns.map(col => (
                  <th key={col.key} className="px-6 py-4">{col.label}</th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-6 py-12 text-center text-slate-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                    {config.columns.map((col, index) => (
                      <td key={col.key} className={`px-6 py-4 ${index === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                        {formatCell(row[col.key], col.type)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>Showing {filteredData.length} records</span>
        </div>
      </div>
    </div>
  );
}
