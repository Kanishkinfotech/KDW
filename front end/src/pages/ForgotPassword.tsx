import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: emailParam
    }
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenMsg, setTokenMsg] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState(emailParam);

  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
      setSubmittedEmail(emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (data: ForgotFormValues) => {
    try {
      setSubmittedEmail(data.email);
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to request password reset');
      }

      setSuccessMessage('Password reset link has been generated.');
      if (result.token) {
        setTokenMsg(result.token);
      }
      toast.success('Reset link prepared successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error processing request');
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#fcfbf9] text-slate-900 flex items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden font-sans">
      <SEO title="Forgot Password | Kanishk Digital World" description="Reset your KDW customer account password." />

      {/* Subtle light blue radial backgrounds */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-sky-200/90 shadow-xl shadow-sky-900/5 relative z-10 space-y-6">
        
        {/* Top Eyebrow Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>ACCOUNT RECOVERY</span>
          </div>

          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Forgot password?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Enter your account email to receive instructions to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-4 pt-2 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reset Token Generated</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Click below to set your new password:
              </p>
              {tokenMsg && (
                <div className="pt-2">
                  <Link
                    to={`/reset-password/${tokenMsg}?email=${encodeURIComponent(submittedEmail)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-colors"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className={`w-full bg-slate-50 border ${
                    errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                  } rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all shadow-2xs`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans tracking-wide uppercase transition-all shadow-md kdw-button-press inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <span>Generating link...</span>
              ) : (
                <>
                  <span>Send reset link</span>
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
                <span>Back to Sign In</span>
              </Link>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
