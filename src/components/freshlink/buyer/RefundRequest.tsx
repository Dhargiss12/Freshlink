'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw, Upload, Camera, X, Package, AlertCircle, CheckCircle, Clock, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Order } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const REASONS = [
  { value: 'damaged', label: 'Product damaged', icon: '💥' },
  { value: 'spoiled', label: 'Product rotten/spoiled', icon: '🦠' },
  { value: 'wrong', label: 'Wrong product received', icon: '❌' },
  { value: 'quantity', label: 'Quantity mismatch', icon: '⚖️' },
  { value: 'quality', label: 'Serious quality issue', icon: '⚠️' },
];

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  under_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

interface RefundRequest {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  order?: Order;
}

export default function RefundRequest() {
  const { user, navigate, showToast } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, refundRes] = await Promise.all([
          fetch(`/api/orders?buyerId=${user.id}`),
          fetch(`/api/refunds?buyerId=${user.id}`),
        ]);
        const ordData = await safeJson(ordersRes);
        const refData = await safeJson(refundRes);
        if (!ordData && !refData) return;
        setOrders(Array.isArray(ordData) ? ordData.filter((o: any) => o.status === 'delivered' || o.status === 'completed') : []);
        setRefunds(Array.isArray(refData) ? refData : []);
      } catch (e) {
        console.error('Refund fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!selectedOrder || !reason) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder, reason, description, evidence: photos,
        }),
      });
      const data = await safeJson(res);
      if (data && data.id) {
        showToast('Refund request submitted successfully!', 'success');
        setSelectedOrder(''); setReason(''); setDescription(''); setPhotos([]);
        setRefunds(prev => [{ ...data, order: orders.find(o => o.id === selectedOrder) }, ...prev]);
      } else {
        showToast('Failed to submit refund request', 'error');
      }
    } catch {
      showToast('Error submitting refund', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'submitted': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'under_review': return <Clock className="h-3.5 w-3.5" />;
      case 'approved': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected': return <X className="h-3.5 w-3.5" />;
      case 'refunded': return <CheckCircle className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Request a Refund</h1>
        <p className="text-gray-500 mt-1">Submit refund requests for completed or delivered orders</p>
      </motion.div>

      {/* Refund Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><RotateCcw className="h-5 w-5 text-green-600" /> New Refund Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Select */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Select Order</label>
              {loading ? <Skeleton className="h-10 w-full rounded-lg" /> : (
                <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:border-green-400">
                  <option value="">Choose an order...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.id.slice(-6).toUpperCase()} — {o.listing?.crop || 'Order'} — ₹{o.totalAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Reason</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REASONS.map(r => (
                  <button key={r.value} onClick={() => setReason(r.value)}
                    className={`p-3 rounded-xl border text-left text-sm transition-all flex items-center gap-2 ${reason === r.value ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500/20' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                    <span>{r.icon}</span> {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <Textarea placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)}
                className="min-h-[80px] border-gray-200 focus:border-green-400" />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Evidence Photos</label>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={p} alt="evidence" className="w-full h-full object-cover" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-green-400 transition-colors">
                  <Camera className="h-5 w-5 text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-0.5">Upload</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            <Button className="w-full h-11 bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={submitting || !selectedOrder || !reason}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Submit Refund Request
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Refund Status Tracker */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Refund Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No refund requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {refunds.map(r => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        {statusIcon(r.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.reason} — Order #{r.orderId.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] border ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                      {r.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
