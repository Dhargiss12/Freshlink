'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, AlertTriangle, Plus, Eye, Search, IndianRupee, Package, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Listing } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

interface PredictedNeed {
  crop: string;
  estimatedQuantity: number;
  daysUntilLow: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  availableNearby: number;
  avgPrice: number;
  basedOnOrders: number;
}

interface ManualNeed {
  crop: string;
  quantity: string;
  urgency: 'low' | 'medium' | 'high';
}

export default function BuyerNeeds() {
  const { user, navigate, showToast } = useAppStore();
  const [needs, setNeeds] = useState<PredictedNeed[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [manualCrop, setManualCrop] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualUrgency, setManualUrgency] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, listingsRes] = await Promise.all([
          user ? fetch(`/api/orders?buyerId=${user.id}`) : null,
          fetch('/api/listings?status=active'),
        ]);

        const ordData = ordersRes ? await safeJson(ordersRes) : null;
        const listData = await safeJson(listingsRes);
        if (!ordData && !listData) return;
        const allOrders = Array.isArray(ordData?.orders) ? ordData.orders : Array.isArray(ordData) ? ordData : [];
        const rawListings = listData?.listings || listData;
        const activeListings = Array.isArray(rawListings) ? rawListings : [];
        setListings(activeListings);

        if (allOrders.length > 0) {
          const cropStats: Record<string, { total: number; count: number; lastDate: Date }> = {};
          allOrders.forEach((o: any) => {
            const crop = o.listing?.crop;
            if (!crop) return;
            if (!cropStats[crop]) cropStats[crop] = { total: 0, count: 0, lastDate: new Date(0) };
            cropStats[crop].total += o.quantity;
            cropStats[crop].count += 1;
            const d = new Date(o.createdAt);
            if (d > cropStats[crop].lastDate) cropStats[crop].lastDate = d;
          });

          const predicted: PredictedNeed[] = Object.entries(cropStats).map(([crop, stats]) => {
            const avgPerOrder = stats.total / stats.count;
            const daysSinceLast = Math.max(1, Math.floor((Date.now() - stats.lastDate.getTime()) / (1000 * 60 * 60 * 24)));
            const daysUntilLow = Math.max(1, 7 - daysSinceLast);
            const nearby = activeListings.filter(l => l.crop === crop).reduce((s, l) => s + (l.quantity || 0), 0);
            const avgPrice = activeListings.filter(l => l.crop === crop).reduce((s, l) => s + l.expectedPrice, 0) / (activeListings.filter(l => l.crop === crop).length || 1);
            const urgency: 'low' | 'medium' | 'high' | 'critical' = daysUntilLow <= 1 ? 'critical' : daysUntilLow <= 3 ? 'high' : daysUntilLow <= 5 ? 'medium' : 'low';
            return { crop, estimatedQuantity: Math.round(avgPerOrder), daysUntilLow, urgency, availableNearby: nearby, avgPrice: Math.round(avgPrice), basedOnOrders: stats.count };
          }).sort((a, b) => a.daysUntilLow - b.daysUntilLow);

          setNeeds(predicted);
        } else {
          // Demo data
          setNeeds([
            { crop: 'Tomato', estimatedQuantity: 80, daysUntilLow: 2, urgency: 'high', availableNearby: 350, avgPrice: 22, basedOnOrders: 3 },
            { crop: 'Onion', estimatedQuantity: 50, daysUntilLow: 4, urgency: 'medium', availableNearby: 200, avgPrice: 18, basedOnOrders: 2 },
            { crop: 'Spinach', estimatedQuantity: 30, daysUntilLow: 1, urgency: 'critical', availableNearby: 80, avgPrice: 15, basedOnOrders: 4 },
            { crop: 'Potato', estimatedQuantity: 100, daysUntilLow: 6, urgency: 'low', availableNearby: 500, avgPrice: 20, basedOnOrders: 2 },
          ]);
        }
      } catch (e) {
        console.error('Needs fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const urgencyConfig = {
    low: { color: 'text-green-600 bg-green-50 border-green-200', label: 'Low' },
    medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Medium' },
    high: { color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'High' },
    critical: { color: 'text-red-600 bg-red-50 border-red-200', label: 'Critical' },
  };

  const handleAddNeed = () => {
    if (!manualCrop || !manualQty) return;
    setNeeds(prev => [{
      crop: manualCrop, estimatedQuantity: parseInt(manualQty),
      daysUntilLow: manualUrgency === 'high' ? 2 : manualUrgency === 'medium' ? 4 : 7,
      urgency: manualUrgency === 'high' ? 'high' : 'medium',
      availableNearby: listings.filter(l => l.crop.toLowerCase() === manualCrop.toLowerCase()).reduce((s, l) => s + (l.quantity || 0), 0),
      avgPrice: Math.round(listings.filter(l => l.crop.toLowerCase() === manualCrop.toLowerCase()).reduce((s, l) => s + l.expectedPrice, 0) / (listings.filter(l => l.crop.toLowerCase() === manualCrop.toLowerCase()).length || 1) || 0),
      basedOnOrders: 0,
    }, ...prev]);
    setManualCrop(''); setManualQty(''); setManualUrgency('medium'); setShowAdd(false);
    showToast('Need added!', 'success');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">What Do You Need?</h1>
          <p className="text-gray-500 mt-1">Predicted needs based on your order history</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Need
        </Button>
      </motion.div>

      {/* Manual Need Entry */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add a Manual Need</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Crop Name</label>
                  <Input placeholder="e.g. Tomato" value={manualCrop} onChange={e => setManualCrop(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Quantity (kg)</label>
                  <Input type="number" placeholder="e.g. 50" value={manualQty} onChange={e => setManualQty(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Urgency</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(u => (
                      <button key={u} onClick={() => setManualUrgency(u)}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-all capitalize ${manualUrgency === u ? urgencyConfig[u].color + ' border-current' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700" onClick={handleAddNeed} disabled={!manualCrop || !manualQty}>Add</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stock Alerts Banner */}
      {needs.some(n => n.urgency === 'critical' || n.urgency === 'high') && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Stock Alert</p>
              <p className="text-xs text-red-600 mt-0.5">
                {needs.filter(n => n.urgency === 'critical' || n.urgency === 'high').map(n => `${n.crop} (${n.daysUntilLow}d)`).join(', ')}
                {' '}— consider reordering soon!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Predicted Needs */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : needs.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No predicted needs yet</h3>
          <p className="text-sm text-gray-400 mt-1">Place some orders to get AI-powered predictions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {needs.map((need, i) => {
            const config = urgencyConfig[need.urgency];
            return (
              <motion.div key={need.crop} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{CROP_EMOJIS[need.crop] || '🌱'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{need.crop}</h3>
                            <Badge variant="outline" className={`text-[10px] border ${config.color}`}>{config.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {need.estimatedQuantity} kg (may run low in <span className={`font-semibold ${need.daysUntilLow <= 2 ? 'text-red-600' : 'text-gray-900'}`}>{need.daysUntilLow} day{need.daysUntilLow > 1 ? 's' : ''}</span>)
                          </p>
                          {need.basedOnOrders > 0 && <p className="text-[10px] text-gray-400 mt-0.5">Based on {need.basedOnOrders} previous order{need.basedOnOrders > 1 ? 's' : ''}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-green-600">{need.availableNearby} kg available</p>
                        {need.avgPrice > 0 && <p className="text-xs text-gray-400 flex items-center gap-0.5 justify-end"><IndianRupee className="h-3 w-3" />{need.avgPrice}/kg avg</p>}
                      </div>
                    </div>
                    {need.availableNearby > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Nearby farmers have <span className="font-medium text-gray-700">{need.availableNearby} kg</span> available</p>
                        <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => navigate('buyer-search', { query: need.crop })}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </div>
                    )}
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
