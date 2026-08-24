'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Star, MessageSquare, Clock, User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Feedback } from '@/lib/store';

interface ReliabilityBreakdown {
  overallScore: number;
  productQuality: number;
  onTimeDelivery: number;
  customerFeedback: number;
  orderCompletion: number;
  cancellationRate: number;
}

function CircularProgress({ value, size = 160, strokeWidth = 14, color = '#16a34a' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function FeedbackReliability() {
  const { user, showToast } = useAppStore();
  const [reliability, setReliability] = useState<ReliabilityBreakdown | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [relRes, fbRes] = await Promise.allSettled([
          fetch(`/api/reliability?farmerId=${user.id}`),
          fetch(`/api/feedback?farmerId=${user.id}`),
        ]);
        if (relRes.status === 'fulfilled') {
          const data = await relRes.value.json();
          if (data && data.overallScore !== undefined) setReliability(data);
          else if (user.reliabilityScore) setReliability({
            overallScore: user.reliabilityScore, productQuality: 82, onTimeDelivery: 88, customerFeedback: 79, orderCompletion: 92, cancellationRate: 8,
          });
        }
        if (fbRes.status === 'fulfilled') {
          const data = await fbRes.value.json();
          setFeedback(Array.isArray(data.feedback || data) ? (data.feedback || data) : []);
        }
      } catch {
        showToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, showToast]);

  const breakdown = reliability
    ? [
        { label: 'Product Quality', value: reliability.productQuality, color: 'bg-green-500' },
        { label: 'On-time Delivery', value: reliability.onTimeDelivery, color: 'bg-emerald-500' },
        { label: 'Customer Feedback', value: reliability.customerFeedback, color: 'bg-teal-500' },
        { label: 'Order Completion', value: reliability.orderCompletion, color: 'bg-lime-500' },
        { label: 'Cancellation Rate', value: 100 - reliability.cancellationRate, color: 'bg-green-400' },
      ]
    : [];

  const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Feedback & Reliability</h1>
        <p className="text-gray-500 mt-1">Your performance scores and buyer feedback</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reliability Score */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600" /> Reliability Score</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            {loading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : reliability ? (
              <div className="relative flex items-center justify-center">
                <CircularProgress value={reliability.overallScore} color={scoreColor(reliability.overallScore)} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold" style={{ color: scoreColor(reliability.overallScore) }}>{reliability.overallScore}</span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8"><ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-40" /><p>No score yet</p></div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-lg font-semibold">Score Breakdown</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-gray-800">{item.value}/100</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className={`h-full rounded-full ${item.color}`} initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: 0.2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-green-600" /> All Feedback</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : feedback.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Star className="h-10 w-10 mx-auto mb-2 opacity-40" /><p>No feedback received yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb, i) => (
                <motion.div key={fb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><User className="h-4 w-4 text-green-700" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Buyer #{fb.buyerId?.slice(-4).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(fb.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  {fb.comment && <p className="text-sm text-gray-600">{fb.comment}</p>}
                  <div className="flex gap-3 mt-2">
                    {fb.qualityRating !== undefined && <span className="text-xs text-gray-500">Quality: {fb.qualityRating}/5</span>}
                    {fb.freshnessRating !== undefined && <span className="text-xs text-gray-500">Freshness: {fb.freshnessRating}/5</span>}
                    {fb.packagingRating !== undefined && <span className="text-xs text-gray-500">Packaging: {fb.packagingRating}/5</span>}
                    {fb.deliveryRating !== undefined && <span className="text-xs text-gray-500">Delivery: {fb.deliveryRating}/5</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
