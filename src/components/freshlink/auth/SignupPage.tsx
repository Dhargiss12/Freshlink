'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Upload, CheckCircle2, Loader2, Sprout, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const langMap: Record<string, string> = { en: 'English', hi: 'Hindi', mr: 'Marathi', ta: 'Tamil', te: 'Telugu' };

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'mr', label: 'मराठी' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
];

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer: number;
  switch (op) {
    case '+': answer = a + b; break;
    case '-': answer = a - b; break;
    case '×': answer = a * b; break;
    default: answer = a + b;
  }
  return { question: `What is ${a} ${op} ${b}?`, answer };
}

export default function SignupPage() {
  const { navigate, setUser, showToast, setLoading, loading } = useAppStore();

  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [form, setForm] = useState({
    name: '',
    age: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    language: 'en',
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idStatus, setIdStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.age || parseInt(form.age) < 1) errs.age = 'Valid age is required';
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.location.trim()) errs.location = 'Location is required';
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
        body: JSON.stringify({ action: 'signup', role, ...form, age: parseInt(form.age), language: langMap[form.language] || 'English' }),
      });
      const data = await safeJson(res);
      if (!data) {
        showToast('Invalid response from server. Please try again.', 'error');
        return;
      }
      if (!res.ok) {
        showToast(data.error || 'Signup failed', 'error');
        return;
      }
      setUser(data.user);
      showToast('Account created successfully!', 'success');
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setIdStatus('uploading');
      // Simulate upload
      setTimeout(() => setIdStatus('done'), 1500);
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
        className="w-full max-w-lg relative z-10"
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
            <h2 className="text-xl font-bold text-gray-800">Create Account</h2>
            <p className="text-sm text-gray-500">Join the agricultural revolution</p>
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

              {/* Full Name & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Rajesh Kumar"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                    Age <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="30"
                    value={form.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="rajesh_farmer"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="rajesh@email.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••"
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Location & Language */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="Nashik, Maharashtra"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="rounded-xl border-green-200 focus-visible:border-green-400 focus-visible:ring-green-200"
                  />
                  {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Language</Label>
                  <Select value={form.language} onValueChange={(v) => updateField('language', v)}>
                    <SelectTrigger className="rounded-xl border-green-200 focus:ring-green-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ID Proof Upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">ID Proof</Label>
                <div className="relative rounded-xl border-2 border-dashed border-green-200 bg-green-50/50 p-4 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {idStatus === 'idle' && (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="size-8 text-green-400" />
                      <p className="text-sm text-gray-500">
                        <span className="text-green-600 font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">Aadhaar, PAN, or Voter ID</p>
                    </div>
                  )}
                  {idStatus === 'uploading' && (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-8 text-green-500 animate-spin" />
                      <p className="text-sm text-gray-500">Uploading {idFile?.name}...</p>
                    </div>
                  )}
                  {idStatus === 'done' && (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="size-8 text-green-500" />
                      <p className="text-sm font-medium text-green-700">{idFile?.name}</p>
                      <p className="text-xs text-green-500">Uploaded successfully</p>
                    </div>
                  )}
                </div>
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
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

              {/* Login Link */}
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Sign In
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
