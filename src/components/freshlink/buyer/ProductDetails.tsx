'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, Clock, ShieldCheck, Gavel, ShoppingCart,
  IndianRupee, Calendar, ThumbsUp, Tag, User, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore, type Listing, type Discount } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱', Bhendi: '🥒',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

function getFreshnessDetails(harvestDate: string, shelfLife: number) {
  const hoursSince = (Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60);
  const remaining = shelfLife - hoursSince;
  const pct = Math.max(0, (remaining / shelfLife) * 100);
  if (remaining <= 0) return { label: 'Expired', pct: 0, color: 'text-red-600', barColor: 'bg-red-500', remainingText: 'Expired', hoursLeft: 0 };
  if (pct < 20) return { label: 'Low Freshness', pct, color: 'text-orange-600', barColor: 'bg-orange-500', remainingText: `${Math.ceil(remaining)}h remaining`, hoursLeft: remaining };
  if (pct < 50) return { label: 'Moderate Freshness', pct, color: 'text-yellow-600', barColor: 'bg-yellow-500', remainingText: `${Math.floor(remaining / 24)}d ${Math.floor(remaining % 24)}h remaining`, hoursLeft: remaining };
  return { label: 'High Freshness', pct, color: 'text-green-600', barColor: 'bg-green-500', remainingText: `${Math.floor(remaining / 24)}d ${Math.floor(remaining % 24)}h remaining`, hoursLeft: remaining };
}

function getSpoilageBadge(harvestDate: string, shelfLife: number) {
  const used = (Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60);
  const pct = used / shelfLife;
  if (pct >= 0.8) return { label: 'Critical Risk', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (pct >= 0.6) return { label: 'High Risk', cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (pct >= 0.3) return { label: 'Medium Risk', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: 'Low Risk', cls: 'bg-green-100 text-green-700 border-green-200' };
}

export default function ProductDetails() {
  const { viewParams, selectedListing, navigate, showToast, setSelectedListing, user } = useAppStore();
  const [listing, setListing] = useState<Listing | null>(selectedListing);
  const [loading, setLoading] = useState(!selectedListing);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [preBooking, setPreBooking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (viewParams.listingId) {
          const res = await fetch(`/api/listings/${viewParams.listingId}`);
          const data = await safeJson(res);
          if (!data) return;
          const raw = data.listing || data;
          if (raw.id) {
            // Map API response (nested farmer) to store Listing type
            const mapped: Listing = {
              ...raw,
              farmerName: raw.farmer?.name,
              farmerReliability: raw.farmer?.reliabilityScore,
            };
            setListing(mapped);
            setSelectedListing(mapped);
          }
        }
        if (viewParams.listingId || selectedListing) {
          const crop = listing?.crop || selectedListing?.crop || '';
          if (crop) {
            const discRes = await fetch(`/api/discounts?crop=${encodeURIComponent(crop)}`);
            const discData = await safeJson(discRes);
            if (!discData) return;
            const discArr = discData.discounts || discData;
            setDiscounts(Array.isArray(discArr) ? discArr : []);
          }
        }
      } catch (e) {
        console.error('Product details fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    if (!selectedListing || viewParams.listingId) fetchData();
    else if (selectedListing) {
      fetch(`/api/discounts?crop=${encodeURIComponent(selectedListing.crop)}`)
        .then(r => safeJson(r)).then(d => { if (!d) return; const arr = d.discounts || d; setDiscounts(Array.isArray(arr) ? arr : []); }).catch(() => {});
    }
  }, [viewParams.listingId]);

  const handlePreBook = async () => {
    if (!listing || !user) return;
    setPreBooking(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id, buyerId: user.id, farmerId: listing.farmerId,
          agreedPrice: listing.expectedPrice, quantity: listing.quantity,
          deliveryMethod: 'standard',
        }),
      });
      const data = await safeJson(res);
      if (!data) { showToast('Error creating order', 'error'); return; }
      const order = data.order || data;
      if (order.id) {
        showToast('Order created! Proceeding to payment...', 'success');
        navigate('buyer-orders', { orderId: order.id, showPayment: true });
      } else {
        showToast('Failed to create order. Try making an offer instead.', 'error');
      }
    } catch {
      showToast('Error creating order', 'error');
    } finally {
      setPreBooking(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /></div>;
  }

  if (!listing) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600">Product not found</h3>
        <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => navigate('buyer-discover')}>Browse Products</Button>
      </div>
    );
  }

  const freshness = getFreshnessDetails(listing.harvestDate, listing.shelfLife);
  const spoilage = getSpoilageBadge(listing.harvestDate, listing.shelfLife);
  const activeDiscounts = discounts.filter(d => d.status === 'active');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" className="text-gray-500 -ml-2" onClick={() => navigate('buyer-discover')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Product Image / Visual */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative h-64 md:h-80 rounded-2xl bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <span className="text-[100px] md:text-[120px] drop-shadow-lg">{CROP_EMOJIS[listing.crop] || '🌱'}</span>
            {/* Quality Score Overlay */}
            {listing.qualityScore && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-[10px] text-gray-500">Quality</p>
                  <p className="text-lg font-bold text-green-700">{listing.qualityScore}/100</p>
                </div>
              </div>
            )}
            {/* Spoilage Badge */}
            <div className="absolute bottom-4 left-4">
              <Badge variant="outline" className={`border ${spoilage.cls} text-xs px-3 py-1`}>
                <AlertTriangle className="h-3 w-3 mr-1" /> {spoilage.label}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Right: Product Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{listing.crop}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><User className="h-4 w-4" />{listing.farmerName || 'Farmer'}</span>
              {listing.farmerReliability && (
                <span className="flex items-center gap-1 text-green-600"><ShieldCheck className="h-4 w-4" />{listing.farmerReliability}% reliable</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Price per kg</p>
            <p className="text-3xl font-bold text-green-700">₹{listing.expectedPrice}</p>
            <p className="text-sm text-gray-500 mt-1">{listing.quantity} {listing.unit} available</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Harvest Date</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{new Date(listing.harvestDate).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{listing.location}</p>
            </div>
            <div className={`rounded-lg p-3 ${freshness.hoursLeft > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Freshness</p>
              <p className={`text-sm font-medium mt-1 ${freshness.color}`}>{freshness.remainingText}</p>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <motion.div className={`h-full rounded-full ${freshness.barColor}`} initial={{ width: 0 }} animate={{ width: `${freshness.pct}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Shelf Life</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{listing.shelfLife}h ({(listing.shelfLife / 24).toFixed(1)} days)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-base" onClick={() => navigate('buyer-negotiation', { listingId: listing.id })}>
              <Gavel className="h-5 w-5 mr-2" /> Make Offer
            </Button>
            <Button className="flex-1 h-12 bg-emerald-50 text-green-700 hover:bg-emerald-100 border border-green-200 text-base" onClick={handlePreBook} disabled={preBooking}>
              <ShoppingCart className={`h-5 w-5 mr-2 ${preBooking ? 'animate-pulse' : ''}`} /> {preBooking ? 'Booking...' : 'Pre-book'}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Discounts Section */}
      {activeDiscounts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2"><Tag className="h-5 w-5 text-green-600" /> Available Discounts</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDiscounts.map(d => (
                  <div key={d.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-green-600">{d.discountType === 'percentage' ? `${d.discountValue}% off` : `₹${d.discountValue} off`}</Badge>
                      {d.minQuantity && <span className="text-xs text-gray-500">Min {d.minQuantity} kg</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{d.discountType === 'bulk' ? 'Bulk Discount' : `${d.discountType === 'percentage' ? 'Percentage' : 'Fixed'} Discount`}</p>
                    {d.validUntil && <p className="text-xs text-gray-400 mt-1">Valid until {new Date(d.validUntil).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Farmer Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                {listing.farmerName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'F'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{listing.farmerName || 'Farmer'}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{listing.location}</span>
                  {listing.farmerReliability && (
                    <span className="flex items-center gap-1 text-green-600"><Star className="h-3.5 w-3.5 fill-green-600" />{listing.farmerReliability}% reliable</span>
                  )}
                </div>
              </div>
              <Button variant="outline" className="hover:border-green-400" onClick={() => navigate('buyer-nearby')}>
                View Farmer Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
