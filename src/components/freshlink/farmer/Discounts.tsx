'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Tag, Edit3, XCircle, Percent, DollarSign, Layers, Clock, Sprout,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppStore, type Discount } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Cabbage', 'Cauliflower', 'Brinjal', 'Capsicum', 'Okra'];

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
  expired: { label: 'Expired', className: 'bg-red-100 text-red-600 hover:bg-red-100' },
};

export default function Discounts() {
  const { user, showToast } = useAppStore();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ crop: '', discountType: 'percentage', discountValue: '', minQuantity: '', validUntil: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDiscounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/discounts?farmerId=${user.id}`);
      const data = await safeJson(res);
      if (!data) return;
      setDiscounts(Array.isArray(data.discounts || data) ? (data.discounts || data) : []);
    } catch {
      showToast('Failed to load discounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiscounts(); }, [user]);

  const handleCreate = async () => {
    if (!user || !form.crop || !form.discountValue) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: user.id, crop: form.crop, discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
          validUntil: form.validUntil || undefined,
        }),
      });
      if (res.ok) {
        showToast('Discount created!', 'success');
        setDialogOpen(false);
        setForm({ crop: '', discountType: 'percentage', discountValue: '', minQuantity: '', validUntil: '' });
        fetchDiscounts();
      } else showToast('Failed to create discount', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await fetch('/api/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'inactive' }),
      });
      showToast('Discount deactivated', 'info');
      fetchDiscounts();
    } catch { showToast('Failed to update discount', 'error'); }
  };

  const typeIcon = (t: string) => t === 'percentage' ? <Percent className="h-4 w-4" /> : t === 'fixed' ? <DollarSign className="h-4 w-4" /> : <Layers className="h-4 w-4" />;
  const typeLabel = (t: string) => t === 'percentage' ? '%' : t === 'fixed' ? '₹ off' : 'Bulk';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Discounts</h1>
          <p className="text-gray-500 mt-1">Manage discounts to boost your sales</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-2 self-start" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Create Discount
        </Button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : discounts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No discounts yet</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">Create discounts to attract more buyers</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Discount</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((d, i) => {
            const sc = statusConfig[d.status] || statusConfig.active;
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-0 shadow-sm h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><Sprout className="h-5 w-5 text-green-600" /></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{d.crop}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-400">{typeIcon(d.discountType)} {d.discountType}</div>
                        </div>
                      </div>
                      <Badge className={sc.className} variant="secondary">{sc.label}</Badge>
                    </div>
                    <div className="text-3xl font-bold text-green-700 mb-3">{d.discountValue}{typeLabel(d.discountType)}</div>
                    <div className="space-y-1.5 flex-1">
                      {d.minQuantity && <p className="text-sm text-gray-500">Min. Quantity: <span className="font-medium text-gray-700">{d.minQuantity} kg</span></p>}
                      {d.validUntil && (
                        <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Valid until <span className="font-medium text-gray-700">{new Date(d.validUntil).toLocaleDateString()}</span></p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700" onClick={() => showToast('Edit feature coming soon', 'info')}><Edit3 className="h-3.5 w-3.5" /> Edit</Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-1 hover:bg-red-50 hover:border-red-200 hover:text-red-600" onClick={() => handleDeactivate(d.id)}><XCircle className="h-3.5 w-3.5" /> Deactivate</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Discount Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl">Create Discount</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Crop</Label><Select value={form.crop} onValueChange={(v) => setForm({ ...form, crop: v })}><SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger><SelectContent>{CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Discount Type</Label><Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (₹)</SelectItem><SelectItem value="bulk">Bulk Discount</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Value</Label><Input type="number" placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5'} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></div>
            <div className="space-y-2"><Label>Min. Quantity (kg, optional)</Label><Input type="number" placeholder="e.g. 20" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} /></div>
            <div className="space-y-2"><Label>Valid Until (optional)</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={submitting || !form.crop || !form.discountValue} onClick={handleCreate}>{submitting ? 'Creating...' : 'Create Discount'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
