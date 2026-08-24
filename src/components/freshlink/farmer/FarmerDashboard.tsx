'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sprout,
  PackageCheck,
  IndianRupee,
  Bell,
  PlusCircle,
  BarChart3,
  ShieldCheck,
  Star,
  ArrowRight,
  TrendingUp,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

interface ReliabilityData {
  overallScore: number;
  productQuality: number;
  onTimeDelivery: number;
  customerFeedback: number;
  orderCompletion: number;
  cancellationRate: number;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function CircularProgress({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="#16a34a" strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function FarmerDashboard() {
  const { user, navigate, showToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeCrops, setActiveCrops] = useState(0);
  const [preBookedOrders, setPreBookedOrders] = useState(0);
  const [expectedRevenue, setExpectedRevenue] = useState(0);
  const [reliability, setReliability] = useState<ReliabilityData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, ordersRes, notifRes, feedbackRes, relRes] = await Promise.allSettled([
          fetch(`/api/listings?farmerId=${user.id}&status=active`),
          fetch(`/api/orders?farmerId=${user.id}`),
          fetch(`/api/notifications?userId=${user.id}`),
          fetch(`/api/feedback?farmerId=${user.id}`),
          fetch(`/api/reliability?farmerId=${user.id}`),
        ]);
        if (listingsRes.status === 'fulfilled') {
          const data = await safeJson(listingsRes.value);
          if (data) {
          const arr = data.listings || data;
          setActiveCrops(Array.isArray(arr) ? arr.length : 0);
          }
        }
        if (ordersRes.status === 'fulfilled') {
          const data = await safeJson(ordersRes.value);
          if (data) {
          const orders = Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : [];
          const confirmed = orders.filter((o: any) => o.status === 'confirmed' || o.status === 'preparing');
          setPreBookedOrders(confirmed.length);
          const rev = confirmed.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
          setExpectedRevenue(rev);
          }
        }
        if (notifRes.status === 'fulfilled') {
          const data = await safeJson(notifRes.value);
          if (data) {
          const notifs = data.notifications || data;
          setNotifications(Array.isArray(notifs) ? notifs.slice(0, 4) : []);
          }
        }
        if (feedbackRes.status === 'fulfilled') {
          const data = await safeJson(feedbackRes.value);
          if (data) {
          const fb = data.feedback || data;
          setFeedback(Array.isArray(fb) ? fb.slice(0, 3) : []);
          }
        }
        if (relRes.status === 'fulfilled') {
          const data = await safeJson(relRes.value);
          if (data) {
          const rel = data.reliability || data;
          if (rel && rel.overallScore !== undefined) setReliability(rel);
          else if (user.reliabilityScore) setReliability({
            overallScore: user.reliabilityScore, productQuality: 80, onTimeDelivery: 85, customerFeedback: 78, orderCompletion: 90, cancellationRate: 12,
          });
          }
        }
      } catch (e) {
        console.error('Dashboard fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return null;
  const greeting = getGreeting();

  const summaryCards = [
    { title: 'Active Crops', value: activeCrops, icon: Sprout, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pre-booked Orders', value: preBookedOrders, icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Expected Revenue', value: `₹${expectedRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-700', bg: 'bg-green-50' },
  ];

  const quickActions = [
    { label: 'Create Listing', icon: PlusCircle, view: 'farmer-create-listing' as const },
    { label: 'View Demand', icon: BarChart3, view: 'farmer-demand' as const },
    { label: 'Check Quality', icon: ShieldCheck, view: 'farmer-quality' as const },
  ];

  const safeNum = (v: unknown) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);

  const breakdownItems = reliability
    ? [
        { label: 'Product Quality', value: safeNum(reliability.productQuality) },
        { label: 'On-time Delivery', value: safeNum(reliability.onTimeDelivery) },
        { label: 'Customer Feedback', value: safeNum(reliability.customerFeedback) },
        { label: 'Order Completion', value: safeNum(reliability.orderCompletion) },
        { label: 'Cancellation Rate', value: safeNum(100 - (reliability.cancellationRate as number)) },
      ]
    : [];

  const notifIcon = (type: string) => {
    switch (type) {
      case 'order': return <PackageCheck className="h-4 w-4 text-green-600" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {greeting}, {user.name}!
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your farm and produce today.</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`${card.bg} p-3 rounded-xl`}><card.icon className={`h-6 w-6 ${card.color}`} /></div>
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <div className="text-xl font-bold text-gray-900">{loading ? <Skeleton className="h-7 w-20" /> : card.value}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reliability Score */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" /> Reliability Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            {loading ? (
              <Skeleton className="h-32 w-32 rounded-full" />
            ) : reliability ? (
              <div className="relative flex items-center justify-center">
                <CircularProgress value={reliability.overallScore} size={130} strokeWidth={12} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-green-700">{reliability.overallScore}</span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">No score yet</div>
            )}
            <div className="w-full mt-4 space-y-2">
              {breakdownItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-green-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: 0.3 }} />
                    </div>
                    <span className="font-medium text-gray-700 w-8 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" /> Recent Notifications
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-green-600 text-xs" onClick={() => navigate('notifications')}>View all</Button>
          </CardHeader>
          <CardContent className="pb-4">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : notifications.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n: any) => (
                  <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`p-3 rounded-lg ${n.read ? 'bg-gray-50' : 'bg-green-50 border border-green-100'}`}>
                    <div className="flex items-start gap-2">
                      {notifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-900 font-medium'} truncate`}>{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8"><Bell className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No notifications yet</p></div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions + Recent Feedback */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg font-semibold">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Button key={action.view} variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors" onClick={() => navigate(action.view)}>
                  <action.icon className="h-5 w-5 text-green-600" />
                  {action.label}
                  <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-green-600" /> Recent Feedback
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-green-600 text-xs" onClick={() => navigate('farmer-feedback')}>View all</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : feedback.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {feedback.map((fb: any) => (
                    <div key={fb.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{fb.comment || 'No comment'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4"><p className="text-sm">No feedback received yet</p></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
