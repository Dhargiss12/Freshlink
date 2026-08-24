'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Camera, X, Play, Square, Sparkles, Shield, Leaf, Eye, Package, AlertTriangle, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

interface QualityResult {
  qualityScore: number;
  freshness: number;
  visibleDamage: string;
  packagingQuality: string;
  appearance: string;
  spoilageIndicators: string;
  explanation: string;
}

function CircularProgress({ value, size = 140, strokeWidth = 12, color = '#16a34a' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }} />
    </svg>
  );
}

function ProgressBar({ label, value, color = 'bg-green-500' }: { label: string; value: string; color?: string }) {
  const numVal = parseInt(value, 10) || 50;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span className="font-medium text-gray-800">{value}</span></div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${numVal}%` }} /></div>
    </div>
  );
}

export default function QualityCheck() {
  const { user, showToast } = useAppStore();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<QualityResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
    } catch {
      showToast('Camera access denied or not available', 'error');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImages((prev) => [...prev, file]);
        const url = URL.createObjectURL(blob);
        setPreviews((prev) => [...prev, url]);
      }
      stopCamera();
    }, 'image/jpeg');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
  };

  const runAnalysis = async () => {
    if (images.length === 0) { showToast('Please upload or capture an image first', 'error'); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const formData = new FormData();
      images.forEach((img) => formData.append('images', img));
      if (user) formData.append('farmerId', user.id);
      const res = await fetch('/api/quality', { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (data && data.qualityScore !== undefined) {
        setResult(data);
      } else {
        // Demo result
        setResult({
          qualityScore: 82, freshness: '88%', visibleDamage: 'Minimal (5%)',
          packagingQuality: 'Good (80%)', appearance: 'Fresh and vibrant (85%)',
          spoilageIndicators: 'None detected',
          explanation: 'The produce appears to be in good condition. Color is vibrant with minimal surface damage. No visible signs of bruising, mold, or bacterial growth detected. Packaging is intact and provides adequate protection. Recommend selling within 48 hours for best quality.',
        });
      }
    } catch {
      setResult({
        qualityScore: 78, freshness: '82%', visibleDamage: 'Minor (8%)',
        packagingQuality: 'Fair (70%)', appearance: 'Generally fresh (78%)',
        spoilageIndicators: 'Slight wilting detected',
        explanation: 'The produce shows slight signs of wilting but overall quality is acceptable. Minor surface marks detected. Recommend selling within 24 hours and consider a small price adjustment.',
      });
    } finally { setAnalyzing(false); }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quality Check</h1>
        <p className="text-gray-500 mt-1">AI-powered produce quality analysis</p>
      </motion.div>

      {/* Upload Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold">Upload Produce Photos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-300 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">Upload Photos</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-300 transition-colors cursor-pointer" onClick={startCamera}>
              <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">Open Camera</p>
              <p className="text-xs text-gray-400 mt-1">Take a photo directly</p>
            </div>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />

          {/* Camera View */}
          <AnimatePresence>
            {cameraOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="relative bg-black rounded-xl overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-80 object-contain" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <Button onClick={capturePhoto} className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14 p-0"><Camera className="h-6 w-6" /></Button>
                    <Button onClick={stopCamera} variant="destructive" className="rounded-full w-14 h-14 p-0"><Square className="h-6 w-6" /></Button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}

          <Button className="bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto" onClick={runAnalysis} disabled={analyzing || images.length === 0}>
            {analyzing ? <><Sparkles className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Shield className="h-4 w-4" /> Run AI Quality Check</>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {analyzing && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center"><Skeleton className="h-40 w-40 rounded-full mx-auto mb-4" /><Skeleton className="h-6 w-48 mx-auto" /></CardContent></Card>
          </motion.div>
        )}
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  <CircularProgress value={result.qualityScore} color={scoreColor(result.qualityScore)} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold" style={{ color: scoreColor(result.qualityScore) }}>{result.qualityScore}</span>
                    <span className="text-xs text-gray-500">/ 100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <ProgressBar label="Freshness" value={result.freshness} color="bg-green-500" />
                  <ProgressBar label="Visible Damage" value={result.visibleDamage} color="bg-yellow-500" />
                  <ProgressBar label="Packaging Quality" value={result.packagingQuality} color="bg-blue-500" />
                  <ProgressBar label="Appearance" value={result.appearance} color="bg-emerald-500" />
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className={`h-4 w-4 ${result.spoilageIndicators === 'None detected' ? 'text-green-500' : 'text-orange-500'}`} />
                    <span className="text-gray-600">Spoilage: <strong>{result.spoilageIndicators}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Explanation */}
            <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
              <CardContent className="p-5 flex gap-3">
                <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Analysis</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.explanation}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              <Info className="h-3.5 w-3.5" /> This is a demo quality analysis for demonstration purposes.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
