import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotBanner, setShowForgotBanner] = useState(false);
  const [lastFailedEmail, setLastFailedEmail] = useState('');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Validate and sanitize safe internal redirect URL
  const rawRedirect = searchParams.get('redirect') || '/account';
  const safeRedirectUrl = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) 
    ? rawRedirect 
    : '/account';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true,
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    try {
      const result = await authApi.login({ 
        email: normalizedEmail, 
        password: data.password 
      });

      if (!result.success) {
        throw new Error(result.message || 'Invalid email or password.');
      }

      const userData = result.user || (result as any).data || {};
      const token = result.token;

      setFailedAttempts(0);
      setShowForgotBanner(false);

      login(userData, token);

      toast.success(`Welcome back, ${userData.name || 'Member'}!`);
      navigate(safeRedirectUrl, { replace: true });
    } catch (error: any) {
      const responseData = error.response?.data;
      const serverFailedAttempts = responseData?.failedAttempts;
      const showForgot = responseData?.showForgotOption;

      const newCount = serverFailedAttempts || (failedAttempts + 1);
      setFailedAttempts(newCount);
      setLastFailedEmail(normalizedEmail);

      if (newCount >= 3 || showForgot) {
        setShowForgotBanner(true);
      }

      const message = responseData?.message || error.message || 'Invalid email or password. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#fcfbf9] text-slate-900 flex items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden font-sans">
      <SEO title="Customer Sign In | Kanishk Digital World" description="Access your purchases, digital asset licences, and download library." />

      {/* Subtle light blue radial backgrounds matching storefront */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-sky-200/90 shadow-xl shadow-sky-900/5 relative z-10 space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Sign in to your account
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
          <Link
            to={`/login${location.search}`}
            className="py-2.5 text-center text-xs font-bold font-sans rounded-xl bg-white text-blue-700 shadow-2xs transition-all"
          >
            Sign In
          </Link>
          <Link
            to={`/signup${location.search}`}
            className="py-2.5 text-center text-xs font-bold font-sans rounded-xl text-slate-600 hover:text-slate-900 transition-all"
          >
            Create Account
          </Link>
        </div>

        {/* 3-Attempt Failed Lockout / Forgot Password Banner */}
        {showForgotBanner && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-900 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Incorrect password entered 3 times</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Having trouble signing in? Reset your password now with one click to regain access to your account and digital library.
            </p>
            <div className="pt-1">
              <Link
                to={`/forgot-password?email=${encodeURIComponent(lastFailedEmail)}`}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <KeyRound size={14} />
                <span>Reset Password for {lastFailedEmail}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          
          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
              Email
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

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me option */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="rememberMe"
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="text-xs text-slate-600 font-sans cursor-pointer">
              Remember me
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans tracking-wide uppercase transition-all shadow-md kdw-button-press inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-bit encrypted customer authentication</span>
        </div>

        {/* Legal & Policy Agreement */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          By continuing, you agree to KDW's{' '}
          <Link to="/terms" className="text-slate-600 hover:text-blue-600 underline transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-slate-600 hover:text-blue-600 underline transition-colors">
            Privacy Policy
          </Link>.
        </p>

        {/* Switch to Signup */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account?{' '}
            <Link
              to={`/signup${location.search}`}
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
