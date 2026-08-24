'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Eye,
  Edit3,
  Tag,
  Sprout,
  AlertTriangle,
  Clock,
  IndianRupee,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Listing } from '@/lib/store';

const CROPS = [
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Spinach', emoji: '🥬' },
  { name: 'Carrot', emoji: '🥕' },
  { name: 'Cabbage', emoji: '🥬' },
  { name: 'Cauliflower', emoji: '🥦' },
  { name: 'Brinjal', emoji: '🍆' },
  { name: 'Capsicum', emoji: '🫑' },
  { name: 'Okra', emoji: '🥒' },
];

function getCropEmoji(name: string): string {
  return CROPS.find((c) => c.name.toLowerCase() === name.toLowerCase())?.emoji || '🌿';
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
  active: { label: 'Active', variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  sold: { label: 'Sold', variant: 'default', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  expired: { label: 'Expired', variant: 'secondary', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
};

const spoilageConfig: Record<string, { label: string; className: string; barColor: string }> = {
  low: { label: 'Low', className: 'text-green-700 bg-green-50 border-green-200', barColor: 'bg-green-500' },
  medium: { label: 'Medium', className: 'text-yellow-700 bg-yellow-50 border-yellow-200', barColor: 'bg-yellow-500' },
  high: { label: 'High', className: 'text-orange-700 bg-orange-50 border-orange-200', barColor: 'bg-orange-500' },
  critical: { label: 'Critical', className: 'text-red-700 bg-red-50 border-red-200', barColor: 'bg-red-500' },
};

export default function MyCrops() {
  const { user, navigate, showToast, setSelectedListing } = useAppStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ farmerId: user.id });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetch(`/api/listings?${params.toString()}`);
        const data = await res.json();
        const arr = data.listings || data;
        setListings(Array.isArray(arr) ? arr : []);
      } catch (e) {
        console.error(e);
        showToast('Failed to load crops', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [user, statusFilter, showToast]);

  const handleView = (listing: Listing) => {
    setSelectedListing(listing);
    navigate('farmer-selling', { listingId: listing.id });
  };

  const filteredListings = listings;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Crops</h1>
          <p className="text-gray-500 mt-1">Manage your produce listings and track their status</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-2 self-start" onClick={() => navigate('farmer-create-listing')}>
          <Plus className="h-4 w-4" /> Create New Listing
        </Button>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {['all', 'active', 'sold', 'expired'].map((s) => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
            className={statusFilter === s ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <Badge variant="secondary" className="ml-1.5 text-xs bg-white/20 text-inherit">
                {s === 'all' ? listings.length : listings.filter((l) => l.status === s).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5 space-y-3">
              <Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Sprout className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No crops found</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">Start by creating your first listing</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate('farmer-create-listing')}>
              <Plus className="h-4 w-4 mr-2" /> Create Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredListings.map((listing) => {
              const sc = statusConfig[listing.status] || statusConfig.active;
              const spoilage = listing.spoilageRisk || 'low';
              const sp = spoilageConfig[spoilage] || spoilageConfig.low;
              const emoji = getCropEmoji(listing.crop);
              const hoursSinceHarvest = Math.max(0, (Date.now() - new Date(listing.harvestDate).getTime()) / 3600000);
              const spoilagePercent = Math.min(100, (hoursSinceHarvest / (listing.shelfLife || 168)) * 100);

              return (
                <motion.div key={listing.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{emoji}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{listing.crop}</h3>
                            <p className="text-xs text-gray-400">{listing.location}</p>
                          </div>
                        </div>
                        <Badge className={sc.className} variant={sc.variant}>{sc.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Sprout className="h-3.5 w-3.5 text-green-500" />
                          <span>{listing.quantity} {listing.unit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <IndianRupee className="h-3.5 w-3.5 text-green-500" />
                          <span>₹{listing.expectedPrice}/{listing.unit === 'kg' ? 'kg' : 'unit'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{new Date(listing.harvestDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <AlertTriangle className={`h-3.5 w-3.5 ${spoilage === 'critical' ? 'text-red-500' : spoilage === 'high' ? 'text-orange-500' : 'text-gray-400'}`} />
                          <span className={sp.className.split(' ')[0]}>{sp.label} Risk</span>
                        </div>
                      </div>

                      {/* Spoilage Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Freshness</span>
                          <span>{Math.max(0, 100 - spoilagePercent).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${spoilagePercent > 80 ? 'bg-red-500' : spoilagePercent > 50 ? 'bg-orange-500' : spoilagePercent > 25 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${100 - spoilagePercent}%` }} />
                        </div>
                      </div>

                      {listing.qualityScore && (
                        <div className="text-xs text-gray-500 mb-3">Quality Score: <span className="font-semibold text-green-700">{listing.qualityScore}/100</span></div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-700" onClick={() => handleView(listing)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-700" onClick={() => showToast('Edit status coming soon', 'info')}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit Status
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-700" onClick={() => navigate('farmer-discounts')}>
                          <Tag className="h-3.5 w-3.5" /> Discount
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
