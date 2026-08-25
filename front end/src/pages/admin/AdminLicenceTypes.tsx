import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Key, CheckCircle2, Shield, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminLicenceTypes() {
  const [licences, setLicences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activationLimit, setActivationLimit] = useState(1);
  const [domainLimit, setDomainLimit] = useState(1);
  const [durationDays, setDurationDays] = useState(365);
  const [terms, setTerms] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLicences = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products/licences');
      if (res.data.success) {
        setLicences(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching licence types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicences();
  }, []);

  const handleCreateLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Licence name is required');
      return;
    }

    try {
      setIsCreating(true);
      const res = await axios.post('/api/products/licences', {
        name: name.trim(),
        description,
        activationLimit,
        domainLimit,
        durationDays,
        terms
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Licence "${name}" created successfully!`);
        setName('');
        setDescription('');
        setTerms('');
        fetchLicences();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create licence type');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLicence = async (id: string, licenceName: string) => {
    if (!window.confirm(`Are you sure you want to delete the licence "${licenceName}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await axios.delete(`/api/products/licences/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Licence "${licenceName}" deleted successfully`);
        fetchLicences();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete licence type');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="text-primary" size={26} />
            Licence Types & Usage Terms
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Configure standard digital licence templates (Personal, Commercial, Agency, Reseller, Extended Commercial).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Add Licence Type
          </h3>
          <form onSubmit={handleCreateLicence} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Licence Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Enterprise / Team Licence"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Permitted usage scope for customers..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Activations
                </label>
                <input
                  type="number"
                  value={activationLimit}
                  onChange={(e) => setActivationLimit(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Domains
                </label>
                <input
                  type="number"
                  value={domainLimit}
                  onChange={(e) => setDomainLimit(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Days
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 365)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer-Facing Terms
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Explicit legal terms shown to buyer on checkout & invoice..."
                rows={3}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? 'Saving...' : 'Save Licence Template'}
            </button>
          </form>
        </div>

        {/* Licence Templates Cards */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
              Loading licence types...
            </div>
          ) : (
            licences.map((lic) => (
              <div key={lic.id} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{lic.name}</h4>
                      {lic.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Default Standard
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{lic.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteLicence(lic.id, lic.name)}
                      disabled={deletingId === lic.id}
                      title={`Delete "${lic.name}"`}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    >
                      {deletingId === lic.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Shield size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Activations</span>
                    <span className="font-black text-slate-900 mt-0.5 block">{lic.activationLimit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Domains</span>
                    <span className="font-black text-slate-900 mt-0.5 block">{lic.domainLimit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Duration</span>
                    <span className="font-black text-slate-900 mt-0.5 block">{lic.durationDays > 1000 ? 'Lifetime' : `${lic.durationDays} Days`}</span>
                  </div>
                </div>

                {lic.terms && (
                  <div className="p-2.5 rounded-xl bg-slate-100/70 text-[11px] text-slate-600 font-medium">
                    <span className="font-bold text-slate-800">Terms:</span> {lic.terms}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
