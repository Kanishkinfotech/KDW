import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../../components/Button';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Only redirect if both global auth and local session storage are set
    const role = (user && user.role) ? String(user.role).toLowerCase() : '';
    const hasSession = sessionStorage.getItem('admin_session') === 'true';
    if (isAuthenticated && role === 'admin' && hasSession) {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: data.password }),
      });

      let result;
      let rawText = '';
      try {
        rawText = await response.text();
        result = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error(`Server error`);
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to login');
      }

      const userData = result.data || result.user || {}; // Fallback just in case
      const token = result.token || userData.token;
      
      const role = userData.role ? String(userData.role).toLowerCase() : '';

      if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('Access denied. You do not have admin privileges.');
      }

      // Set the session flag before calling global login to trigger AdminLayout properly
      sessionStorage.setItem('admin_session', 'true');
      window.dispatchEvent(new Event('admin_session_updated'));

      login( {
        id: userData.id || userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      });
      
      navigate('/admin');
    } catch (error: any) {
      setError('root', { message: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 relative overflow-hidden">
      <SEO title="Admin Login | KDW" description="Secure Admin Access" />
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10"></div>
      
      <div className="bg-white p-8 md:p-12 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Admin Portal</h1>
          <p className="text-slate-500">Secure access required</p>
        </div>
        
        {errors.root && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {errors.root.message}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Admin Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className={errors.email ? "text-danger" : "text-slate-400"} aria-hidden="true" />
              </div>
              <input 
                id="email"
                type="email" 
                autoComplete="off"
                {...register("email")}
                className={`w-full bg-slate-50 border ${errors.email ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-primary/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="admin@example.com"
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.email.message}</p>}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className={errors.password ? "text-danger" : "text-slate-400"} aria-hidden="true" />
              </div>
              <input 
                id="password"
                type="password" 
                autoComplete="new-password"
                {...register("password")}
                className={`w-full bg-slate-50 border ${errors.password ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-primary/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
              />
            </div>
            {errors.password && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.password.message}</p>}
          </div>
          
          <Button type="submit" className="w-full mt-4" size="lg" isLoading={isSubmitting}>
            Authenticate <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}
