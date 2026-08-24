'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingDown, Tag, Users, Eye, Zap, ArrowRight, Clock, Sprout,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Listing } from '@/lib/store';

interface StockAlert {
  listing: Listing;
  hoursRemaining: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

const riskColors = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
};

export default function UnsoldStock() {
  const { user, navigate, showToast } = useAppStore();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings?farmerId=${user.id}&status=active`);
        const data = await res.json();
        const listings = Array.isArray(data.listings || data) ? (data.listings || data) : [];

        const stockAlerts: StockAlert[] = listings.map((l: Listing) => {
          const hoursSince = (Date.now() - new Date(l.harvestDate).getTime()) / 3600000;
          const hoursRemaining = Math.max(0, (l.shelfLife || 168) - hoursSince);
          const ratio = hoursSince / (l.shelfLife || 168);
          let riskLevel: StockAlert['riskLevel'] = 'low';
          if (ratio >= 0.75) riskLevel = 'critical';
          else if (ratio >= 0.5) riskLevel = 'high';
          else if (ratio >= 0.25) riskLevel = 'medium';

          const timeWindow = hoursRemaining <= 24 ? 'within the next 24 hours' : hoursRemaining <= 48 ? 'within the next 48 hours' : 'soon';
          return {
            listing: l,
            hoursRemaining: Math.round(hoursRemaining),
            riskLevel,
            message: `${l.quantity} ${l.unit} ${l.crop} may remain unsold ${timeWindow}`,
          };
        }).sort((a, b) => a.hoursRemaining - b.hoursRemaining);

        setAlerts(stockAlerts);
      } catch {
        showToast('Failed to load stock data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [user, showToast]);

  const recommendations = [
    { icon: TrendingDown, label: 'Reduce Price', desc: 'Lower the expected price to attract buyers faster', action: () => showToast('Navigate to listing to edit price', 'info'), color: 'text-green-600' },
    { icon: Tag, label: 'Create Discount', desc: 'Offer a time-limited discount to boost demand', action: () => navigate('farmer-discounts'), color: 'text-blue-600' },
    { icon: Users, label: 'Contact Buyers', desc: 'Reach out to recommended buyers directly', action: () => navigate('farmer-buyers'), color: 'text-purple-600' },
    { icon: Eye, label: 'Increase Visibility', desc: 'Boost your listing visibility in search results', action: () => showToast('Visibility boosted!', 'success'), color: 'text-orange-600' },
    { icon: Zap, label: 'Sell Immediately', desc: 'List at floor price for immediate sale', action: () => showToast('Listing updated to floor price', 'success'), color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Unsold Stock Risk</h1>
        <p className="text-gray-500 mt-1">Monitor produce at risk of remaining unsold</p>
      </motion.div>

      {/* Alert Cards */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : alerts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Sprout className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">All clear!</h3>
            <p className="text-sm text-gray-400 mt-1">No unsold stock risks detected</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const rc = riskColors[alert.riskLevel];
            return (
              <motion.div key={alert.listing.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`border shadow-sm ${rc.border} ${rc.bg}`}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm"><AlertTriangle className={`h-5 w-5 ${rc.text}`} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${rc.text}`}>⚠ {alert.listing.crop}</h3>
                          <Badge className={rc.badge} variant="secondary">{alert.riskLevel.charAt(0).toUpperCase() + alert.riskLevel.slice(1)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{alert.hoursRemaining}h left</div>
                      <div className="flex items-center gap-1"><Sprout className="h-4 w-4" />{alert.listing.quantity} {alert.listing.unit}</div>
                      <Button size="sm" variant="outline" className="gap-1 hover:bg-white" onClick={() => navigate('farmer-selling', { listingId: alert.listing.id })}>View<ArrowRight className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AI Recommendations */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-green-600" /> AI Recommendations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec, i) => (
              <motion.div key={rec.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-50 ${rec.color}`}><rec.icon className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{rec.label}</h3>
                        <p className="text-xs text-gray-500 mt-1">{rec.desc}</p>
                        <Button size="sm" variant="ghost" className="text-green-600 text-xs p-0 h-auto mt-2 hover:bg-transparent" onClick={rec.action}>Take Action <ArrowRight className="h-3 w-3 ml-1" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
