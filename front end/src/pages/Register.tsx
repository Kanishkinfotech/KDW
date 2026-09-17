import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Dynamic security settings from backend
  const [minPasswordLength, setMinPasswordLength] = useState<number>(8);
  const [requireUpperAndNum, setRequireUpperAndNum] = useState<boolean>(true);
  const [requireSpecial, setRequireSpecial] = useState<boolean>(false);

  useEffect(() => {
    axios.get('/api/settings/public')
      .then(res => {
        if (res.data?.success && res.data.data) {
          if (res.data.data.min_password_length) {
            setMinPasswordLength(Number(res.data.data.min_password_length));
          }
          if (res.data.data.require_uppercase_and_numbers !== undefined) {
            setRequireUpperAndNum(Boolean(res.data.data.require_uppercase_and_numbers));
          }
          if (res.data.data.require_special_characters !== undefined) {
            setRequireSpecial(Boolean(res.data.data.require_special_characters));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Validate and sanitize safe internal redirect URL
  const rawRedirect = searchParams.get('redirect') || '/account';
  const safeRedirectUrl = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) 
    ? rawRedirect 
    : '/account';

  const registerSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().superRefine((val, ctx) => {
      if (val.length < minPasswordLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Password must be at least ${minPasswordLength} characters long.`
        });
      }
      if (requireUpperAndNum) {
        if (!/[A-Z]/.test(val) || !/[0-9]/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must include at least one uppercase letter and one number.'
          });
        }
      }
      if (requireSpecial) {
        if (!/[^A-Za-z0-9]/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must contain at least one special character.'
          });
        }
      }
    }),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const currentPassword = watch('password') || '';
  const hasMinLength = currentPassword.length >= minPasswordLength;
  const hasUpper = /[A-Z]/.test(currentPassword);
  const hasNumber = /[0-9]/.test(currentPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(currentPassword);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const result = await authApi.register({
        name: data.fullName.trim(),
        email: normalizedEmail,
        password: data.password,
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to create account.');
      }

      const userData = result.user || (result as any).data || {};
      const token = result.token;

      // Auto login after successful registration
      login(userData, token);

      toast.success(`Account created successfully! Welcome, ${userData.name || 'Member'}!`);
      navigate(safeRedirectUrl, { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create account. Please check your details.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#fcfbf9] text-slate-900 flex items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden font-sans">
      <SEO title="Create Customer Account | Kanishk Digital World" description="Create an account to download digital toolkits, access licence keys, and manage orders." />

      {/* Subtle light blue radial backgrounds */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-sky-200/90 shadow-xl shadow-sky-900/5 relative z-10 space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Join Kanishk Digital World to access your digital assets
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
          <Link
            to={`/login${location.search}`}
            className="py-2.5 text-center text-xs font-bold font-sans rounded-xl text-slate-600 hover:text-slate-900 transition-all"
          >
            Sign In
          </Link>
          <Link
            to={`/signup${location.search}`}
            className="py-2.5 text-center text-xs font-bold font-sans rounded-xl bg-white text-blue-700 shadow-2xs transition-all"
          >
            Create Account
          </Link>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          
          {/* Name field */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                {...register('fullName')}
                placeholder="Jane Doe"
                className={`w-full bg-slate-50 border ${
                  errors.fullName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                } rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all shadow-2xs`}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.fullName.message}</p>
            )}
          </div>

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
            <label htmlFor="password" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
              Password
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Dynamic Security Policy Requirements Checklist */}
            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px] font-sans">
              <span className="font-bold text-slate-600 block text-[10px] uppercase tracking-wider">
                Store Security Rules:
              </span>
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle size={12} className="text-slate-400 shrink-0" />
                )}
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least {minPasswordLength} characters
                </span>
              </div>
              {requireUpperAndNum && (
                <div className="flex items-center gap-1.5">
                  {hasUpper && hasNumber ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={12} className="text-slate-400 shrink-0" />
                  )}
                  <span className={hasUpper && hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    One uppercase letter (A-Z) & one number (0-9)
                  </span>
                </div>
              )}
              {requireSpecial && (
                <div className="flex items-center gap-1.5">
                  {hasSpecial ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={12} className="text-slate-400 shrink-0" />
                  )}
                  <span className={hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    At least one special character (!@#$%^&*)
                  </span>
                </div>
              )}
            </div>

            {errors.password && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-bold font-sans uppercase tracking-wider text-slate-700">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className={`w-full bg-slate-50 border ${
                  errors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                } rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition-all shadow-2xs`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans tracking-wide uppercase transition-all shadow-md kdw-button-press inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-bit encrypted customer registration</span>
        </div>

        {/* Legal & Policy Agreement */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          By registering, you agree to KDW's{' '}
          <Link to="/terms" className="text-slate-600 hover:text-blue-600 underline transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-slate-600 hover:text-blue-600 underline transition-colors">
            Privacy Policy
          </Link>.
        </p>

        {/* Switch to Sign In */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link
              to={`/login${location.search}`}
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
