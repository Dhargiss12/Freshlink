'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Eye, EyeOff, Loader2, Sprout, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const ops = ['+', '-', '\u00d7'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer: number;
  switch (op) {
    case '+': answer = a + b; break;
    case '-': answer = a - b; break;
    case '\u00d7': answer = a * b; break;
    default: answer = a + b;
  }
  return { question: `What is ${a} ${op} ${b}?`, answer };
}

export default function LoginPage() {
  const { navigate, setUser, showToast, setLoading, loading } = useAppStore();

  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Username is required';
    if (!password) errs.password = 'Password is required';
    if (parseInt(captchaInput) !== captcha.answer) errs.captcha = 'Incorrect answer';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', role, username, password }),
      });
      const data = await safeJson(res);
      if (!data) {
        showToast('Invalid response from server. Please try again.', 'error');
        return;
      }
      if (!res.ok) {
        showToast(data.error || 'Login failed', 'error');
        return;
      }
      setUser(data.user);
      showToast('Welcome back!', 'success');
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 size-80 rounded-full bg-green-200/30" />
      <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-emerald-200/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + Tagline */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center size-14 rounded-2xl bg-green-600 shadow-lg shadow-green-200 mb-3"
          >
            <Leaf className="size-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-green-700">FreshLink AI</h1>
          <p className="text-sm text-green-600/70 mt-1">Sell It Before It Spoils.</p>
        </div>

        <Card className="rounded-2xl shadow-xl border-green-100 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-sm text-gray-500">Sign in to continue to FreshLink</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border-2 transition-all duration-200 ${
                    role === 'farmer'
                      ? 'border-green-600 bg-green-50 text-green-700 shadow-md shadow-green-100'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-green-300'
                  }`}
                >
                  <Sprout className="size-4" />
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border-2 transition-all duration-200 ${
                    role === 'buyer'
                      ? 'border-green-600 bg-green-50 text-green-700 shadow-md shadow-green-100'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-green-300'
                  }`}
                >
                  <ShoppingBag className="size-4" />
                  Buyer
                </button>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="login-username"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => { const n = { ...prev }; delete n.username; return n; });
                  }}
                  className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => { const n = { ...prev }; delete n.password; return n; });
                    }}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(!!v)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {/* CAPTCHA */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Verify: {captcha.question} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Your answer"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200 max-w-[200px]"
                />
                <button
                  type="button"
                  onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput(''); }}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Refresh question
                </button>
                {errors.captcha && <p className="text-xs text-red-500">{errors.captcha}</p>}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <Separator className="flex-1" />
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl border-gray-200 hover:bg-green-50 font-medium"
                onClick={() => showToast('Google sign-in coming soon', 'info')}
              >
                <svg className="size-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              {/* Signup Link */}
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('signup')}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Sign Up
                </button>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Forgot Password Dialog */}
        <AlertDialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-green-700">Reset Password</AlertDialogTitle>
              <AlertDialogDescription>
                Password reset is not available in this demo. Please contact support or create a new account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => navigate('signup')}
                className="rounded-xl bg-green-600 hover:bg-green-700"
              >
                Create Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
