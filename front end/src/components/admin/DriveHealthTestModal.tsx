import React, { useState } from 'react';
import { X, HardDrive, CheckCircle2, AlertCircle, RefreshCw, Wrench } from 'lucide-react';

interface DriveHealthTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onTestSuccess?: () => void;
}

export default function DriveHealthTestModal({
  isOpen,
  onClose,
  record,
  onTestSuccess
}: DriveHealthTestModalProps) {
  const [testing, setTesting] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [newDriveId, setNewDriveId] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleRunTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/downloads/product-files/${record.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.record);
        if (onTestSuccess) onTestSuccess();
      } else {
        setError(data.message || 'Test failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error executing Drive test');
    } finally {
      setTesting(false);
    }
  };

  const handleRepairMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveId.trim()) return;
    setRepairing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/downloads/product-files/${record.id}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDriveFileId: newDriveId.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.record);
        setNewDriveId('');
        if (onTestSuccess) onTestSuccess();
      } else {
        setError(data.message || 'Failed to repair file mapping');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error repairing mapping');
    } finally {
      setRepairing(false);
    }
  };

  const currentStatus = testResult?.testStatus || record.testStatus;
  const currentLatency = testResult?.latencyMs || record.latencyMs || 120;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Google Drive Health & Diagnostics</h3>
              <p className="text-xs text-slate-500 mt-0.5">{record.fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* File Metadata Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Linked Product:</span>
              <span className="font-bold text-slate-800">{record.product?.name || 'Digital Product'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Drive File ID:</span>
              <code className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">{record.driveFileId}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">File Size / MIME:</span>
              <span className="font-medium text-slate-700">{record.fileSize || 'Unknown'} • {record.mimeType || 'application/zip'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Health State:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 ${
                currentStatus === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {currentStatus === 'HEALTHY' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {currentStatus} ({currentLatency}ms)
              </span>
            </div>
          </div>

          {/* Test Action */}
          <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <div>
              <p className="text-xs font-bold text-blue-950">Run Live Permission & Read Test</p>
              <p className="text-[11px] text-blue-700">Verifies service account authentication and stream readiness.</p>
            </div>
            <button
              onClick={handleRunTest}
              disabled={testing}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20 disabled:opacity-50"
            >
              <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing...' : 'Test Now'}
            </button>
          </div>

          {/* Repair Mapping Form */}
          <form onSubmit={handleRepairMapping} className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Wrench size={14} className="text-slate-500" />
              Repair / Replace Google Drive File ID
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDriveId}
                onChange={(e) => setNewDriveId(e.target.value)}
                placeholder="Enter new Google Drive File ID or URL"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={repairing || !newDriveId.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {repairing ? 'Updating...' : 'Update Mapping'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
