'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown, Clock, MapPin, Star, Gavel, Eye, AlertTriangle,
  IndianRupee, Package, Navigation, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Listing } from '@/lib/store';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱', Bhendi: '🥒',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Greens'];
const CROP_CATEGORY: Record<string, string> = {
  Tomato: 'Vegetables', Onion: 'Vegetables', Carrot: 'Vegetables', Potato: 'Vegetables',
  Cabbage: 'Vegetables', Cauliflower: 'Vegetables', BellPepper: 'Vegetables', Eggplant: 'Vegetables',
  Cucumber: 'Vegetables', GreenChilli: 'Vegetables', Bhendi: 'Vegetables',
  Spinach: 'Greens', Coriander: 'Greens', Methi: 'Greens',
  Apple: 'Fruits', Banana: 'Fruits', Mango: 'Fruits', Orange: 'Fruits', Grapes: 'Fruits',
};

const SORT_OPTIONS = [
  { value: 'freshness', label: 'Freshness', icon: Clock },
  { value: 'price_asc', label: 'Price: Low', icon: ArrowUpDown },
  { value: 'price_desc', label: 'Price: High', icon: ArrowUpDown },
  { value: 'distance', label: 'Distance', icon: Navigation },
];

const DEMO_DISTANCES = ['2.5 km', '5.0 km', '8.0 km', '3.2 km', '12.0 km', '4.5 km', '7.0 km', '1.8 km'];

function getFreshnessInfo(harvestDate: string, shelfLife: number) {
  const hoursSince = (Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60);
  const remaining = shelfLife - hoursSince;
  const pct = Math.max(0, (remaining / shelfLife) * 100);
  if (remaining <= 0) return { label: 'Expired', color: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-50 text-red-600', hours: 0 };
  if (pct < 20) return { label: `${Math.ceil(remaining)}h left`, color: 'bg-orange-500', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-600', hours: remaining };
  if (pct < 50) return { label: `${Math.floor(remaining / 24)}d ${Math.floor((remaining % 24))}h`, color: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-50 text-yellow-600', hours: remaining };
  return { label: 'Fresh', color: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-50 text-green-600', hours: remaining };
}

function getSpoilageRisk(harvestDate: string, shelfLife: number) {
  const used = (Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60);
  const pct = used / shelfLife;
  if (pct >= 0.8) return { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' };
  if (pct >= 0.6) return { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (pct >= 0.3) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' };
}

export default function ProductDiscovery() {
  const { viewParams, navigate } = useAppStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('freshness');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let url = '/api/listings?status=active';
        if (viewParams.farmerId) url += `&farmerId=${viewParams.farmerId}`;
        const res = await fetch(url);
        const data = await res.json();
        const arr = data.listings || data;
        const mapped = (Array.isArray(arr) ? arr : []).map((l: any) => ({
          ...l,
          farmerName: l.farmer?.name || l.farmerName,
          farmerReliability: l.farmer?.reliabilityScore || l.farmerReliability,
        }));
        setListings(mapped);
      } catch (e) {
        console.error('Listings fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [viewParams.farmerId]);

  const filtered = listings
    .filter((l) => category === 'All' || (CROP_CATEGORY[l.crop] || 'Vegetables') === category)
    .sort((a, b) => {
      if (sort === 'price_asc') return a.expectedPrice - b.expectedPrice;
      if (sort === 'price_desc') return b.expectedPrice - a.expectedPrice;
      if (sort === 'distance') {
        const da = DEMO_DISTANCES[parseInt(a.id.slice(-1), 16) % DEMO_DISTANCES.length];
        const db = DEMO_DISTANCES[parseInt(b.id.slice(-1), 16) % DEMO_DISTANCES.length];
        return parseFloat(da) - parseFloat(db);
      }
      // freshness: sort by hours since harvest ascending (fresher first)
      const ha = (Date.now() - new Date(a.harvestDate).getTime()) / (1000 * 60 * 60);
      const hb = (Date.now() - new Date(b.harvestDate).getTime()) / (1000 * 60 * 60);
      return ha - hb;
    });

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Nearby Available Produce</h1>
        <p className="text-gray-500 mt-1">Browse fresh produce from farmers near you</p>
      </motion.div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <Button key={cat} variant={category === cat ? 'default' : 'outline'} size="sm"
              className={`text-xs h-8 ${category === cat ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-300'}`}
              onClick={() => setCategory(cat)}>
              {cat}{cat !== 'All' && <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
                {listings.filter(l => (CROP_CATEGORY[l.crop] || 'Vegetables') === cat).length}
              </Badge>}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-green-400">
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No products found</h3>
          <p className="text-sm text-gray-400 mt-1">Try a different category or check back later</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing, i) => {
            const freshness = getFreshnessInfo(listing.harvestDate, listing.shelfLife);
            const spoilage = getSpoilageRisk(listing.harvestDate, listing.shelfLife);
            const distance = DEMO_DISTANCES[parseInt(listing.id.slice(-1), 16) % DEMO_DISTANCES.length];
            return (
              <motion.div key={listing.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{CROP_EMOJIS[listing.crop] || '🌱'}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{listing.crop}</h3>
                          <p className="text-xs text-gray-500">by {listing.farmerName || 'Farmer'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] border ${spoilage.color}`}>
                        {spoilage.label === 'Critical' || spoilage.label === 'High' ? <AlertTriangle className="h-3 w-3 mr-0.5" /> : null}
                        {spoilage.label}
                      </Badge>
                    </div>

                    {/* Price & Quantity */}
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold text-green-700">₹{listing.expectedPrice}<span className="text-sm font-normal text-gray-400">/kg</span></p>
                        <p className="text-xs text-gray-500">{listing.quantity} {listing.unit} available</p>
                      </div>
                      {listing.qualityScore && (
                        <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-green-600 fill-green-600" /><span className="font-medium">{listing.qualityScore}</span></div>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">Location</p>
                        <p className="text-gray-700 font-medium flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{listing.location || 'Local'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">Distance</p>
                        <p className="text-gray-700 font-medium flex items-center gap-1 mt-0.5"><Navigation className="h-3 w-3" />{distance}</p>
                      </div>
                      <div className={`rounded-lg p-2 ${freshness.badge}`}>
                        <p className={freshness.text}>Freshness</p>
                        <p className={`font-medium mt-0.5 ${freshness.text}`}>{freshness.label}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">Reliability</p>
                        <p className="text-gray-700 font-medium flex items-center gap-1 mt-0.5"><Star className="h-3 w-3 text-green-600 fill-green-600" />{listing.farmerReliability || 85}%</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                      <Button size="sm" className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => navigate('buyer-negotiation', { listingId: listing.id })}>
                        <Gavel className="h-3.5 w-3.5 mr-1" /> Make Offer
                      </Button>
                      <Button size="sm" variant="outline" className="h-9 text-xs hover:border-green-400"
                        onClick={() => navigate('buyer-product', { listingId: listing.id })}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Details
                      </Button>
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
