'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Upload, Camera, Lock, X, Sprout, Calendar, IndianRupee, Shield, FileText, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Capsicum', 'Okra'];
const SHELF_LIFE_OPTIONS = [24, 48, 72, 96, 120, 168, 240];

const STEPS = [
  { label: 'Crop Details', icon: Sprout },
  { label: 'Harvest Info', icon: Calendar },
  { label: 'Pricing', icon: IndianRupee },
  { label: 'Quality', icon: Shield },
  { label: 'Review', icon: FileText },
];

interface FormData {
  crop: string;
  quantity: string;
  location: string;
  harvestDate: string;
  shelfLife: string;
  expectedPrice: string;
  floorPrice: string;
  qualityDetails: string;
  packagingDetails: string;
  productImages: File[];
  packingVideo: File | null;
}

const initialFormData: FormData = {
  crop: '',
  quantity: '',
  location: '',
  harvestDate: '',
  shelfLife: '',
  expectedPrice: '',
  floorPrice: '',
  qualityDetails: '',
  packagingDetails: '',
  productImages: [],
  packingVideo: null,
};

export default function CreateListing() {
  const { user, navigate, showToast, setListings, listings } = useAppStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...initialFormData, location: user?.location || '' });
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof FormData, value: string | File[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, productImages: [...prev.productImages, ...files] }));
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, packingVideo: file }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, productImages: prev.productImages.filter((_, i) => i !== index) }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 0: return !!(form.crop && form.quantity && Number(form.quantity) > 0 && form.location);
      case 1: return !!(form.harvestDate && form.shelfLife);
      case 2: return !!(form.expectedPrice && Number(form.expectedPrice) > 0);
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: user.id,
          crop: form.crop,
          quantity: Number(form.quantity),
          unit: 'kg',
          location: form.location,
          harvestDate: form.harvestDate,
          shelfLife: Number(form.shelfLife),
          expectedPrice: Number(form.expectedPrice),
          floorPrice: form.floorPrice ? Number(form.floorPrice) : undefined,
          qualityDetails: form.qualityDetails,
          packagingDetails: form.packagingDetails,
          productImages: form.productImages.length > 0 ? form.productImages[0].name : undefined,
          status: 'active',
          region: form.location,
        }),
      });
      if (res.ok) {
        showToast('Listing published successfully!', 'success');
        navigate('farmer-crops');
      } else {
        showToast('Failed to publish listing', 'error');
      }
    } catch (e) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = step < 4 ? validateStep() : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Listing</h1>
        <p className="text-gray-500 mt-1">Add your produce to the marketplace</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-green-600 text-white' : isActive ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-400'}`}>
                  {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-green-700' : isDone ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-semibold">{STEPS[step].label}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Crop Type</Label>
                    <Select value={form.crop} onValueChange={(v) => update('crop', v)}>
                      <SelectTrigger><SelectValue placeholder="Select a crop" /></SelectTrigger>
                      <SelectContent>{CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (kg)</Label>
                    <Input type="number" min="1" placeholder="e.g. 50" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input placeholder="e.g. Nashik, Maharashtra" value={form.location} onChange={(e) => update('location', e.target.value)} />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Harvest Date</Label>
                    <Input type="date" value={form.harvestDate} onChange={(e) => update('harvestDate', e.target.value)} max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shelf Life (hours)</Label>
                    <Select value={form.shelfLife} onValueChange={(v) => update('shelfLife', v)}>
                      <SelectTrigger><SelectValue placeholder="Select shelf life" /></SelectTrigger>
                      <SelectContent>{SHELF_LIFE_OPTIONS.map((h) => <SelectItem key={h} value={String(h)}>{h} hours ({(h / 24).toFixed(h % 24 === 0 ? 0 : 1)} day{h >= 48 ? 's' : ''})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-700">
                    <Calendar className="h-4 w-4 inline mr-1.5" /> Expected availability: {form.harvestDate && form.shelfLife ? `Available for ~${form.shelfLife} hours from ${new Date(form.harvestDate).toLocaleDateString()}` : 'Set harvest date and shelf life above'}
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Expected Price per kg (₹)</Label>
                    <Input type="number" min="1" placeholder="e.g. 40" value={form.expectedPrice} onChange={(e) => update('expectedPrice', e.target.value)} />
                    <p className="text-xs text-gray-400">This is the price shown to buyers</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-gray-400" /> Floor Price per kg (₹) <span className="text-xs text-gray-400 font-normal">Private</span>
                    </Label>
                    <Input type="number" min="1" placeholder="Minimum acceptable price" value={form.floorPrice} onChange={(e) => update('floorPrice', e.target.value)} />
                    <p className="text-xs text-amber-600 flex items-center gap-1"><Lock className="h-3 w-3" /> This price is never shown to buyers. It&apos;s used by our AI to negotiate on your behalf.</p>
                  </div>
                  {form.expectedPrice && form.floorPrice && Number(form.floorPrice) >= Number(form.expectedPrice) && (
                    <p className="text-xs text-red-500">Floor price should be less than the expected price.</p>
                  )}
                </>
              )}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Quality Details</Label>
                    <Textarea placeholder="Describe the quality of your produce: grade, variety, organic certification, etc." value={form.qualityDetails} onChange={(e) => update('qualityDetails', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Packaging Details</Label>
                    <Textarea placeholder="Describe how the produce is packed: crate size, packaging material, etc." value={form.packagingDetails} onChange={(e) => update('packagingDetails', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Images</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-green-300 transition-colors cursor-pointer" onClick={() => imageRef.current?.click()}>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload images</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB each</p>
                    </div>
                    <input ref={imageRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imagePreviews.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Packing Video</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-green-300 transition-colors cursor-pointer" onClick={() => videoRef.current?.click()}>
                      <Camera className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-sm text-gray-500">Upload packing video</p>
                    </div>
                    <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                    {form.packingVideo && <p className="text-xs text-green-600">{form.packingVideo.name} selected</p>}
                  </div>
                </>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 flex items-center gap-2 text-green-700">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Review your listing before publishing</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReviewField label="Crop" value={form.crop} onEdit={() => setStep(0)} />
                    <ReviewField label="Quantity" value={`${form.quantity} kg`} onEdit={() => setStep(0)} />
                    <ReviewField label="Location" value={form.location} onEdit={() => setStep(0)} />
                    <ReviewField label="Harvest Date" value={form.harvestDate} onEdit={() => setStep(1)} />
                    <ReviewField label="Shelf Life" value={form.shelfLife ? `${form.shelfLife} hours` : '-'} onEdit={() => setStep(1)} />
                    <ReviewField label="Expected Price" value={form.expectedPrice ? `₹${form.expectedPrice}/kg` : '-'} onEdit={() => setStep(2)} />
                    <ReviewField label="Floor Price (Private)" value={form.floorPrice ? `₹${form.floorPrice}/kg` : 'Not set'} onEdit={() => setStep(2)} icon={<Lock className="h-3 w-3" />} />
                    <ReviewField label="Quality" value={form.qualityDetails || 'Not provided'} onEdit={() => setStep(3)} />
                  </div>
                  <ReviewField label="Packaging" value={form.packagingDetails || 'Not provided'} onEdit={() => setStep(3)} />
                  <div className="text-xs text-gray-400">Product Images: {form.productImages.length > 0 ? `${form.productImages.length} file(s) uploaded` : 'None'} | Video: {form.packingVideo ? form.packingVideo.name : 'None'}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('farmer-crops')} className="gap-1">
          {step > 0 ? <><ArrowLeft className="h-4 w-4" /> Previous</> : 'Cancel'}
        </Button>
        {step < 4 ? (
          <Button className="bg-green-600 hover:bg-green-700 gap-1" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700 gap-1" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Publishing...' : <><Check className="h-4 w-4" /> Publish Listing</>}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewField({ label, value, onEdit, icon }: { label: string; value: string; onEdit: () => void; icon?: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">{icon}{label}</span>
        <button onClick={onEdit} className="text-xs text-green-600 hover:underline">Edit</button>
      </div>
      <p className="text-sm font-medium text-gray-900 line-clamp-2">{value}</p>
    </div>
  );
}
