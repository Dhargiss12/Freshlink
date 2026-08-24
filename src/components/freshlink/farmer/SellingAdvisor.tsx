'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles, Leaf, Sun, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Capsicum', 'Okra'];

interface TimeWindow {
  label: string;
  period: string;
  recommended: boolean;
  demandLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  freshnessLevel: string;
  priceTrend: 'up' | 'down' | 'stable';
  reason: string;
}

const DEMO_WINDOWS: TimeWindow[] = [
  { label: 'Today', period: 'Next 12 hours', recommended: false, demandLevel: 'Medium', freshnessLevel: '95%', priceTrend: 'stable', reason: 'Demand is moderate today. Consider waiting for better prices if freshness allows.' },
  { label: 'Tomorrow', period: '12-36 hours', recommended: true, demandLevel: 'High', freshnessLevel: '85%', priceTrend: 'up', reason: 'Tomorrow evening is predicted to have peak demand due to weekend market activity and restaurant restocking.' },
  { label: 'Next 2 days', period: '36-60 hours', recommended: false, demandLevel: 'Medium', freshnessLevel: '70%', priceTrend: 'stable', reason: 'Demand stabilizes. Price remains consistent but freshness starts declining.' },
  { label: 'Next 7 days', period: 'Rest of week', recommended: false, demandLevel: 'Low', freshnessLevel: '30%', priceTrend: 'down', reason: 'Long-term window with lower demand. Risk of spoilage increases significantly.' },
];

const demandColor: Record<string, string> = { Low: 'text-gray-500', Medium: 'text-yellow-600', High: 'text-orange-500', 'Very High': 'text-green-600' };
const trendIcon = (t: string) => t === 'up' ? <TrendingUp className="h-4 w-4 text-green-600" /> : t === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4 text-gray-400" />;

export default function SellingAdvisor() {
  const { user, showToast } = useAppStore();
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [loading, setLoading] = useState(true);
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [bestWindow, setBestWindow] = useState<string>('');
  const [spoilageRisk, setSpoilageRisk] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [remainingHours, setRemainingHours] = useState(72);
  const [spoilageExplanation, setSpoilageExplanation] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings?farmerId=${user?.id}&status=active`);
        const data = await res.json();
        const listings = Array.isArray(data.listings || data) ? (data.listings || data) : [];
        const listing = listings.find((l: any) => l.crop.toLowerCase() === selectedCrop.toLowerCase());

        if (listing) {
          const hoursSince = (Date.now() - new Date(listing.harvestDate).getTime()) / 3600000;
          const remaining = Math.max(0, (listing.shelfLife || 168) - hoursSince);
          setRemainingHours(Math.round(remaining));
          const ratio = hoursSince / (listing.shelfLife || 168);
          if (ratio < 0.25) setSpoilageRisk('Low');
          else if (ratio < 0.5) setSpoilageRisk('Medium');
          else if (ratio < 0.75) setSpoilageRisk('High');
          else setSpoilageRisk('Critical');
          setSpoilageExplanation(`Based on ${listing.crop} harvested ${Math.round(hoursSince)} hours ago with a ${listing.shelfLife}-hour shelf life. ${ratio < 0.5 ? 'The produce is still fresh with good market value.' : 'Consider selling soon to avoid quality degradation and get the best price.'}`);
        } else {
          setRemainingHours(72);
          setSpoilageRisk('Medium');
          setSpoilageExplanation(`No active listing found for ${selectedCrop}. Showing estimated values based on typical shelf life of ${selectedCrop.toLowerCase()}.`);
        }
      } catch {
        setSpoilageExplanation('Could not fetch listing data. Showing demo data.');
      }

      // Simulate windows
      setTimeout(() => {
        setWindows(DEMO_WINDOWS);
        setBestWindow('Tomorrow evening');
        setLoading(false);
      }, 300);
    };
    loadData();
  }, [user, selectedCrop]);

  const spoilageBarWidth = { Low: 25, Medium: 50, High: 75, Critical: 95 }[spoilageRisk];
  const spoilageBarColor = { Low: 'bg-green-500', Medium: 'bg-yellow-500', High: 'bg-orange-500', Critical: 'bg-red-500' }[spoilageRisk];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Selling Advisor</h1>
          <p className="text-gray-500 mt-1">AI-powered best time to sell analysis</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger><Leaf className="h-4 w-4 mr-2 text-green-600" /><SelectValue /></SelectTrigger>
            <SelectContent>{CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Best Window Banner */}
      {!loading && bestWindow && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-lg font-bold">Best selling window: {bestWindow}</h2>
          </div>
          <p className="text-green-100 text-sm">Our AI recommends selling your {selectedCrop} tomorrow evening for maximum profit and buyer availability.</p>
        </motion.div>
      )}

      {/* Time Windows */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-green-600" /> Time Windows</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {windows.map((w, i) => (
              <motion.div key={w.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`border-0 shadow-sm h-full ${w.recommended ? 'ring-2 ring-green-500 bg-green-50/50' : ''}`}>
                  <CardContent className="p-4 flex flex-col h-full">
                    {w.recommended && <Badge className="self-start mb-2 bg-green-600 hover:bg-green-600 text-white">Recommended</Badge>}
                    <h3 className="font-semibold text-gray-900">{w.label}</h3>
                    <p className="text-xs text-gray-400 mb-3">{w.period}</p>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Demand</span><span className={`font-medium ${demandColor[w.demandLevel]}`}>{w.demandLevel}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Freshness</span><span className="font-medium text-gray-700">{w.freshnessLevel}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Price Trend</span><span className="flex items-center gap-1">{trendIcon(w.priceTrend)} <span className="capitalize font-medium">{w.priceTrend}</span></span></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Reason */}
        <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-5 flex gap-3">
            <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Why Tomorrow?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Demand is expected to increase because historical data shows a 20% surge in {selectedCrop.toLowerCase()} purchases on Fridays. Weekend restaurant restocking and farmer market traffic typically peak during this window. Current weather conditions also support favorable transport and delivery logistics.</p>
            </div>
          </CardContent>
        </Card>

        {/* Spoilage Risk */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> Spoilage Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Risk Level</span>
                <span className={`font-semibold ${spoilageRisk === 'Critical' ? 'text-red-600' : spoilageRisk === 'High' ? 'text-orange-600' : spoilageRisk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>{spoilageRisk}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full ${spoilageBarColor}`} initial={{ width: 0 }} animate={{ width: `${spoilageBarWidth}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">Approximately <strong className="text-green-700">{remainingHours} hours</strong> of recommended selling time remaining</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{spoilageExplanation}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
