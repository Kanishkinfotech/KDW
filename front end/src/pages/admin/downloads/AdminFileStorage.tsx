import React, { useState, useEffect } from 'react';
import {
  Upload, File, Folder, Key, Download, RefreshCw,
  Search, Trash2, Edit3, Copy, Check, AlertCircle,
  CheckCircle2, HardDrive, FileText, Code, BookOpen, Receipt, X,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../../components/SEO';
import { authFetch } from '../../../api/apiClient';

interface DigitalFile {
  id: string;
  productId: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: string;
  parentFolderId: string;
  accessStatus: string;
  isCurrent: boolean;
  lastVerifiedAt: string;
  createdAt: string;
  downloadCount: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    downloadLimit?: number;
    accessDurationDays?: number;
  } | null;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  downloadLimit?: number;
  accessDurationDays?: number;
}

const DEFAULT_FOLDERS = [
  'Software & Templates',
  'Guides',
  'Invoices & Statements'
];

export default function AdminFileStorage() {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<DigitalFile[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [metrics, setMetrics] = useState<{
    totalFiles: number;
    totalSizeBytes: number;
    folderCounts: Record<string, number>;
  }>({ totalFiles: 0, totalSizeBytes: 0, folderCounts: {} });

  const [activeFolder, setActiveFolder] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<DigitalFile | null>(null);

  // Active File for Modals
  const [selectedFile, setSelectedFile] = useState<DigitalFile | null>(null);

  // Upload Form State
  const [uploadFormData, setUploadFormData] = useState({
    fileName: '',
    folder: 'Software & Templates',
    productId: '',
    downloadLimit: 5,
    accessDurationDays: 365
  });
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Token Generation State
  const [tokenDuration, setTokenDuration] = useState('60');
  const [generatedTokenData, setGeneratedTokenData] = useState<{
    token: string;
    downloadUrl: string;
    expiresAt: string;
    fileName: string;
  } | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Permissions State
  const [editFormData, setEditFormData] = useState({
    folder: '',
    downloadLimit: 5,
    accessStatus: 'CONNECTED',
    isCurrent: true
  });
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Load Files
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        folder: activeFolder,
        search: search.trim(),
        limit: '50'
      });
      const res = await authFetch(`/api/admin/downloads/files?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFiles(json.data || []);
        setMetrics(json.metrics || { totalFiles: 0, totalSizeBytes: 0, folderCounts: {} });
        setProducts(json.products || []);
        if (json.products && json.products.length > 0 && !uploadFormData.productId) {
          setUploadFormData(prev => ({ ...prev, productId: json.products[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setActionMessage({ text: 'Failed to load digital files list.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeFolder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles();
  };

  const formatBytes = (bytesStr: string | number) => {
    const bytes = Number(bytesStr);
    if (!bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mime.includes('pdf')) return <FileText className="text-red-500" size={20} />;
    if (['zip', 'rar', 'tar', 'gz', '7z', 'dmg', 'exe'].includes(ext) || mime.includes('zip') || mime.includes('compressed'))
      return <HardDrive className="text-blue-500" size={20} />;
    if (['epub', 'mobi', 'doc', 'docx'].includes(ext)) return <BookOpen className="text-amber-500" size={20} />;
    if (['csv', 'xlsx', 'xls', 'json'].includes(ext) || name.toLowerCase().includes('invoice'))
      return <Receipt className="text-emerald-500" size={20} />;
    return <Code className="text-purple-500" size={20} />;
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setActionMessage(null);
    try {
      const formData = new FormData();
      if (selectedUploadFile) {
        formData.append('file', selectedUploadFile);
      }
      formData.append('fileName', uploadFormData.fileName || (selectedUploadFile ? (selectedUploadFile as any).name : 'digital_asset.zip'));
      formData.append('folder', uploadFormData.folder);
      formData.append('productId', uploadFormData.productId);
      formData.append('downloadLimit', String(uploadFormData.downloadLimit));
      formData.append('accessDurationDays', String(uploadFormData.accessDurationDays));

      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth') || localStorage.getItem('authToken');
      const res = await fetch('/api/admin/downloads/files/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: json.message || 'File uploaded successfully.', type: 'success' });
        setUploadModalOpen(false);
        setSelectedUploadFile(null);
        setUploadFormData(prev => ({ ...prev, fileName: '' }));
        fetchFiles();
      } else {
        setActionMessage({ text: json.message || 'Upload failed.', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Error uploading file.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Open Security Token Link Modal
  const handleOpenTokenModal = (file: DigitalFile) => {
    setSelectedFile(file);
    setGeneratedTokenData(null);
    setCopiedLink(false);
    setTokenModalOpen(true);
  };

  const handleGenerateToken = async () => {
    if (!selectedFile) return;
    setGeneratingToken(true);
    try {
      const res = await authFetch(`/api/admin/downloads/files/${selectedFile.id}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: parseInt(tokenDuration, 10) })
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedTokenData({
          token: json.token,
          downloadUrl: `${window.location.origin}${json.downloadUrl}`,
          expiresAt: json.expiresAt,
          fileName: json.fileName
        });
      } else {
        alert(json.message || 'Failed to generate token.');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating secure token.');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedTokenData?.downloadUrl) {
      navigator.clipboard.writeText(generatedTokenData.downloadUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Open Edit Permissions Modal
  const handleOpenEditModal = (file: DigitalFile) => {
    setSelectedFile(file);
    setEditFormData({
      folder: file.parentFolderId || 'Software & Templates',
      downloadLimit: file.product?.downloadLimit || 5,
      accessStatus: file.accessStatus || 'CONNECTED',
      isCurrent: file.isCurrent !== false
    });
    setEditModalOpen(true);
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setSavingPermissions(true);
    try {
      const res = await authFetch(`/api/admin/downloads/files/${selectedFile.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: 'File permissions updated successfully.', type: 'success' });
        setEditModalOpen(false);
        fetchFiles();
      } else {
        alert(json.message || 'Failed to update permissions.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Delete File
  const handleDeleteFile = async () => {
    if (!deleteConfirmFile) return;
    try {
      const res = await authFetch(`/api/admin/downloads/files/${deleteConfirmFile.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: 'File deleted successfully.', type: 'success' });
        setDeleteConfirmFile(null);
        fetchFiles();
      } else {
        alert(json.message || 'Failed to delete file.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting file.');
    }
  };

  return (
    <div className="space-y-6">
      <SEO
        title="File Storage & Uploads | KDW Admin"
        description="Manage digital asset uploads, folders, permissions, and expiring secure download links"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">File Storage & Uploads</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Live Vault
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Upload digital deliverables, organize assets by folder, set download limits, and mint secure links.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchFiles}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Files"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Upload size={15} />
            Upload Digital File
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4 Clean Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Digital Files Stored</span>
            <span className="text-xl font-black text-slate-900">{metrics.totalFiles}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HardDrive size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Total Storage Used</span>
            <span className="text-xl font-black text-slate-900">{formatBytes(metrics.totalSizeBytes)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Download size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Total Downloads</span>
            <span className="text-xl font-black text-emerald-600">
              {files.reduce((acc, f) => acc + (f.downloadCount || 0), 0)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Folder size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Digital Folders</span>
            <span className="text-xl font-black text-slate-900">{DEFAULT_FOLDERS.length} Categories</span>
          </div>
        </div>
      </div>

      {/* Folder Organization Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFolder('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeFolder === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Folder size={14} />
            All Folders ({metrics.totalFiles})
          </button>
          {DEFAULT_FOLDERS.map(folder => {
            const count = metrics.folderCounts[folder] || 0;
            return (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeFolder === folder
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Folder size={14} className={activeFolder === folder ? 'text-white' : 'text-blue-500'} />
                {folder}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeFolder === folder ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search file name, MIME type, or extension..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/downloads/activity"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            Tracking & Logs
          </Link>
          <Link
            to="/admin/downloads/tokens"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Key size={14} />
            Tokens
          </Link>
        </div>
      </div>

      {/* Files Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw size={32} className="animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">Loading digital assets...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Digital Files Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search ? 'Try adjusting your search query or folder filter.' : 'Upload your first digital deliverable to start serving downloads.'}
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark inline-flex items-center gap-1.5"
            >
              <Upload size={14} />
              Upload Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">File Name</th>
                  <th className="py-3.5 px-4">Folder</th>
                  <th className="py-3.5 px-4">Linked Product</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Downloads</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* File info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                          {getFileIcon(file.mimeType, file.fileName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {file.fileName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{file.mimeType}</span>
                            {file.isCurrent && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">
                                CURRENT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Folder */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg text-[11px]">
                        <Folder size={12} className="text-slate-400" />
                        {file.parentFolderId || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      {file.product ? (
                        <div>
                          <div className="font-semibold text-slate-800">{file.product.name}</div>
                          <div className="text-[10px] text-slate-400">Limit: {file.product.downloadLimit || 5} downloads</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No direct product linked</span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatBytes(file.sizeBytes)}
                    </td>

                    {/* Downloads count */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{file.downloadCount || 0}</span>
                        <Link
                          to={`/admin/downloads/activity?search=${encodeURIComponent(file.fileName)}`}
                          className="text-[11px] text-blue-600 hover:underline inline-flex items-center"
                          title="View activity telemetry"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {file.accessStatus || 'ACTIVE'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenTokenModal(file)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Generate Time-Limited Tokenized Link"
                        >
                          <Key size={13} />
                          Token Link
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(file)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit Permissions & Folder"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmFile(file)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete File"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative my-8">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Upload Digital File</h3>
                <p className="text-xs text-slate-500">Software packages, templates, guides, and invoices.</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Drop / Select */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-primary transition-colors bg-slate-50">
                <input
                  type="file"
                  id="digital-file-input"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedUploadFile(f);
                      if (!uploadFormData.fileName) {
                        setUploadFormData(prev => ({ ...prev, fileName: f.name }));
                      }
                    }
                  }}
                />
                <label htmlFor="digital-file-input" className="cursor-pointer block">
                  <Upload size={28} className="mx-auto text-slate-400 mb-2" />
                  {selectedUploadFile ? (
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{(selectedUploadFile as any).name}</span>
                      <span className="text-xs text-slate-500">{formatBytes((selectedUploadFile as any).size)}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-bold text-primary block">Click to browse or drag file</span>
                      <span className="text-xs text-slate-400">Supports .pdf, .zip, .dmg, .exe, .epub, etc. (up to 500MB)</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KDW-Pro-Suite-v2.4.zip"
                  value={uploadFormData.fileName}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, fileName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Folder / Category</label>
                <select
                  value={uploadFormData.folder}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, folder: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {DEFAULT_FOLDERS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Linked Product */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linked Product</label>
                <select
                  value={uploadFormData.productId}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, productId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Download Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Download Limit Per Customer</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={uploadFormData.downloadLimit}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, downloadLimit: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Access Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={uploadFormData.accessDurationDays}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, accessDurationDays: parseInt(e.target.value, 10) || 365 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading Asset...' : 'Save & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Token Link Modal */}
      {tokenModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setTokenModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Signed Security Token Link</h3>
                <p className="text-xs text-slate-500">Generate time-limited signed download link for this asset.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
              <span className="text-slate-500 block">Target Asset:</span>
              <span className="font-bold text-slate-900 block mt-0.5">{selectedFile.fileName}</span>
              <span className="text-slate-400 text-[11px] block mt-0.5">{formatBytes(selectedFile.sizeBytes)} • {selectedFile.parentFolderId}</span>
            </div>

            {!generatedTokenData ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Token Expiration Window</label>
                  <select
                    value={tokenDuration}
                    onChange={(e) => setTokenDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="15">15 Minutes (Single download recommendation)</option>
                    <option value="60">1 Hour (Standard delivery)</option>
                    <option value="1440">24 Hours (Extended support delivery)</option>
                    <option value="10080">7 Days (VIP Access)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateToken}
                  disabled={generatingToken}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {generatingToken ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                  {generatingToken ? 'Generating...' : 'Generate Signed Link'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Secure link ready! Valid until {new Date(generatedTokenData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Download Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedTokenData.downloadUrl}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${
                        copiedLink ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setGeneratedTokenData(null)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Generate Another
                  </button>
                  <a
                    href={generatedTokenData.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    Test Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Asset Permissions</h3>
                <p className="text-xs text-slate-500">Configure limits, folder, and active status.</p>
              </div>
            </div>

            <form onSubmit={handleSavePermissions} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block">{selectedFile.fileName}</span>
                <span className="text-slate-500 text-[11px] block">{selectedFile.product?.name || 'No Product Linked'}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Folder Category</label>
                <select
                  value={editFormData.folder}
                  onChange={(e) => setEditFormData({ ...editFormData, folder: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {DEFAULT_FOLDERS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Download Limit Per Customer</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editFormData.downloadLimit}
                  onChange={(e) => setEditFormData({ ...editFormData, downloadLimit: parseInt(e.target.value, 10) || 5 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Status</label>
                <select
                  value={editFormData.accessStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, accessStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="CONNECTED">CONNECTED (Active & Accessible)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Temporarily Unavailable)</option>
                  <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrentCheckbox"
                  checked={editFormData.isCurrent}
                  onChange={(e) => setEditFormData({ ...editFormData, isCurrent: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isCurrentCheckbox" className="text-xs font-medium text-slate-700">
                  Mark as Current Production Version
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPermissions}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {savingPermissions ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">Delete Digital Asset?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <span className="font-bold text-slate-800">{deleteConfirmFile.fileName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmFile(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFile}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
