'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Gavel,
  User,
  Sprout,
  Package,
  SearchX,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

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

interface FarmerResult { id: string; name: string; location: string; reliabilityScore: number; role: string; }
interface ProductResult {
  id: string; crop: string; expectedPrice: number; quantity: number; unit: string;
  farmerId: string; farmerName: string; location: string; harvestDate: string;
  shelfLife: number; qualityScore: number; status: string; farmerReliability: number;
}
interface CropResult { crop: string; count: number; avgPrice: number; }

export default function SearchResults() {
  const { viewParams, navigate } = useAppStore();
  const [query, setQuery] = useState(viewParams.query || '');
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<FarmerResult[]>([]);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [crops, setCrops] = useState<CropResult[]>([]);
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'farmers' | 'products' | 'crops'>('all');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setFarmers([]); setProducts([]); setCrops([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && typeof data === 'object') {
        const results = data.results || data;
        setFarmers(Array.isArray(results.farmers) ? results.farmers : []);
        const rawProducts = Array.isArray(results.listings) ? results.listings : [];
        setProducts(rawProducts.map((p: any) => ({
          ...p,
          farmerName: p.farmer?.name || p.farmerName || 'Farmer',
          farmerReliability: p.farmer?.reliabilityScore || p.farmerReliability || 0,
        })));
        setCrops(Array.isArray(results.crops) ? results.crops : []);
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    if (viewParams.query) fetchSearch(viewParams.query);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSearch(val), 500);
  };

  const filteredProducts = category === 'All'
    ? products
    : products.filter((p) => (CROP_CATEGORY[p.crop] || 'Vegetables') === category);

  const totalResults = farmers.length + filteredProducts.length + crops.length;

  const getFreshness = (harvestDate: string, shelfLife: number) => {
    const hoursSinceHarvest = (Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60);
    const remaining = shelfLife - hoursSinceHarvest;
    if (remaining <= 0) return { label: 'Expired', color: 'text-red-600 bg-red-50' };
    if (remaining < shelfLife * 0.2) return { label: `${Math.ceil(remaining)}h left`, color: 'text-orange-600 bg-orange-50' };
    if (remaining < shelfLife * 0.5) return { label: `${Math.floor(remaining / 24)}d left`, color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'Fresh', color: 'text-green-600 bg-green-50' };
  };

  const tabCount = (tab: string) => {
    switch (tab) {
      case 'farmers': return farmers.length;
      case 'products': return filteredProducts.length;
      case 'crops': return crops.length;
      default: return totalResults;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('buyer-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              placeholder="Search for crops, farmers, products..."
              className="pl-10 h-12 text-base rounded-xl border-green-200 focus:border-green-500 focus:ring-green-500/20"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
            {query && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => { setQuery(''); fetchSearch(''); }}>
                <span className="text-gray-400">✕</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      {query.trim() && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {CATEGORIES.map((cat) => (
            <Button key={cat} variant={category === cat ? 'default' : 'outline'} size="sm"
              className={`text-xs h-8 ${category === cat ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-300'}`}
              onClick={() => setCategory(cat)}>
              {cat}
            </Button>
          ))}
        </motion.div>
      )}

      {/* Tabs */}
      {query.trim() && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'farmers', 'products', 'crops'] as const).map((tab) => (
            <Button key={tab} variant="ghost" size="sm"
              className={`flex-1 text-xs h-8 rounded-md capitalize ${activeTab === tab ? 'bg-white shadow-sm text-green-700 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab)}>
              {tab} {tabCount(tab) > 0 && <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 min-w-[18px]">{tabCount(tab)}</Badge>}
            </Button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      )}

      {/* Empty States */}
      {!loading && !query.trim() && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Search className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Search for fresh produce</h3>
          <p className="text-sm text-gray-400 mt-1">Type to find farmers, crops, and products near you</p>
        </motion.div>
      )}

      {!loading && query.trim() && totalResults === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
          <SearchX className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No results found</h3>
          <p className="text-sm text-gray-400 mt-1">Try a different search term or browse categories</p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {!loading && query.trim() && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Farmers */}
            {(activeTab === 'all' || activeTab === 'farmers') && farmers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Farmers ({farmers.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {farmers.map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                              {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{f.name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{f.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-green-600 fill-green-600" /><span className="font-medium">{f.reliabilityScore || 85}</span></div>
                            <Button size="sm" variant="outline" className="text-xs h-8 hover:bg-green-600 hover:text-white hover:border-green-600"
                              onClick={() => navigate('buyer-discover', { farmerId: f.id })}>View</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {(activeTab === 'all' || activeTab === 'products') && filteredProducts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Products ({filteredProducts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map((p, i) => {
                    const freshness = getFreshness(p.harvestDate, p.shelfLife);
                    return (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{CROP_EMOJIS[p.crop] || '🌱'}</span>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{p.crop}</p>
                                  <p className="text-xs text-gray-500">{p.farmerName}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-[10px] ${freshness.color}`}>{freshness.label}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                              <span className="font-bold text-green-700">₹{p.expectedPrice}/kg</span>
                              <span className="text-gray-500 text-xs">{p.quantity} {p.unit} available</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => navigate('buyer-negotiation', { listingId: p.id })}>
                                <Gavel className="h-3 w-3 mr-1" /> Make Offer
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-xs"
                                onClick={() => navigate('buyer-product', { listingId: p.id })}>Details</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Crops */}
            {(activeTab === 'all' || activeTab === 'crops') && crops.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sprout className="h-4 w-4" /> Crops ({crops.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {crops.map((c, i) => (
                    <motion.div key={c.crop} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => { setQuery(c.crop); handleQueryChange(c.crop); }}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <span className="text-2xl">{CROP_EMOJIS[c.crop] || '🌱'}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{c.crop}</p>
                            <p className="text-xs text-gray-500">{c.count} listing{c.count !== 1 ? 's' : ''} · Avg ₹{c.avgPrice}/kg</p>
                          </div>
                          <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
