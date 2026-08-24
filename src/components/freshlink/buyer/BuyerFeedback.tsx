'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Package, Loader2, CheckCircle, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Order, type Feedback } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

const RATING_CATEGORIES = [
  { key: 'qualityRating', label: 'Product Quality' },
  { key: 'freshnessRating', label: 'Freshness' },
  { key: 'packagingRating', label: 'Packaging' },
  { key: 'deliveryRating', label: 'Delivery' },
];

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} onClick={() => onChange(v)} className={`${sizeClass} transition-transform hover:scale-110`}>
          <Star className={`${sizeClass} ${v <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function BuyerFeedback() {
  const { user, showToast } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [freshnessRating, setFreshnessRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordRes, fbRes] = await Promise.all([
          fetch(`/api/orders?buyerId=${user.id}`),
          fetch(`/api/feedback?buyerId=${user.id}`),
        ]);
        const ordData = await safeJson(ordRes);
        const fbData = await safeJson(fbRes);
        if (!ordData && !fbData) return;
        const allOrders = Array.isArray(ordData) ? ordData : [];
        const allFb = Array.isArray(fbData) ? fbData : [];
        const fbOrderIds = new Set(allFb.map((f: any) => f.orderId));
        setOrders(allOrders.filter(o => (o.status === 'delivered' || o.status === 'completed') && !fbOrderIds.has(o.id)));
        setFeedbacks(allFb);
      } catch (e) {
        console.error('Feedback fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const resetForm = () => {
    setOverallRating(0); setQualityRating(0); setFreshnessRating(0);
    setPackagingRating(0); setDeliveryRating(0); setComment(''); setSelectedOrder(null);
  };

  const handleSubmit = async () => {
    if (!selectedOrder || !user || overallRating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id, buyerId: user.id, farmerId: selectedOrder.farmerId,
          rating: overallRating, qualityRating, freshnessRating, packagingRating, deliveryRating, comment,
        }),
      });
      const data = await safeJson(res);
      if (data && data.id) {
        showToast('Feedback submitted! Thank you.', 'success');
        setFeedbacks(prev => [data, ...prev]);
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
        resetForm();
      } else {
        showToast('Failed to submit feedback', 'error');
      }
    } catch {
      showToast('Error submitting feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Rate & Feedback</h1>
        <p className="text-gray-500 mt-1">Help farmers improve by sharing your experience</p>
      </motion.div>

      {/* Pending Feedback Orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Orders Pending Feedback
              {orders.length > 0 && <Badge className="bg-green-600 text-white text-xs">{orders.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
                <p className="text-sm text-gray-500">All caught up! No pending feedback.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOrder?.id === o.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    onClick={() => { setSelectedOrder(o); setOverallRating(0); setQualityRating(0); setFreshnessRating(0); setPackagingRating(0); setDeliveryRating(0); setComment(''); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl">{CROP_EMOJIS[o.listing?.crop || ''] || '📦'}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{o.listing?.crop || 'Order'} #{o.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{o.quantity} kg · ₹{o.totalAmount.toLocaleString()} · {o.farmer?.name || 'Farmer'}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Feedback Form */}
      {selectedOrder && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rate your experience for {selectedOrder.listing?.crop || 'this order'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Overall Rating */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Overall Rating *</p>
                <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
              </div>

              {/* Sub-ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RATING_CATEGORIES.map(cat => {
                  const setter = cat.key === 'qualityRating' ? setQualityRating : cat.key === 'freshnessRating' ? setFreshnessRating : cat.key === 'packagingRating' ? setPackagingRating : setDeliveryRating;
                  const val = cat.key === 'qualityRating' ? qualityRating : cat.key === 'freshnessRating' ? freshnessRating : cat.key === 'packagingRating' ? packagingRating : deliveryRating;
                  return (
                    <div key={cat.key}>
                      <p className="text-sm font-medium text-gray-700 mb-1.5">{cat.label}</p>
                      <StarRating value={val} onChange={setter} size="sm" />
                    </div>
                  );
                })}
              </div>

              {/* Comment */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Written Feedback</p>
                <Textarea placeholder="Share your experience... (optional)" value={comment} onChange={e => setComment(e.target.value)}
                  className="min-h-[80px] border-gray-200 focus:border-green-400" />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 h-10 bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={submitting || overallRating === 0}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
                  Submit Feedback
                </Button>
                <Button variant="outline" className="h-10" onClick={resetForm}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Previous Feedback */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" /> Previously Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <div className="text-center py-6"><p className="text-sm text-gray-400">No feedback submitted yet</p></div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-600">Order #{fb.orderId.slice(-6).toUpperCase()}</p>
                    {fb.comment && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{fb.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
