'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, MapPin, Star, TrendingUp, Handshake, MessageSquare, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

interface BuyerRec {
  id: string;
  name: string;
  type: string;
  distance: string;
  requiredQuantity: string;
  demandLevel: 'Low' | 'Medium' | 'High';
  reliabilityScore: number;
  matchScore: number;
}

const DEMO_BUYERS: BuyerRec[] = [
  { id: '1', name: 'Rajesh Vegetables', type: 'Retailer', distance: '3.2 km', requiredQuantity: '50 kg', demandLevel: 'High', reliabilityScore: 92, matchScore: 95 },
  { id: '2', name: 'Fresh Mart', type: 'Supermarket', distance: '5.1 km', requiredQuantity: '100 kg', demandLevel: 'High', reliabilityScore: 88, matchScore: 87 },
  { id: '3', name: 'Green Basket', type: 'Wholesaler', distance: '8.4 km', requiredQuantity: '200 kg', demandLevel: 'Medium', reliabilityScore: 85, matchScore: 82 },
  { id: '4', name: 'Farm to Home', type: 'D2C Platform', distance: '2.1 km', requiredQuantity: '30 kg', demandLevel: 'Medium', reliabilityScore: 78, matchScore: 76 },
  { id: '5', name: 'Hotel Green Valley', type: 'Hotel/Restaurant', distance: '1.8 km', requiredQuantity: '25 kg', demandLevel: 'High', reliabilityScore: 95, matchScore: 91 },
];

const demandColor: Record<string, string> = { Low: 'text-gray-500 bg-gray-50', Medium: 'text-yellow-700 bg-yellow-50', High: 'text-green-700 bg-green-50' };

export default function RecommendedBuyers() {
  const { user, navigate, showToast } = useAppStore();
  const [buyers, setBuyers] = useState<BuyerRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recommendations?farmerId=${user?.id}&targetRole=buyer`);
        const data = await res.json();
        const unwrapped = data.recommendations || data;
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          setBuyers(unwrapped.map((d: any) => ({
            id: d.id || d.userId,
            name: d.name,
            type: d.type || d.role || 'Buyer',
            distance: d.distance || 'N/A',
            requiredQuantity: d.requiredQuantity || '-',
            demandLevel: d.demandLevel || 'Medium',
            reliabilityScore: d.reliabilityScore || d.score || 80,
            matchScore: d.matchScore || d.score || 75,
          })));
        } else {
          setBuyers(DEMO_BUYERS);
        }
      } catch {
        setBuyers(DEMO_BUYERS);
      } finally {
        setLoading(false);
      }
    };
    fetchBuyers();
  }, [user]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Recommended Buyers</h1>
        <p className="text-gray-500 mt-1">AI-matched buyers based on your produce and location</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : buyers.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No recommendations yet</h3>
            <p className="text-sm text-gray-400 mt-1">Create listings to get buyer recommendations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyers.map((buyer, i) => (
            <motion.div key={buyer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><Users className="h-5 w-5 text-green-600" /></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{buyer.name}</h3>
                        <Badge variant="outline" className="text-xs font-normal">{buyer.type}</Badge>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 rounded-lg px-2 py-1 text-sm font-bold">{buyer.matchScore}%</div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5 text-gray-400" />{buyer.distance}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Required Quantity</span><span className="font-medium">{buyer.requiredQuantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Demand Level</span>
                      <Badge className={`text-xs ${demandColor[buyer.demandLevel]}`} variant="secondary">{buyer.demandLevel}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-400" />Reliability</span>
                      <span className="font-medium text-gray-700">{buyer.reliabilityScore}/100</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 gap-1" onClick={() => showToast('Pre-booking request sent!', 'success')}>
                      <Handshake className="h-3.5 w-3.5" /> Pre-book
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700" onClick={() => navigate('farmer-messages')}>
                      <MessageSquare className="h-3.5 w-3.5" /> Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
