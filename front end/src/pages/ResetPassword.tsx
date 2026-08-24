import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../components/Button';
import SEO from '../components/SEO';

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });
  const [successMessage, setSuccessMessage] = useState('');

  const onSubmit = async (data: ResetFormValues) => {
    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setSuccessMessage('Password has been successfully reset. You can now login with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      <SEO title="Reset Password" description="Create a new password for your account." />
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Reset Password</h1>
          <p className="text-slate-600">Enter your new secure password below</p>
        </div>
        
        {successMessage ? (
          <div className="text-center">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-6">
              {successMessage}
            </div>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900 hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Proceed to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className={errors.confirmPassword ? "text-danger" : "text-slate-600"} aria-hidden="true" />
                </div>
                <input 
                  id="confirmPassword"
                  type="password" 
                  {...register("confirmPassword")}
                  className={`w-full bg-slate-50 border ${errors.confirmPassword ? 'border-danger focus:ring-danger/50' : 'border-slate-200 focus:ring-primary/50'} rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="••••••••"
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-sm text-danger flex items-center gap-1" role="alert">{errors.confirmPassword.message}</p>}
            </div>
            
            <Button type="submit" className="w-full mt-4" size="lg" isLoading={isSubmitting}>
              Reset Password <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
