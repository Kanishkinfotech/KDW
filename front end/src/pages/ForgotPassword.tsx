import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../components/Button';
import SEO from '../components/SEO';

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema)
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenMsg, setTokenMsg] = useState('');

  const onSubmit = async (data: ForgotFormValues) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to request reset');
      }

      setSuccessMessage('Password reset link has been simulated. See token below:');
      if (result.token) {
        setTokenMsg(result.token);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      <SEO title="Forgot Password" description="Reset your Kanishk Digital World password." />
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Forgot Password</h1>
          <p className="text-slate-600">Enter your email to receive a reset link</p>
        </div>
        
        {successMessage ? (
          <div className="text-center">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-6">
              {successMessage}
              {tokenMsg && (
                <div className="mt-2 text-xs font-mono bg-white p-2 rounded border border-green-100 break-all">
                  {tokenMsg}
                </div>
              )}
            </div>
            {tokenMsg && (
              <p className="text-sm text-slate-600 mb-6">
                Copy the token above and proceed to the <Link to={`/reset-password/${tokenMsg}`} className="text-primary font-semibold hover:underline">Reset Password</Link> page.
              </p>
            )}
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900 hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
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
            
            <Button type="submit" className="w-full mt-4" size="lg" isLoading={isSubmitting}>
              Send Reset Link <ArrowRight size={18} aria-hidden="true" />
            </Button>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
