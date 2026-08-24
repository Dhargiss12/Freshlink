'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package, IndianRupee, Eye, Clock, Filter, TrendingUp, CheckCircle2, Truck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type Order } from '@/lib/store';

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  preparing: { label: 'Preparing', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  in_transit: { label: 'In Transit', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Payment Pending', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  completed: { label: 'Paid', className: 'bg-green-50 text-green-700 border border-green-200' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border border-red-200' },
  refunded: { label: 'Refunded', className: 'bg-gray-50 text-gray-600 border border-gray-200' },
};

export default function MyOrders() {
  const { user, navigate, showToast } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?farmerId=${user.id}`);
        const data = await res.json();
        setOrders(Array.isArray(data.orders || data) ? (data.orders || data) : []);
      } catch {
        showToast('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, showToast]);

  const filterOrders = (tab: string) => {
    if (tab === 'all') return orders;
    if (tab === 'incoming') return orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');
    if (tab === 'active') return orders.filter((o) => ['confirmed', 'preparing', 'in_transit'].includes(o.status));
    if (tab === 'completed') return orders.filter((o) => o.status === 'completed' || o.status === 'delivered');
    return orders;
  };

  const filtered = filterOrders(activeTab);
  const totalRevenue = orders.filter((o) => o.paymentStatus === 'completed').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingRevenue = orders.filter((o) => o.paymentStatus === 'pending' && o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0);

  const renderOrderCard = (order: Order, i: number) => {
    const sc = orderStatusConfig[order.status] || orderStatusConfig.pending;
    const pc = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending;
    return (
      <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('farmer-orders', { orderId: order.id })}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{order.listing?.crop || 'Unknown Crop'}</h3>
                  <p className="text-xs text-gray-400">Order #{order.id.slice(-6).toUpperCase()} · {order.buyer?.name || 'Buyer'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{order.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{order.quantity} kg × ₹{order.agreedPrice}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={sc.className} variant="secondary">{sc.label}</Badge>
                  <Badge className={pc.className} variant="outline">{pc.label}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage all your farm orders</p>
      </motion.div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-xl"><IndianRupee className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Pending Payment</p>
              <p className="text-xl font-bold text-gray-900">₹{pendingRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><Truck className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="incoming" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Incoming</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Active</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Completed</TabsTrigger>
        </TabsList>

        {['all', 'incoming', 'active', 'completed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : filterOrders(tab).length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">{filterOrders(tab).map((o, i) => renderOrderCard(o, i))}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
