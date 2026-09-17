import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const emailQuery = searchParams.get('email') || '';
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });
  const [successMessage, setSuccessMessage] = useState('');

  const onSubmit = async (data: ResetFormValues) => {
    setErrorMessage('');
    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: data.password, email: emailQuery }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setSuccessMessage('Password has been successfully updated! You can now sign in with your new password.');
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error updating password');
      toast.error(error.message || 'Error updating password');
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#fcfbf9] text-slate-900 flex items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden font-sans">
      <SEO title="Reset Password | Kanishk Digital World" description="Choose a new secure password for your account." />

      {/* Subtle light blue radial backgrounds */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-sky-200/90 shadow-xl shadow-sky-900/5 relative z-10 space-y-6">
        
        {/* Top Eyebrow Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>NEW CREDENTIALS</span>
          </div>

          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Reset password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Enter and confirm your new secure password.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-4 pt-2 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold transition-colors"
              >
                <span>Go to Sign In</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
                New password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 border ${
                    errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                  } rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all shadow-2xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
                Confirm new password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 border ${
                    errors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                  } rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all shadow-2xs`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans tracking-wide uppercase transition-all shadow-md kdw-button-press inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <span>Updating password...</span>
              ) : (
                <>
                  <span>Save new password</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
