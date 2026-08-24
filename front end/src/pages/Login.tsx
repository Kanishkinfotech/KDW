import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password: data.password }),
      });

      let result;
      let rawText = '';
      try {
        rawText = await response.text();
        result = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error(`Server returned an invalid response. Raw output: ${rawText.slice(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to login');
      }

      login({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      });
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      <SEO title="Log In" description="Sign in to your Kanishk Digital World account." />
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Log in to access your digital assets</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className={errors.email ? "text-danger" : "text-slate-600"} aria-hidden="true" />
              </div>
              <input 
                id="email"
                type="email" 
                {...register("email")}
                className={`w-full bg-slate-50 border ${errors.email ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-primary/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="you@example.com"
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.email.message}</p>}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:text-accent transition-colors">Forgot password?</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className={errors.password ? "text-danger" : "text-slate-600"} aria-hidden="true" />
              </div>
              <input 
                id="password"
                type="password" 
                {...register("password")}
                className={`w-full bg-slate-50 border ${errors.password ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-primary/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
              />
            </div>
            {errors.password && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.password.message}</p>}
          </div>
          
          <Button type="submit" className="w-full mt-4" size="lg" isLoading={isSubmitting}>
            Sign In <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account? <Link to="/register" className="text-slate-900 font-semibold hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
