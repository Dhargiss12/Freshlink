'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Truck, Package, CheckCircle, Clock, MapPin,
  User, Phone, IndianRupee, Loader2, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Order, type Delivery } from '@/lib/store';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Farmer Preparing', icon: Package },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'in_transit', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

interface StatusUpdate {
  status: string;
  timestamp: string;
  note?: string;
}

export default function DeliveryTracking() {
  const { viewParams, navigate } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!viewParams.orderId) return;
      setLoading(true);
      try {
        const [delRes, ordRes] = await Promise.all([
          fetch(`/api/delivery?orderId=${viewParams.orderId}`),
          fetch(`/api/orders/${viewParams.orderId}`),
        ]);
        const delData = await delRes.json();
        const ordData = await ordRes.json();
        if (ordData && ordData.id) setOrder(ordData);
        if (delData && delData.id) setDelivery(delData);
        else if (ordData && ordData.delivery) setDelivery(ordData.delivery);
      } catch (e) {
        console.error('Delivery fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDelivery();
  }, [viewParams.orderId]);

  const currentStepIdx = delivery
    ? STEPS.findIndex(s => s.key === delivery.status)
    : -1;

  const statusUpdates: StatusUpdate[] = [];
  if (order) {
    statusUpdates.push({ status: 'confirmed', timestamp: order.createdAt, note: 'Order placed successfully' });
    if (order.status === 'preparing' || STEPS.findIndex(s => s.key === (delivery?.status || order.status)) >= 1)
      statusUpdates.push({ status: 'preparing', timestamp: new Date(new Date(order.createdAt).getTime() + 3600000).toISOString(), note: 'Farmer is preparing your order' });
    if (delivery) {
      if (delivery.status === 'picked_up' || STEPS.findIndex(s => s.key === delivery.status) >= 2)
        statusUpdates.push({ status: 'picked_up', timestamp: new Date(new Date(order.createdAt).getTime() + 7200000).toISOString(), note: 'Package picked up by delivery partner' });
      if (delivery.status === 'in_transit' || delivery.status === 'delivered')
        statusUpdates.push({ status: 'in_transit', timestamp: new Date(new Date(order.createdAt).getTime() + 10800000).toISOString(), note: 'Package is on the way' });
      if (delivery.status === 'delivered')
        statusUpdates.push({ status: 'delivered', timestamp: new Date().toISOString(), note: 'Package delivered successfully!' });
    }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600">Order not found</h3>
        <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => navigate('buyer-orders')}>View Orders</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" className="text-gray-500 -ml-2" onClick={() => navigate('buyer-orders')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Button>

      {/* Order Summary */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">{CROP_EMOJIS[order.listing?.crop || ''] || '📦'}</div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{order.listing?.crop || 'Order'} #{order.id.slice(-6).toUpperCase()}</h2>
                <p className="text-sm text-gray-500">{order.quantity} kg × ₹{order.agreedPrice}/kg = <span className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</span></p>
              </div>
              <Badge variant="outline" className="text-xs border-green-200 text-green-600 bg-green-50">{order.status}</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Stepper */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-lg">Delivery Progress</CardTitle></CardHeader>
          <CardContent className="pb-6">
            <div className="flex items-start justify-between relative">
              {/* Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0" />
              {currentStepIdx >= 0 && (
                <motion.div className="absolute top-5 left-5 h-0.5 bg-green-500 z-0"
                  initial={{ width: 0 }} animate={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
              )}

              {STEPS.map((step, i) => {
                const isActive = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={`text-[10px] mt-2 text-center leading-tight ${isActive ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delivery Info & Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Partner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2"><CardTitle className="text-base">Delivery Partner</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{delivery?.partner || 'FreshLink Express'}</p>
                  <p className="text-xs text-gray-500">Verified Delivery Partner</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Est. Arrival</span>
                  <span className="font-medium text-gray-900">{delivery?.estimatedArrival ? new Date(delivery.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Calculating...'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Location</span>
                  <span className="font-medium text-gray-900">{delivery?.currentLocation || 'Pune - Shivajinagar'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Map Placeholder */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-sm h-full overflow-hidden">
            <div className="h-full min-h-[200px] bg-gradient-to-br from-green-400 via-emerald-400 to-green-600 flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'2\' fill=\'white\'/%3E%3C/svg%3E")' }} />
              <MapPin className="h-12 w-12 text-white/80 mb-2 animate-bounce" />
              <p className="text-white/90 font-medium text-sm">{delivery?.currentLocation || 'Pune - Shivajinagar'}</p>
              <p className="text-white/60 text-xs mt-1">Live map view coming soon</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Status Updates Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Status Updates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {statusUpdates.map((update, i) => {
                const stepInfo = STEPS.find(s => s.key === update.status);
                const Icon = stepInfo?.icon || Package;
                return (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-green-600" />
                      </div>
                      {i < statusUpdates.length - 1 && <div className="w-0.5 flex-1 bg-green-100 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-900">{stepInfo?.label || update.status}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{update.note}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(update.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
