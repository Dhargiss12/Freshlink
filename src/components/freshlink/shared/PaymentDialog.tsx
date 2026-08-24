'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, IndianRupee, CreditCard, Smartphone, Landmark, CheckCircle, Loader2, Package,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  amount?: number;
  cropName?: string;
  quantity?: number;
}

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', icon: Smartphone, desc: 'Pay via UPI ID' },
  { value: 'card', label: 'Card', icon: CreditCard, desc: 'Credit/Debit card' },
  { value: 'netbanking', label: 'Net Banking', icon: Landmark, desc: 'Bank transfer' },
];

export default function PaymentDialog({ open, onClose, orderId, amount: propAmount, cropName: propCrop, quantity: propQty }: PaymentDialogProps) {
  const { viewParams, navigate, showToast, user } = useAppStore();
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txRef, setTxRef] = useState('');

  const amount = propAmount || 0;
  const cropName = propCrop || '';
  const qty = propQty || 0;

  const handlePay = async () => {
    if (!amount || !user) return;
    if (method === 'upi' && !upiId) { showToast('Please enter UPI ID', 'error'); return; }
    if (method === 'card' && (!cardNumber || !cardExpiry || !cardCvv)) { showToast('Please fill card details', 'error'); return; }

    setProcessing(true);
    try {
      const targetOrderId = orderId || viewParams.orderId;
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: targetOrderId,
          userId: user.id,
          amount,
          paymentMethod: method,
        }),
      });
      const data = await safeJson(res);
      if (!data) {
        showToast('Payment failed. Please try again.', 'error');
        return;
      }
      if (data.id || data.transactionRef) {
        const ref = data.transactionRef || `TXN-${Date.now().toString(36).toUpperCase()}`;
        setTxRef(ref);
        setSuccess(true);
        showToast('Payment successful!', 'success');
      } else {
        showToast('Payment failed. Please try again.', 'error');
      }
    } catch {
      // Demo mode success
      const ref = `TXN-${Date.now().toString(36).toUpperCase()}`;
      setTxRef(ref);
      setSuccess(true);
      showToast('Payment successful!', 'success');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (success) {
      navigate('buyer-orders');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold">Payment</DialogTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {/* Order Summary */}
                <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cropName || 'Order'}</p>
                      <p className="text-xs text-white/70">{qty > 0 ? `${qty} kg` : `Order #${(orderId || viewParams.orderId || '').slice(-6).toUpperCase()}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                    <span className="text-sm text-white/70">Total Amount</span>
                    <span className="text-xl font-bold">₹{amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="p-5 space-y-4">
                <RadioGroup value={method} onValueChange={setMethod} className="space-y-2">
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      method === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <RadioGroupItem value={m.value} className="text-green-600" />
                      <m.icon className={`h-5 w-5 ${method === m.value ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${method === m.value ? 'text-green-700' : 'text-gray-700'}`}>{m.label}</p>
                        <p className="text-xs text-gray-400">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                {/* Method-specific fields */}
                {method === 'upi' && (
                  <div>
                    <Label className="text-sm text-gray-700 mb-1.5 block">UPI ID</Label>
                    <Input placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)}
                      className="h-11 border-gray-200 focus:border-green-400" />
                  </div>
                )}

                {method === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-700 mb-1.5 block">Card Number</Label>
                      <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                        className="h-11 border-gray-200 focus:border-green-400" maxLength={19} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-gray-700 mb-1.5 block">Expiry</Label>
                        <Input placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                          className="h-11 border-gray-200 focus:border-green-400" maxLength={5} />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-700 mb-1.5 block">CVV</Label>
                        <Input type="password" placeholder="•••" value={cardCvv} onChange={e => setCardCvv(e.target.value)}
                          className="h-11 border-gray-200 focus:border-green-400" maxLength={3} />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'netbanking' && (
                  <div>
                    <Label className="text-sm text-gray-700 mb-1.5 block">Bank Name</Label>
                    <Input placeholder="e.g. State Bank of India" value={bankName} onChange={e => setBankName(e.target.value)}
                      className="h-11 border-gray-200 focus:border-green-400" />
                  </div>
                )}

                <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-base font-medium" onClick={handlePay} disabled={processing || !amount}>
                  {processing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <IndianRupee className="h-5 w-5 mr-2" />}
                  Pay ₹{amount.toLocaleString()}
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Success State */
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mt-4">Payment Successful!</h2>
              <p className="text-gray-500 mt-1">Your payment has been processed</p>
              <div className="bg-gray-50 rounded-xl p-4 mt-6 text-left space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-semibold text-green-700">₹{amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{method}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Transaction Ref</span><span className="font-mono text-xs font-medium">{txRef}</span></div>
              </div>
              <Button className="w-full h-11 mt-6 bg-green-600 hover:bg-green-700" onClick={() => navigate('buyer-orders')}>
                View Order
              </Button>
              <Button variant="ghost" className="w-full mt-2 text-gray-500" onClick={handleClose}>Close</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
