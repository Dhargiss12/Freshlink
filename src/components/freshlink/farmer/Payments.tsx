'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, Clock, CheckCircle2, XCircle, AlertCircle, CreditCard, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 hover:bg-green-100', icon: <CheckCircle2 className="h-4 w-4" /> },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100', icon: <AlertCircle className="h-4 w-4" /> },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700 hover:bg-red-100', icon: <XCircle className="h-4 w-4" /> },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100', icon: <AlertCircle className="h-4 w-4" /> },
};

export default function Payments() {
  const { user, showToast } = useAppStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments?userId=${user.id}`);
        const data = await res.json();
        setPayments(Array.isArray(data.payments || data) ? (data.payments || data) : []);
      } catch {
        showToast('Failed to load payments', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user, showToast]);

  const totalReceived = payments.filter((p) => p.paymentStatus === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.paymentStatus === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Track your earnings and payment history</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Received</p>
              <p className="text-xl font-bold text-gray-900">₹{totalReceived.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-xl"><IndianRupee className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><CreditCard className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold">Payment History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p, i) => {
                const sc = statusConfig[p.paymentStatus] || statusConfig.pending;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><IndianRupee className="h-5 w-5 text-green-600" /></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Order #{(p.orderId || p.id || '').slice(-6).toUpperCase()}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{p.paymentMethod || 'UPI'}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{p.amount?.toLocaleString()}</p>
                        {p.transactionRef && <p className="text-xs text-gray-400">Ref: {p.transactionRef.slice(0, 12)}</p>}
                      </div>
                      <Badge className={sc.className} variant="secondary">{sc.label}</Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
