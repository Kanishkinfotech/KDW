import { useState, useEffect, useRef } from 'react';
import { X, GitMerge, AlertTriangle, ArrowRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CustomerSummary {
  id: string;
  customerCode?: string;
  name: string;
  email: string;
  paidOrdersCount?: number;
  totalSpent?: number;
  customerType?: string;
  status?: string;
}

interface CustomerMergeModalProps {
  initialMasterId?: string;
  initialDuplicateId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerMergeModal({
  initialMasterId = '',
  initialDuplicateId = '',
  onClose,
  onSuccess
}: CustomerMergeModalProps) {
  const [masterSearch, setMasterSearch] = useState('');
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [masterResults, setMasterResults] = useState<CustomerSummary[]>([]);
  const [duplicateResults, setDuplicateResults] = useState<CustomerSummary[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<CustomerSummary | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<CustomerSummary | null>(null);
  const [showMasterDropdown, setShowMasterDropdown] = useState(false);
  const [showDuplicateDropdown, setShowDuplicateDropdown] = useState(false);
  const [reason, setReason] = useState('Customer has multiple guest/account profiles with matching verified email.');
  const [loading, setLoading] = useState(false);

  const masterRef = useRef<HTMLDivElement>(null);
  const duplicateRef = useRef<HTMLDivElement>(null);

  // Initial fetch if IDs passed
  useEffect(() => {
    const fetchInitial = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (initialMasterId) {
        try {
          const res = await axios.get(`/api/admin/customers/search?q=${encodeURIComponent(initialMasterId)}`, { headers });
          if (res.data.customers?.length > 0) {
            setSelectedMaster(res.data.customers[0]);
          }
        } catch (_) {}
      }
      if (initialDuplicateId) {
        try {
          const res = await axios.get(`/api/admin/customers/search?q=${encodeURIComponent(initialDuplicateId)}`, { headers });
          if (res.data.customers?.length > 0) {
            setSelectedDuplicate(res.data.customers[0]);
          }
        } catch (_) {}
      }
    };
    fetchInitial();
  }, [initialMasterId, initialDuplicateId]);

  // Handle master search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!masterSearch.trim()) {
        setMasterResults([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/admin/customers/search?q=${encodeURIComponent(masterSearch.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMasterResults(res.data.customers || []);
      } catch (_) {}
    }, 250);
    return () => clearTimeout(timer);
  }, [masterSearch]);

  // Handle duplicate search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!duplicateSearch.trim()) {
        setDuplicateResults([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/admin/customers/search?q=${encodeURIComponent(duplicateSearch.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDuplicateResults(res.data.customers || []);
      } catch (_) {}
    }, 250);
    return () => clearTimeout(timer);
  }, [duplicateSearch]);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaster?.id || !selectedDuplicate?.id) {
      toast.error('Please select both a Master Record and a Duplicate Record to merge.');
      return;
    }
    if (selectedMaster.id === selectedDuplicate.id) {
      toast.error('Master and Duplicate profiles cannot be the exact same customer.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/customers/merge', {
        masterCustomerId: selectedMaster.id,
        duplicateCustomerId: selectedDuplicate.id,
        reason: reason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Customers successfully merged!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Customer merge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <GitMerge size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Atomic Customer Profile Merge</h3>
              <p className="text-[11px] text-slate-500">Safely combine duplicate accounts into a single master customer profile.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-[11px]">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            Automatic Data Consolidation
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            All paid orders, downloads, product access tokens, licences, consents, and support tickets from the <strong>Duplicate Profile</strong> will be transactionally assigned to the <strong>Master Profile</strong>. The duplicate profile will be retired and archived.
          </p>
        </div>

        <form onSubmit={handleMerge} className="space-y-4 text-xs">
          {/* PROFILE SELECTORS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MASTER PROFILE SELECTOR */}
            <div className="space-y-2" ref={masterRef}>
              <div className="flex items-center justify-between">
                <label className="font-black text-emerald-700 uppercase tracking-wider text-[10px]">
                  1. Master Profile (Retain)
                </label>
                {selectedMaster && (
                  <button
                    type="button"
                    onClick={() => setSelectedMaster(null)}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold"
                  >
                    Change
                  </button>
                )}
              </div>

              {selectedMaster ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{selectedMaster.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                      Master
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{selectedMaster.email}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-100">
                    <span>Code: {selectedMaster.customerCode || selectedMaster.id.slice(0, 8)}</span>
                    <span className="font-bold text-emerald-700">₹{(selectedMaster.totalSpent || 0).toLocaleString()} • {selectedMaster.paidOrdersCount || 0} orders</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={masterSearch}
                    onChange={(e) => {
                      setMasterSearch(e.target.value);
                      setShowMasterDropdown(true);
                    }}
                    onFocus={() => setShowMasterDropdown(true)}
                    placeholder="Search master by name, email, or code..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />

                  {showMasterDropdown && masterResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {masterResults.map(cust => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedMaster(cust);
                            setShowMasterDropdown(false);
                            setMasterSearch('');
                          }}
                          className="p-2.5 hover:bg-emerald-50/60 cursor-pointer transition-colors text-left"
                        >
                          <div className="font-bold text-slate-900 text-xs">{cust.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{cust.email}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{cust.customerCode}</span>
                            <span className="font-semibold text-emerald-600">₹{(cust.totalSpent || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DUPLICATE PROFILE SELECTOR */}
            <div className="space-y-2" ref={duplicateRef}>
              <div className="flex items-center justify-between">
                <label className="font-black text-amber-700 uppercase tracking-wider text-[10px]">
                  2. Duplicate Profile (Merge & Retire)
                </label>
                {selectedDuplicate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDuplicate(null)}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold"
                  >
                    Change
                  </button>
                )}
              </div>

              {selectedDuplicate ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{selectedDuplicate.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                      Duplicate
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{selectedDuplicate.email}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-amber-100">
                    <span>Code: {selectedDuplicate.customerCode || selectedDuplicate.id.slice(0, 8)}</span>
                    <span className="font-bold text-amber-700">₹{(selectedDuplicate.totalSpent || 0).toLocaleString()} • {selectedDuplicate.paidOrdersCount || 0} orders</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={duplicateSearch}
                    onChange={(e) => {
                      setDuplicateSearch(e.target.value);
                      setShowDuplicateDropdown(true);
                    }}
                    onFocus={() => setShowDuplicateDropdown(true)}
                    placeholder="Search duplicate by name, email, or code..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />

                  {showDuplicateDropdown && duplicateResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {duplicateResults.map(cust => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedDuplicate(cust);
                            setShowDuplicateDropdown(false);
                            setDuplicateSearch('');
                          }}
                          className="p-2.5 hover:bg-amber-50/60 cursor-pointer transition-colors text-left"
                        >
                          <div className="font-bold text-slate-900 text-xs">{cust.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{cust.email}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{cust.customerCode}</span>
                            <span className="font-semibold text-amber-600">₹{(cust.totalSpent || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SIDE-BY-SIDE SUMMARY */}
          {selectedMaster && selectedDuplicate && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{selectedDuplicate.name}</span>
                <ArrowRight size={14} className="text-primary shrink-0" />
                <span className="font-bold text-slate-800">{selectedMaster.name}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                Combined: ₹{((selectedMaster.totalSpent || 0) + (selectedDuplicate.totalSpent || 0)).toLocaleString()} spend
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Merge Reason / Audit Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedMaster || !selectedDuplicate}
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              <GitMerge size={14} />
              {loading ? 'Merging Accounts...' : 'Execute Atomic Merge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
