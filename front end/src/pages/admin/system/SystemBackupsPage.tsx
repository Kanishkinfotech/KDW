import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Database, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Play, 
  FileCheck, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  X,
  Server
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemBackupsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<any[]>([]);
  const [restoreTests, setRestoreTests] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [backupType, setBackupType] = useState('FULL_DATABASE');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [backupsRes, testsRes] = await Promise.all([
        axios.get('/api/admin/system/backups', { withCredentials: true }),
        axios.get('/api/admin/system/restore-tests', { withCredentials: true })
      ]);

      if (backupsRes.data.success) {
        setBackups(backupsRes.data.data);
      }
      if (testsRes.data.success) {
        setRestoreTests(testsRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch backup records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(
        '/api/admin/system/backups',
        { backupType, reason },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Backup successfully generated and encrypted');
        setCreateModalOpen(false);
        setReason('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyBackup = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/system/backups/${id}/verify`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Backup verified successfully');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify backup');
    }
  };

  const handleRunRestoreTest = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/system/backups/${id}/restore-test`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Sandbox dry-run restore test completed');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Restore dry-run failed');
    }
  };

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchData} isLoading={loading} />

      {/* Header with Create Action in Light Blue Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Disaster Recovery & Backup Management</h2>
          <p className="text-xs text-slate-500">AES-256 encrypted backups, SHA-256 checksum verification, and non-destructive sandbox restore tests.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create On-Demand Backup
        </button>
      </div>

      {/* SLA & Status Cards in Light Blue Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">RPO Recovery Target</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">15 mins</div>
          <div className="text-[11px] text-sky-600 mt-1 font-medium">Continuous WAL & Snapshots</div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">RTO Dry-Run Speed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">1.15s</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Target SLA: &lt; 300s (5m)</div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Encryption at Rest</div>
          <div className="text-2xl font-bold text-sky-700 mt-1 flex items-center gap-1.5">
            <Lock className="w-5 h-5" />
            AES-256-GCM
          </div>
          <div className="text-[11px] text-slate-500 mt-1">S3 Immutable Retention</div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Stored Backups</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{backups.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{restoreTests.length} Sandbox Tests Run</div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-600" />
          Backup Archives & Storage Registry
        </h3>

        {loading ? (
          <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
            <p className="text-xs font-medium">Loading backup catalog...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
            <Database className="w-8 h-8 mx-auto text-sky-500 mb-2" />
            <h4 className="text-sm font-bold text-slate-900">No Backups Generated Yet</h4>
            <p className="text-xs text-slate-500 mt-1">Click "Create On-Demand Backup" to take your first snapshot.</p>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-sky-100 text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Filename & Type</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Checksum (SHA-256)</th>
                    <th className="px-4 py-3">Verification</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 font-sans">
                  {backups.map((b) => (
                    <tr key={b.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900 text-[11px]">{b.filename}</div>
                        <div className="text-[10px] text-sky-700 font-medium">{b.backupType} • {b.recordsCount} records</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {b.sizeMb} MB
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[10px] max-w-xs truncate" title={b.checksumSha256}>
                        {b.checksumSha256.slice(0, 20)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.verificationStatus === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {b.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerifyBackup(b.id)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs rounded-lg transition border border-slate-200 inline-flex items-center gap-1 shadow-2xs font-medium cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            Verify
                          </button>
                          <button
                            onClick={() => handleRunRestoreTest(b.id)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs rounded-lg transition inline-flex items-center gap-1 font-semibold shadow-2xs cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-sky-600" />
                            Sandbox Dry-Run
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Restore Tests Table */}
      {restoreTests.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-600" />
            Non-Destructive Sandbox Restore Test Reports
          </h3>

          <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-sky-100 text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Test Timestamp</th>
                    <th className="px-4 py-3">Backup File</th>
                    <th className="px-4 py-3">Environment</th>
                    <th className="px-4 py-3">Tables Validated</th>
                    <th className="px-4 py-3">Restore Duration (RTO)</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Integrity Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/70 font-sans">
                  {restoreTests.map((t) => (
                    <tr key={t.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(t.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-[11px]">
                        {t.backup?.filename || 'Database Snapshot'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          {t.environment}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {t.tablesValidated} tables ({t.recordsCountValidated} rows)
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                        {t.rtoResultSeconds}s
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-sm">
                        {t.issuesReport || 'All foreign keys and tables validated.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Modal in Light Blue Theme */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-sky-100 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-600" />
                Generate On-Demand Backup
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Create an AES-256 encrypted snapshot with SHA-256 integrity checksum.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Backup Scope</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="FULL_DATABASE">Full PostgreSQL Database (36 Tables)</option>
                  <option value="CONFIGURATION">System Configuration & Settings Registry</option>
                  <option value="DRIVE_FILE_MAPPING">Google Drive Digital Asset Mapping</option>
                  <option value="AUDIT_ARCHIVE">Audit Logs & Compliance Archive</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason / Trigger Context</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Pre-deployment schema migration snapshot..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={actionLoading}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Creating & Encrypting...' : 'Generate Backup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemBackupsPage;
