'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Star, Navigation, Eye, IndianRupee, Clock, Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱', Bhendi: '🥒',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

interface FarmerData {
  id: string;
  name: string;
  location: string;
  reliabilityScore: number;
  customerRating: number;
  crops: string[];
  priceRange: { min: number; max: number };
  distance: string;
  matchScore?: number;
}

const DEMO_FARMERS: FarmerData[] = [
  { id: 'f1', name: 'Rajesh Patil', location: 'Pune - Shivajinagar', reliabilityScore: 92, customerRating: 4.5, crops: ['Tomato', 'Onion', 'Potato'], priceRange: { min: 18, max: 35 }, distance: '2.5 km', matchScore: 95 },
  { id: 'f2', name: 'Sunita Devi', location: 'Pune - Kothrud', reliabilityScore: 88, customerRating: 4.3, crops: ['Grapes', 'Banana', 'Mango'], priceRange: { min: 30, max: 80 }, distance: '5.0 km', matchScore: 87 },
  { id: 'f3', name: 'Arun Sharma', location: 'Nashik Road', reliabilityScore: 95, customerRating: 4.8, crops: ['Spinach', 'Coriander', 'Methi'], priceRange: { min: 10, max: 25 }, distance: '8.0 km', matchScore: 82 },
  { id: 'f4', name: 'Meera Joshi', location: 'Pune - Hadapsar', reliabilityScore: 85, customerRating: 4.1, crops: ['Cabbage', 'Cauliflower', 'Carrot'], priceRange: { min: 15, max: 30 }, distance: '3.2 km', matchScore: 90 },
  { id: 'f5', name: 'Vikram Singh', location: 'Satara - Main Market', reliabilityScore: 91, customerRating: 4.6, crops: ['Tomato', 'GreenChilli', 'Eggplant'], priceRange: { min: 20, max: 45 }, distance: '12.0 km', matchScore: 75 },
  { id: 'f6', name: 'Priya Nair', location: 'Pune - Aundh', reliabilityScore: 89, customerRating: 4.4, crops: ['BellPepper', 'Cucumber', 'Cabbage'], priceRange: { min: 25, max: 55 }, distance: '4.5 km', matchScore: 88 },
];

function ReliabilityCircle({ score }: { score: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#16a34a' : score >= 75 ? '#eab308' : '#ef4444';
  return (
    <svg width={36} height={36} className="-rotate-90">
      <circle cx={18} cy={18} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={3} />
      <circle cx={18} cy={18} r={radius} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset} />
      <text x={18} y={18} textAnchor="middle" dominantBaseline="central" className="rotate-90 text-[8px] font-bold" fill={color} style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>
        {score}
      </text>
    </svg>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['bg-green-600', 'bg-emerald-600', 'bg-green-700', 'bg-teal-600', 'bg-green-500', 'bg-emerald-700'];

export default function NearbyFarmers() {
  const { user, navigate } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'reliability' | 'rating'>('distance');

  useEffect(() => {
    const fetchFarmers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recommendations?buyerId=${user?.id || 'demo'}&targetRole=farmer`);
        const data = await res.json();
        const recs = data.recommendations || data;
        if (Array.isArray(recs) && recs.length > 0) {
          setFarmers(recs.map((f: any, i: number) => ({
            id: f.id, name: f.name, location: f.location,
            reliabilityScore: f.reliabilityScore || 85, customerRating: f.customerRating || 4.2,
            crops: (f.listings || []).map((l: any) => l.crop),
            priceRange: f.priceRange || { min: 15, max: 40 },
            distance: f.distance || DEMO_FARMERS[i % DEMO_FARMERS.length].distance,
            matchScore: f.matchScore || 80,
          })));
        } else {
          setFarmers(DEMO_FARMERS);
        }
      } catch {
        setFarmers(DEMO_FARMERS);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmers();
  }, [user]);

  const sorted = [...farmers].sort((a, b) => {
    if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
    if (sortBy === 'reliability') return b.reliabilityScore - a.reliabilityScore;
    return b.customerRating - a.customerRating;
  });

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Nearby Farmers</h1>
        <p className="text-gray-500 mt-1 flex items-center gap-1"><Navigation className="h-4 w-4" />Discover farmers near your location</p>
      </motion.div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        {(['distance', 'reliability', 'rating'] as const).map((s) => (
          <Button key={s} variant={sortBy === s ? 'default' : 'outline'} size="sm"
            className={`text-xs h-8 capitalize ${sortBy === s ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={() => setSortBy(s)}>
            {s === 'rating' ? 'Customer Rating' : s === 'reliability' ? 'Reliability' : 'Distance'}
          </Button>
        ))}
      </div>

      {/* Farmer List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((farmer, i) => (
            <motion.div key={farmer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {getInitials(farmer.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{farmer.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{farmer.location}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ReliabilityCircle score={farmer.reliabilityScore} />
                        </div>
                      </div>

                      {/* Distance & Rating */}
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{farmer.distance}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{farmer.customerRating}</span>
                        {farmer.matchScore && <Badge variant="outline" className="text-[10px] border-green-200 text-green-600 bg-green-50">{farmer.matchScore}% match</Badge>}
                      </div>

                      {/* Crops */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {farmer.crops.map(crop => (
                          <span key={crop} className="text-xs bg-emerald-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                            {CROP_EMOJIS[crop] || '🌱'} {crop}
                          </span>
                        ))}
                      </div>

                      {/* Price Range */}
                      <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />{farmer.priceRange.min}–{farmer.priceRange.max}/kg
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => navigate('buyer-discover', { farmerId: farmer.id })}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> View Profile
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => navigate('buyer-messages', { userId: farmer.id })}>
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
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
