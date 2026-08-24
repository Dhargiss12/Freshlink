'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Info, AlertTriangle, CheckCircle, X, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type Notification } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

function notifIcon(type: string, size = 'h-4 w-4') {
  switch (type) {
    case 'info': return <Info className={`${size} text-blue-500`} />;
    case 'warning': return <AlertTriangle className={`${size} text-orange-500`} />;
    case 'success': return <CheckCircle className={`${size} text-green-500`} />;
    case 'alert': return <Bell className={`${size} text-red-500`} />;
    case 'order': return <CheckCircle className={`${size} text-green-500`} />;
    case 'message': return <Info className={`${size} text-blue-500`} />;
    default: return <Bell className={`${size} text-gray-500`} />;
  }
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { user, setNotifications, notifications, showToast } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        const data = await safeJson(res);
        if (!data) return;
        const unwrapped = data.notifications || data;
        if (Array.isArray(unwrapped)) setNotifications(unwrapped);
      } catch (e) {
        console.error('Notifications fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [open, user]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark_read' }),
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: n.id, action: 'mark_read' }),
        });
      } catch { /* silent */ }
    }
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

          {/* Panel */}
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">

            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-green-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.some(n => !n.read) && (
                  <Button variant="ghost" size="sm" className="text-xs text-green-600" onClick={markAllRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Bell className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                  <h3 className="text-sm font-medium text-gray-500">No notifications</h3>
                  <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif, i) => (
                    <motion.div key={notif.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className={`p-4 cursor-pointer transition-colors ${notif.read ? 'bg-white' : 'bg-green-50/50 hover:bg-green-50'}`}
                      onClick={() => { if (!notif.read) markAsRead(notif.id); }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-green-100'}`}>
                          {notifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'} truncate`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
