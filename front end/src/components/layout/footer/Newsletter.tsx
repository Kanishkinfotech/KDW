import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="bg-slate-100/50 p-6 rounded-2xl border border-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-2">Stay Updated</h3>
      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
        Join our newsletter for the latest premium templates, resources, and exclusive deals.
      </p>

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email" 
          disabled={status !== 'idle'}
          className="w-full bg-white/80 border border-slate-200 text-slate-900 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
          required
        />
        <button 
          type="submit"
          disabled={status !== 'idle'}
          className="absolute right-2 top-2 p-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
          aria-label="Subscribe"
        >
          {status === 'loading' ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
            </motion.div>
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center rounded-2xl z-10"
          >
            <CheckCircle2 size={32} className="text-success mb-2" />
            <span className="text-slate-900 font-medium">Subscribed successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
