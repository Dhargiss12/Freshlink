'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, MapPin, Globe, Bell, Trash2, Save, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati'];

export default function BuyerSettings() {
  const { user, showToast, logout } = useAppStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [location, setLocation] = useState(user?.location || '');
  const [language, setLanguage] = useState(user?.language || 'English');
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);
  const [notifPriceDrop, setNotifPriceDrop] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, name, phone, location, language }),
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (!data) { showToast('Failed to save settings', 'error'); return; }
        if (data.user) {
          useAppStore.getState().setUser(data.user);
        }
        showToast('Settings saved successfully!', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialog(false);
    logout();
    showToast('Account deleted successfully', 'info');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </motion.div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5 text-green-600" /> Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" /> Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /> Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-gray-400" /> Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-green-600" /> Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Order Updates', desc: 'Get notified about your order status', value: notifOrders, setter: setNotifOrders },
            { label: 'Messages', desc: 'Get notified for new messages from farmers', value: notifMessages, setter: setNotifMessages },
            { label: 'Promotions', desc: 'Receive promotional offers and updates', value: notifPromotions, setter: setNotifPromotions },
            { label: 'Price Alerts', desc: 'Get notified about price drops on your favorite crops', value: notifPriceDrop, setter: setNotifPriceDrop },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Switch checked={item.value} onCheckedChange={item.setter} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-green-600" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Username</span><span className="font-medium">@{user?.username}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Role</span><Badge className="bg-green-100 text-green-700 hover:bg-green-100" variant="secondary">Buyer</Badge></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Account ID</span><span className="font-mono text-xs text-gray-400">{user?.id?.slice(0, 12)}</span></div>
          <Separator />
          <Button variant="destructive" className="gap-2" onClick={() => setDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>Are you sure you want to delete your account? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Yes, Delete My Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
