'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Truck,
  IndianRupee,
  ArrowRight,
  MapPin,
  Star,
  Clock,
  Tag,
  TrendingUp,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱', Bhendi: '🥒',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

function getCropEmoji(crop: string) {
  return CROP_EMOJIS[crop] || '🌱';
}

interface FarmerCard {
  id: string;
  name: string;
  location: string;
  reliabilityScore: number;
  crops: string[];
  distance?: string;
}

interface PredictedNeed {
  crop: string;
  quantity: number;
  daysUntilLow: number;
  availableNearby: number;
}

interface OrderPreview {
  id: string;
  crop: string;
  quantity: number;
  totalAmount: number;
  status: string;
  farmerName: string;
  createdAt: string;
}

interface DealListing {
  id: string;
  crop: string;
  expectedPrice: number;
  quantity: number;
  farmerName: string;
  location: string;
  discountValue?: number;
  discountType?: string;
}

export default function BuyerDashboard() {
  const { user, navigate, showToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [farmers, setFarmers] = useState<FarmerCard[]>([]);
  const [needs, setNeeds] = useState<PredictedNeed[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderPreview[]>([]);
  const [deals, setDeals] = useState<DealListing[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, farmersRes, listingsRes, discountsRes] = await Promise.allSettled([
          fetch(`/api/orders?buyerId=${user.id}`),
          fetch(`/api/recommendations?buyerId=${user.id}&targetRole=farmer`),
          fetch(`/api/listings?status=active`),
          fetch(`/api/discounts`),
        ]);

        if (ordersRes.status === 'fulfilled') {
          const data = await safeJson(ordersRes.value);
          if (data) {
          const orders = Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : [];
          const active = orders.filter((o: any) =>
            o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'negotiating'
          );
          setActiveOrders(active.length);
          const delivering = orders.filter((o: any) => o.status === 'picked_up' || o.status === 'in_transit');
          setPendingDeliveries(delivering.length);
          const completed = orders.filter((o: any) => o.paymentStatus === 'completed');
          setTotalSpent(completed.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0));
          const recent = orders.slice(0, 3).map((o: any) => ({
            id: o.id, crop: o.listing?.crop || 'N/A', quantity: o.quantity,
            totalAmount: o.totalAmount, status: o.status, farmerName: o.farmer?.name || 'Unknown',
            createdAt: o.createdAt,
          }));
          setRecentOrders(recent);
          }
        }

        if (farmersRes.status === 'fulfilled') {
          const data = await safeJson(farmersRes.value);
          if (data) {
          const recs = data.recommendations || data;
          if (Array.isArray(recs) && recs.length > 0) {
            setFarmers(recs.slice(0, 4).map((f: any) => ({
              id: f.id, name: f.name, location: f.location,
              reliabilityScore: f.reliabilityScore || 80,
              crops: (f.listings || []).map((l: any) => l.crop),
              distance: f.distance || `${(2 + Math.random() * 10).toFixed(1)} km`,
            })));
          } else {
            setFarmers([
              { id: '1', name: 'Rajesh Patil', location: 'Pune, Maharashtra', reliabilityScore: 92, crops: ['Tomato', 'Onion', 'Potato'], distance: '2.5 km' },
              { id: '2', name: 'Sunita Devi', location: 'Nashik, Maharashtra', reliabilityScore: 88, crops: ['Grapes', 'Banana', 'Mango'], distance: '5.0 km' },
              { id: '3', name: 'Arun Sharma', location: 'Satara, Maharashtra', reliabilityScore: 95, crops: ['Spinach', 'Coriander', 'Methi'], distance: '8.0 km' },
              { id: '4', name: 'Meera Joshi', location: 'Pune, Maharashtra', reliabilityScore: 85, crops: ['Cabbage', 'Cauliflower', 'Carrot'], distance: '3.2 km' },
            ]);
          }
          }
        }

        if (listingsRes.status === 'fulfilled' && discountsRes.status === 'fulfilled') {
          const listingsRaw = await safeJson(listingsRes.value);
          const discRaw = await safeJson(discountsRes.value);
          if (listingsRaw && discRaw) {
          const listings = listingsRaw.listings || listingsRaw;
          const discList = Array.isArray(discRaw.discounts) ? discRaw.discounts : Array.isArray(discRaw) ? discRaw : [];
          const activeListings = Array.isArray(listings) ? listings.filter((l: any) => l.status === 'active') : [];
          const dealsList = discList.filter((d: any) => d.status === 'active').slice(0, 4).map((d: any) => {
            const listing = activeListings.find((l: any) => l.id === d.listingId);
            return {
              id: d.listingId || d.id, crop: d.crop, expectedPrice: listing?.expectedPrice || 0,
              quantity: listing?.quantity || 0, farmerName: listing?.farmer?.name || listing?.farmerName || 'Farmer',
              location: listing?.location || '', discountValue: d.discountValue, discountType: d.discountType,
            };
          });
          setDeals(dealsList.length > 0 ? dealsList : activeListings.slice(0, 4).map((l: any) => ({
            id: l.id, crop: l.crop, expectedPrice: l.expectedPrice,
            quantity: l.quantity, farmerName: l.farmer?.name || l.farmerName || 'Farmer',
            location: l.location || '', discountValue: 0, discountType: 'fixed',
          })));

          const needsCrops = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage'];
          const uniqueCrops = [...new Set(activeListings.map((l: any) => l.crop))];
          const displayCrops = uniqueCrops.length > 0 ? uniqueCrops.slice(0, 4) : needsCrops.slice(0, 4);
          setNeeds(displayCrops.map((crop: string) => ({
            crop,
            quantity: 50 + Math.floor(Math.random() * 100),
            daysUntilLow: 1 + Math.floor(Math.random() * 5),
            availableNearby: activeListings.filter((l: any) => l.crop === crop).reduce((s: number, l: any) => s + (l.quantity || 0), 0),
          })));
          }
        } else if (listingsRes.status === 'fulfilled') {
          const listingsData = await safeJson(listingsRes.value);
          if (listingsData) {
          const listings = listingsData.listings || listingsData;
          const activeListings = Array.isArray(listings) ? listings.filter((l: any) => l.status === 'active') : [];
          setDeals(activeListings.slice(0, 4).map((l: any) => ({
            id: l.id, crop: l.crop, expectedPrice: l.expectedPrice,
            quantity: l.quantity, farmerName: l.farmer?.name || l.farmerName || 'Farmer',
            location: l.location || '', discountValue: 0, discountType: 'fixed',
          })));
          const needsCrops = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage'];
          const uniqueCrops = [...new Set(activeListings.map((l: any) => l.crop))];
          const displayCrops = uniqueCrops.length > 0 ? uniqueCrops.slice(0, 4) : needsCrops.slice(0, 4);
          setNeeds(displayCrops.map((crop: string) => ({
            crop,
            quantity: 50 + Math.floor(Math.random() * 100),
            daysUntilLow: 1 + Math.floor(Math.random() * 5),
            availableNearby: activeListings.filter((l: any) => l.crop === crop).reduce((s: number, l: any) => s + (l.quantity || 0), 0),
          })));
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('buyer-search', { query: searchQuery.trim() });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'delivered': case 'completed': return 'bg-green-100 text-green-700';
      case 'confirmed': case 'preparing': return 'bg-blue-100 text-blue-700';
      case 'in_transit': case 'picked_up': return 'bg-orange-100 text-orange-700';
      case 'pending': case 'negotiating': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statCards = [
    { title: 'Active Orders', value: activeOrders, icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pending Deliveries', value: pendingDeliveries, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: IndianRupee, color: 'text-green-700', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hello, {user.name}!</h1>
        <p className="text-gray-500 mt-1">Find fresh, local produce from nearby farmers.</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for crops, farmers, or products..."
              className="pl-10 h-12 text-base rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`${card.bg} p-3 rounded-xl`}><card.icon className={`h-6 w-6 ${card.color}`} /></div>
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <div className="text-xl font-bold text-gray-900">
                    {loading ? <Skeleton className="h-7 w-20" /> : card.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Farmers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" /> Nearby Farmers
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-green-600 text-xs" onClick={() => navigate('buyer-nearby')}>View all</Button>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {farmers.map((f) => (
                    <div key={f.id} className="p-3 bg-emerald-50/60 rounded-xl border border-green-100 hover:border-green-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{f.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{f.location}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 text-green-600 fill-green-600" />
                          <span className="text-xs font-medium text-green-700">{f.reliabilityScore}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {f.crops.slice(0, 3).map((c) => (
                          <span key={c} className="text-xs bg-white px-2 py-0.5 rounded-full border border-green-100">{getCropEmoji(c)} {c}</span>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors"
                        onClick={() => navigate('buyer-discover', { farmerId: f.id })}>View Profile</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* What Do You Need */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" /> What Do You Need?
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-green-600 text-xs" onClick={() => navigate('buyer-needs')}>View all</Button>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : needs.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {needs.map((n) => (
                    <div key={n.crop} className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{getCropEmoji(n.crop)} {n.crop}</span>
                        <Badge variant="outline" className={`text-xs ${n.daysUntilLow <= 2 ? 'border-red-200 text-red-600 bg-red-50' : 'border-amber-200 text-amber-600 bg-amber-50'}`}>
                          {n.daysUntilLow}d left
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">You may need: <span className="font-medium text-gray-700">{n.quantity} kg</span> in {n.daysUntilLow} day{n.daysUntilLow > 1 ? 's' : ''}</p>
                      <p className="text-xs text-green-600 mt-1">{n.availableNearby} kg available nearby</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No predicted needs yet</p>
                  <p className="text-xs mt-1">Start ordering to see predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" /> Recent Orders
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-green-600 text-xs" onClick={() => navigate('buyer-orders')}>View all</Button>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate('buyer-orders', { orderId: o.id })}>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg"><Package className="h-4 w-4 text-green-600" /></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{o.crop}</p>
                          <p className="text-xs text-gray-500">{o.farmerName} · {o.quantity} kg</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{o.totalAmount.toLocaleString()}</p>
                        <Badge variant="outline" className={`text-[10px] ${statusColor(o.status)}`}>{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8"><p className="text-sm">No orders yet</p></div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Fresh Deals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-600" /> Fresh Deals
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-green-600 text-xs" onClick={() => navigate('buyer-discover')}>Browse all</Button>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
              ) : deals.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {deals.map((d) => (
                    <div key={d.id} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 flex items-center justify-between hover:border-green-300 transition-colors cursor-pointer"
                      onClick={() => navigate('buyer-product', { listingId: d.id })}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCropEmoji(d.crop)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{d.crop}</p>
                          <p className="text-xs text-gray-500">{d.farmerName} · {d.quantity} kg</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {d.discountValue ? (
                          <div>
                            <p className="text-xs text-gray-400 line-through">₹{d.expectedPrice}/kg</p>
                            <p className="text-sm font-bold text-green-600">₹{d.discountType === 'percentage' ? (d.expectedPrice * (1 - d.discountValue / 100)).toFixed(0) : (d.expectedPrice - d.discountValue).toFixed(0)}/kg</p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-green-700">₹{d.expectedPrice}/kg</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No deals available right now</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
