'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, IndianRupee, User, MapPin, Calendar,
  CreditCard, Truck, Eye, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Order } from '@/lib/store';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

const TABS = ['All', 'Current', 'Past'] as const;

type TabType = typeof TABS[number];

function statusBadge(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'negotiating': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'confirmed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'preparing': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'picked_up': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'in_transit': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function paymentBadge(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'failed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function BuyerOrders() {
  const { user, navigate, viewParams } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('All');

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?buyerId=${user.id}`);
        const data = await res.json();
        setOrders(Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Orders fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Auto-navigate to order details if orderId param
  useEffect(() => {
    if (viewParams.orderId && orders.length > 0) {
      // stay here, user can click on orders
    }
  }, [viewParams.orderId, orders]);

  const filtered = orders.filter(o => {
    if (tab === 'All') return true;
    if (tab === 'Current') return !['delivered', 'completed', 'cancelled'].includes(o.status);
    if (tab === 'Past') return ['delivered', 'completed', 'cancelled'].includes(o.status);
    return true;
  });

  const tabCounts = {
    All: orders.length,
    Current: orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status)).length,
    Past: orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status)).length,
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage your orders</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map(t => (
          <Button key={t} variant="ghost" size="sm"
            className={`flex-1 text-sm h-9 rounded-md ${tab === t ? 'bg-white shadow-sm text-green-700 font-medium' : 'text-gray-500'}`}
            onClick={() => setTab(t)}>
            {t} ({tabCounts[t]})
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No {tab === 'All' ? '' : tab.toLowerCase()} orders</h3>
          <p className="text-sm text-gray-400 mt-1">Start browsing products to place your first order</p>
          <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => navigate('buyer-discover')}>Browse Products</Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('buyer-orders', { orderId: order.id })}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl shrink-0">
                        {CROP_EMOJIS[order.listing?.crop || ''] || '📦'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{order.listing?.crop || 'Unknown'}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />{order.farmer?.name || 'Farmer'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span>{order.quantity} kg</span>
                          <span>× ₹{order.agreedPrice}/kg</span>
                          <span className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={`text-[10px] border ${statusBadge(order.status)}`}>{order.status}</Badge>
                      <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />{new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-[10px] ${paymentBadge(order.paymentStatus)}`}>
                        <CreditCard className="h-3 w-3 mr-1" />{order.paymentStatus}
                      </Badge>
                      {order.status === 'in_transit' || order.status === 'picked_up' ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); navigate('buyer-delivery', { orderId: order.id }); }}>
                          <Truck className="h-3 w-3 mr-1" /> Track
                        </Button>
                      ) : null}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600"
                      onClick={(e) => { e.stopPropagation(); navigate('buyer-orders', { orderId: order.id }); }}>
                      <Eye className="h-3 w-3 mr-1" /> Details
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
