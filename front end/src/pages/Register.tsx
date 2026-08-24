import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.fullName,
          email: normalizedEmail,
          password: data.password
        }),
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
        throw new Error(result.message || 'Failed to register');
      }

      // Auto login after successful registration
      login({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      });
      navigate('/dashboard');
      
    } catch (error: any) {
      alert(error.message); // Could be improved with toast
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden my-12">
      <SEO title="Create Account" description="Join Kanishk Digital World to download premium assets." />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10 translate-x-1/4"></div>
      
      <div className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-600">Join KDW to download premium assets</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className={errors.fullName ? "text-danger" : "text-slate-600"} aria-hidden="true" />
              </div>
              <input 
                id="fullName"
                type="text" 
                {...register("fullName")}
                className={`w-full bg-slate-50 border ${errors.fullName ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-accent/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="John Doe"
                aria-invalid={errors.fullName ? "true" : "false"}
              />
            </div>
            {errors.fullName && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.fullName.message}</p>}
          </div>

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
                className={`w-full bg-slate-50 border ${errors.email ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-accent/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="you@example.com"
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.email.message}</p>}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className={errors.password ? "text-danger" : "text-slate-600"} aria-hidden="true" />
              </div>
              <input 
                id="password"
                type="password" 
                {...register("password")}
                className={`w-full bg-slate-50 border ${errors.password ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-accent/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
              />
            </div>
            {errors.password && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.password.message}</p>}
          </div>
          
          <Button type="submit" variant="primary" className="w-full mt-4" size="lg" isLoading={isSubmitting}>
            Create Account <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Already have an account? <Link to="/login" className="text-slate-900 font-semibold hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
