import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { api } from '../../shared/api/axios';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please supply a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      const { accessToken, user } = res.data.data;
      
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please verify credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Background glowing emerald circular blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-emerald-700/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-teal-800/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      {/* Login glass card */}
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 shadow-2xl rounded-3xl p-8 z-10">
        
        {/* Brand logo header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="AyurSutra Logo" className="h-28 w-auto object-contain mb-2" />
          <h2 className="font-display font-bold text-xl bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
            Clinical Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Panchakarma Management & Scheduling Workstation
          </p>
        </div>

        {/* Form container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g., doctor@demo.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-700 font-medium transition-all"
            />
            {errors.email && (
              <span className="text-xs text-rose-500 font-medium block mt-1">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-700 font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-600 hover:text-slate-400 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-rose-500 font-medium block mt-1">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-900/10 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to Workstation</span>
            )}
          </button>
        </form>

        {/* Footer credentials reminder */}
        <div className="mt-8 pt-6 border-t border-slate-800/40 text-center">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
            Demo Clinic Logins
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 font-medium">
            <span>Doctor: <strong className="text-emerald-500/80">doctor@demo.com</strong></span>
            <span>Staff: <strong className="text-slate-400">Password123!</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
