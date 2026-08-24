'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, MapPin, IndianRupee, Calendar, CreditCard, Truck, Star,
  MessageSquare, RotateCcw, Loader2, Package, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore, type Order } from '@/lib/store';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

function statusBadge(s: string) {
  switch (s) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'negotiating': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'confirmed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'preparing': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'picked_up': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'in_transit': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function paymentBadge(s: string) {
  switch (s) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'failed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

interface OrderDetailsProps {
  orderId?: string;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const { viewParams, user, navigate, showToast } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const targetOrderId = orderId || viewParams.orderId;

  useEffect(() => {
    if (!targetOrderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${targetOrderId}`);
        const data = await res.json();
        if (data && data.id) setOrder(data);
      } catch (e) {
        console.error('Order fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [targetOrderId]);

  const handlePay = () => {
    if (order) navigate('buyer-orders', { orderId: order.id, showPayment: true });
  };

  if (loading) {
    return <div className="space-y-4 max-w-3xl mx-auto"><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600">Order not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" className="text-gray-500 -ml-2" onClick={() => navigate(user?.role === 'farmer' ? 'farmer-orders' : 'buyer-orders')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Order Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-3xl">
                  {CROP_EMOJIS[order.listing?.crop || ''] || '📦'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{order.listing?.crop || 'Order'}</h2>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={`text-xs border ${statusBadge(order.status)}`}>{order.status}</Badge>
                <Badge variant="outline" className={`text-xs ml-1 ${paymentBadge(order.paymentStatus)}`}>{order.paymentStatus}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Crop</span><span className="font-medium">{order.listing?.crop || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-medium">{order.quantity} kg</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Agreed Price</span><span className="font-medium">₹{order.agreedPrice}/kg</span></div>
              <Separator />
              <div className="flex justify-between text-base"><span className="text-gray-700 font-medium">Total</span><span className="font-bold text-green-700">₹{order.totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-medium capitalize">{order.deliveryMethod || 'Standard'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ordered</span><span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span></div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parties Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Parties</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Farmer */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
                  {order.farmer?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'F'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{order.farmer?.name || 'Farmer'}</p>
                  <p className="text-xs text-gray-500">Farmer</p>
                </div>
                {order.farmer?.reliabilityScore && (
                  <span className="text-xs text-green-600 flex items-center gap-0.5"><Star className="h-3 w-3 fill-green-600" />{order.farmer.reliabilityScore}%</span>
                )}
              </div>
              {/* Buyer */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  {order.buyer?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'B'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{order.buyer?.name || 'Buyer'}</p>
                  <p className="text-xs text-gray-500">Buyer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Info */}
      {order.payment && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5 text-green-600" /> Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">₹{order.payment.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{order.payment.paymentMethod || 'UPI'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant="outline" className={`text-xs ${paymentBadge(order.payment.paymentStatus)}`}>{order.payment.paymentStatus}</Badge></div>
              {order.payment.transactionRef && (
                <div className="flex justify-between"><span className="text-gray-500">Transaction Ref</span><span className="font-medium text-xs font-mono">{order.payment.transactionRef}</span></div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Delivery Tracking */}
      {order.delivery && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5 text-green-600" /> Delivery</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Partner</span><span className="font-medium">{order.delivery.partner}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant="outline" className={`text-xs border ${statusBadge(order.delivery.status)}`}>{order.delivery.status}</Badge></div>
              {order.delivery.currentLocation && (
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{order.delivery.currentLocation}</span></div>
              )}
              {order.delivery.estimatedArrival && (
                <div className="flex justify-between"><span className="text-gray-500">Est. Arrival</span><span className="font-medium">{new Date(order.delivery.estimatedArrival).toLocaleString()}</span></div>
              )}
              {(order.status === 'in_transit' || order.status === 'picked_up') && (
                <Button variant="outline" className="w-full mt-2" onClick={() => navigate('buyer-delivery', { orderId: order.id })}>
                  <Truck className="h-4 w-4 mr-2" /> Track Delivery
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Feedback */}
      {order.feedback && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Feedback</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < order.feedback!.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
                <span className="text-sm font-medium text-gray-700 ml-1">{order.feedback.rating}/5</span>
              </div>
              {order.feedback.comment && <p className="text-sm text-gray-600">{order.feedback.comment}</p>}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {user?.role === 'buyer' && order.paymentStatus === 'pending' && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={handlePay} disabled={paying}>
                  {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Pay ₹{order.totalAmount.toLocaleString()}
                </Button>
              )}
              {user?.role === 'buyer' && (order.status === 'delivered' || order.status === 'completed') && !order.feedback && (
                <Button variant="outline" onClick={() => navigate('buyer-feedback')}>
                  <Star className="h-4 w-4 mr-2" /> Submit Feedback
                </Button>
              )}
              {user?.role === 'buyer' && (order.status === 'delivered' || order.status === 'completed') && (
                <Button variant="outline" onClick={() => navigate('buyer-refund')}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Request Refund
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('buyer-messages', { userId: user?.role === 'buyer' ? order.farmerId : order.buyerId })}>
                <MessageSquare className="h-4 w-4 mr-2" /> Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
