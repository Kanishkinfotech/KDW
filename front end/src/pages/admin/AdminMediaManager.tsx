import { useState, useEffect } from 'react';
import { 
  FolderOpen, Upload, Search, Link as LinkIcon, Trash2, 
  ExternalLink, FileImage, FileText, FileVideo, HardDrive, Filter 
} from 'lucide-react';
import Button from '../../components/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface DriveFile {
  _id: string;
  filename: string;
  size: string;
  linkedProduct: string;
  status: string;
  driveUrl: string;
  createdAt: string;
}

export default function AdminMediaManager() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFile, setNewFile] = useState({
    filename: '',
    size: '',
    linkedProduct: 'None',
    driveUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('All');
  const [currentFolder, setCurrentFolder] = useState('All');

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) setProducts(res.data.data);
    } catch (_err) {}
  };

  const fetchFiles = async (prodList?: any[]) => {
    try {
      const targetProducts = prodList || products;
      const res = await axios.get('/api/admin/drive', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      let driveFiles = (res.data.success && Array.isArray(res.data.data)) ? res.data.data : [];

      // Auto-populate from products if explicitly no drive records exist yet
      if (driveFiles.length === 0 && targetProducts.length > 0) {
        const autoFiles: DriveFile[] = [];
        targetProducts.forEach((p, idx) => {
          if (p.driveLink || p.downloadUrl || p.fileUrl) {
            autoFiles.push({
              _id: `auto-file-${p.id || idx}`,
              filename: `${p.title || p.name}.zip`,
              size: p.fileSize || '120 MB',
              linkedProduct: p.title || p.name,
              status: 'Synced',
              driveUrl: p.driveLink || p.downloadUrl || p.fileUrl || '#',
              createdAt: p.createdAt || new Date().toISOString()
            });
          }
          if (p.coverImage) {
            autoFiles.push({
              _id: `auto-img-${p.id || idx}`,
              filename: `${(p.title || p.name).toLowerCase().replace(/\s+/g, '-')}-preview.png`,
              size: '2.4 MB',
              linkedProduct: p.title || p.name,
              status: 'Synced',
              driveUrl: p.coverImage,
              createdAt: p.createdAt || new Date().toISOString()
            });
          }
        });
        driveFiles = autoFiles;
      }

      setFiles(driveFiles);
    } catch (_err) {
      console.warn('Failed to fetch drive files from endpoint, aggregating from products...');
      if (products.length > 0) {
        const autoFiles: DriveFile[] = [];
        products.forEach((p, idx) => {
          if (p.coverImage) {
            autoFiles.push({
              _id: `auto-img-${p.id || idx}`,
              filename: `${(p.title || p.name).toLowerCase().replace(/\s+/g, '-')}-cover.png`,
              size: '2.4 MB',
              linkedProduct: p.title || p.name,
              status: 'Synced',
              driveUrl: p.coverImage,
              createdAt: p.createdAt || new Date().toISOString()
            });
          }
        });
        setFiles(autoFiles);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get('/api/products', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          setProducts(res.data.data);
          fetchFiles(res.data.data);
        } else {
          fetchFiles();
        }
      } catch (_e) {
        fetchFiles();
      }
    };
    init();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media file link?')) return;
    try {
      const res = await axios.delete(`/api/admin/drive/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Media file deleted');
        fetchFiles();
      }
    } catch (_err) {
      toast.error('Failed to delete media file');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.filename || !newFile.driveUrl) {
      return toast.error('Filename and Drive URL are required');
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/admin/drive', newFile, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Media successfully linked');
        setIsModalOpen(false);
        setNewFile({ filename: '', size: '', linkedProduct: 'None', driveUrl: '' });
        fetchFiles();
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.requiresConfirmation) {
        if (confirm(err.response.data.message)) {
          try {
            const retryRes = await axios.post('/api/admin/drive', { ...newFile, forceOverwrite: true }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (retryRes.data.success) {
              toast.success('Media successfully linked and overwritten');
              setIsModalOpen(false);
              setNewFile({ filename: '', size: '', linkedProduct: 'None', driveUrl: '' });
              fetchFiles();
            }
          } catch (retryErr: any) {
             toast.error(retryErr.response?.data?.message || 'Failed to overwrite media file');
          }
        }
      } else {
        toast.error(err.response?.data?.message || 'Failed to add media file');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileCategory = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) return 'Images';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return 'Videos';
    return 'Documents';
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.filename.toLowerCase().includes(searchTerm.toLowerCase()) || f.linkedProduct.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (currentFilter === 'Synced') matchesFilter = f.status === 'Synced';
    if (currentFilter === 'Linked') matchesFilter = f.linkedProduct !== 'None';
    if (currentFilter === 'Unlinked') matchesFilter = f.linkedProduct === 'None';
    
    let matchesFolder = true;
    if (currentFolder !== 'All') {
      matchesFolder = getFileCategory(f.filename) === currentFolder;
    }
    
    return matchesSearch && matchesFilter && matchesFolder;
  });

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) return <FileImage size={40} className="text-blue-500" />;
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return <FileVideo size={40} className="text-purple-500" />;
    return <FileText size={40} className="text-slate-500" />;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="text-primary" />
            Media Manager
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage external files, images, and Drive links</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Upload size={18} />
          Link New Media
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input 
            type="text"
            placeholder="Search by filename or linked product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => { setFilterMenuOpen(!filterMenuOpen); setFolderMenuOpen(false); }}>
              <Filter size={16} /> {currentFilter === 'All' ? 'Filter' : currentFilter}
            </Button>
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                {['All', 'Synced', 'Linked', 'Unlinked'].map(f => (
                  <button key={f} onClick={() => { setCurrentFilter(f); setFilterMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">{f}</button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => { setFolderMenuOpen(!folderMenuOpen); setFilterMenuOpen(false); }}>
              <FolderOpen size={16} /> {currentFolder === 'All' ? 'Folders' : currentFolder}
            </Button>
            {folderMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                {['All', 'Images', 'Videos', 'Documents'].map(f => (
                  <button key={f} onClick={() => { setCurrentFolder(f); setFolderMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredFiles.length > 0 ? filteredFiles.map(file => (
          <div key={file._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
              {getFileIcon(file.filename)}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={file.driveUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-white text-slate-700 hover:text-primary rounded shadow-sm border border-slate-200" title="Open Link">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => handleDelete(file._id)} className="p-1.5 bg-white text-red-500 hover:text-red-700 rounded shadow-sm border border-slate-200" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 text-sm truncate" title={file.filename}>{file.filename}</h3>
              <div className="mt-2 text-xs text-slate-500 space-y-1">
                <p className="flex justify-between"><span>Size:</span> <span className="font-medium text-slate-700">{file.size}</span></p>
                <p className="flex justify-between"><span>Product:</span> <span className="font-medium text-slate-700 truncate max-w-[100px]">{file.linkedProduct}</span></p>
                <p className="flex justify-between items-center mt-2">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${file.status === 'Synced' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}`}>
                    {file.status}
                  </span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <FolderOpen size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No media files found</h3>
            <p className="text-slate-500 text-sm mt-1">Upload or link new files to see them here.</p>
          </div>
        )}
      </div>

      {/* Upload/Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon size={18} className="text-primary" />
                Link Drive Media
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-600 hover:text-slate-600">
                <Trash2 size={18} className="hidden" /> {/* Placeholder for alignment */}
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Filename <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newFile.filename}
                  onChange={e => setNewFile({...newFile, filename: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="e.g. course-video-1.mp4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Google Drive URL <span className="text-red-500">*</span></label>
                <input 
                  type="url" 
                  value={newFile.driveUrl}
                  onChange={e => setNewFile({...newFile, driveUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="https://drive.google.com/file/d/..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">File Size</label>
                  <input 
                    type="text" 
                    value={newFile.size}
                    onChange={e => setNewFile({...newFile, size: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g. 2.4 GB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Linked Product</label>
                  <select 
                    value={newFile.linkedProduct}
                    onChange={e => setNewFile({...newFile, linkedProduct: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="None">None</option>
                    {products.map(p => (
                      <option key={p.id || p._id} value={p.id || p._id}>{p.name || p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Link Media</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
