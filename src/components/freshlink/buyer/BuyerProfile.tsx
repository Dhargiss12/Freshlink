'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, MapPin, Calendar, ShoppingBag, Star, Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

export default function BuyerProfile() {
  const { user, showToast } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders?buyerId=${user.id}`)
      .then(r => safeJson(r))
      .then(d => {
        if (!d) return;
        const orders = d.orders || d;
        const arr = Array.isArray(orders) ? orders : [];
        setOrderCount(arr.length);
        setTotalSpent(arr.filter((o: any) => o.paymentStatus === 'completed').reduce((s: number, o: any) => s + (o.totalAmount || 0), 0));
      })
      .catch(() => {});
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, phone, location }),
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (!data) { showToast('Failed to update profile', 'error'); return; }
        if (data.user) {
          useAppStore.getState().setUser(data.user);
        }
        showToast('Profile updated successfully!', 'success');
        setEditing(false);
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch {
      showToast('Error updating profile', 'error');
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'BU';

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">View and manage your account information</p>
      </motion.div>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-20 border-4 border-green-200">
              <AvatarFallback className="bg-green-100 text-green-700 text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-green-600 font-medium mt-1">🛒 Buyer</p>
            </div>
            <Button variant="outline" className="hover:bg-green-50 hover:border-green-200 hover:text-green-700" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5 text-green-600" /> Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" /> Full Name</Label>
              {editing ? <Input value={name} onChange={(e) => setName(e.target.value)} /> : <div className="text-sm font-medium text-gray-900">{user?.name}</div>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> Phone</Label>
              {editing ? <Input value={phone} onChange={(e) => setPhone(e.target.value)} /> : <div className="text-sm font-medium text-gray-900">{user?.phone}</div>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /> Email</Label>
              <div className="text-sm font-medium text-gray-900">{user?.email}</div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> Location</Label>
              {editing ? <Input value={location} onChange={(e) => setLocation(e.target.value)} /> : <div className="text-sm font-medium text-gray-900">{user?.location}</div>}
            </div>
          </div>
          {editing && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>Save Changes</Button>
          )}
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-green-600" /> Account Stats</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Username</span><span className="font-medium">@{user?.username}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Role</span><Badge className="bg-green-100 text-green-700 hover:bg-green-100" variant="secondary">Buyer</Badge></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Account ID</span><span className="font-mono text-xs text-gray-400">{user?.id?.slice(0, 12)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Joined</span><span className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
          <Separator />
          <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Total Orders</span><span className="font-bold text-green-700">{orderCount}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Total Spent</span><span className="font-bold text-green-700">₹{totalSpent.toLocaleString()}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
