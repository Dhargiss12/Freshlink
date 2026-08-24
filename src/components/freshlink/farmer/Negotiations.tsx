'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, ArrowRight, User, IndianRupee, Brain, Clock, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

const statusConfig: Record<string, { label: string; className: string; pulse?: boolean }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 hover:bg-green-100', pulse: true },
  agreed: { label: 'Agreed', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' },
};

export default function Negotiations() {
  const { user, navigate, showToast } = useAppStore();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNegotiations = async () => {
      setLoading(true);
      try {
        // Fetch orders for farmer, then find related negotiations
        const ordersRes = await fetch(`/api/orders?farmerId=${user.id}`);
        const ordersData = await ordersRes.json();
        const orders = Array.isArray(ordersData) ? ordersData : [];

        // Fetch listings to get negotiation context
        const listingsRes = await fetch(`/api/listings?farmerId=${user.id}`);
        const listingsData = await listingsRes.json();
        const listings = Array.isArray(listingsData) ? listingsData : [];

        // Build negotiation view from orders and listings
        // In real app, we'd have a dedicated negotiations endpoint
        const activeOrders = orders.filter((o: any) => ['pending', 'confirmed', 'preparing'].includes(o.status));
        const negList = activeOrders.slice(0, 10).map((order: any, i: number) => ({
          id: order.id,
          listingId: order.listingId,
          crop: order.listing?.crop || listings.find((l: any) => l.id === order.listingId)?.crop || 'Crop',
          buyerName: order.buyer?.name || 'Buyer',
          buyerId: order.buyerId,
          suggestedMin: Math.round(order.agreedPrice * 0.85),
          suggestedMax: Math.round(order.agreedPrice * 1.15),
          currentPrice: order.agreedPrice,
          status: order.status === 'pending' ? 'active' : order.status === 'cancelled' ? 'rejected' : 'agreed',
          lastMessage: i % 2 === 0 ? 'Can you do ₹35/kg? I need 50kg urgently.' : 'Looking forward to a good deal on this.',
          createdAt: order.createdAt,
          quantity: order.quantity,
        }));

        setNegotiations(negList);
      } catch {
        showToast('Failed to load negotiations', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchNegotiations();
  }, [user, showToast]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Negotiations</h1>
        <p className="text-gray-500 mt-1">Manage price discussions with buyers</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : negotiations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No negotiations yet</h3>
            <p className="text-sm text-gray-400 mt-1">When buyers negotiate on your listings, they&apos;ll appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {negotiations.map((neg, i) => {
            const sc = statusConfig[neg.status] || statusConfig.active;
            return (
              <motion.div key={neg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('farmer-negotiations', { negotiationId: neg.id })}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{neg.buyerName}</h3>
                            <Badge className={`${sc.className} ${sc.pulse ? 'animate-pulse' : ''}`} variant="secondary">{sc.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">{neg.crop} · {neg.quantity} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Brain className="h-3 w-3 text-green-500" /> AI Suggested
                          </div>
                          <p className="text-sm font-medium text-gray-700">₹{neg.suggestedMin} – ₹{neg.suggestedMax}/kg</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Current</div>
                          <p className="text-sm font-semibold text-green-700">₹{neg.currentPrice}/kg</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-500 truncate">{neg.lastMessage}</p>
                      <span className="text-xs text-gray-300 ml-auto flex-shrink-0 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(neg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
