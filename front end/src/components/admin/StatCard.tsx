import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon: React.ElementType;
}

export default function StatCard({ title, value, change, changeType, description, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
          <Icon size={20} />
        </div>
      </div>
      
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        {change && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              changeType === 'positive' ? 'bg-success/10 text-success' : 
              changeType === 'negative' ? 'bg-danger/10 text-danger' : 
              'bg-slate-100 text-slate-600'
            }`}>
              {change}
            </span>
            <span className="text-xs text-slate-600 font-medium">vs last month</span>
          </div>
        )}
        {description && (
          <div className="text-xs text-slate-500 font-medium mt-1.5 line-clamp-1">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
