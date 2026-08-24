'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  MapPin,
  Leaf,
  User,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { safeJson } from '@/lib/safeFetch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FarmerTopBar() {
  const {
    user,
    unreadNotifications,
    navigate,
    logout,
    setSidebarOpen,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) || 'FA';

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-6 bg-white border-b border-green-100 shadow-sm">
      {/* Mobile Hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2 text-green-700 hover:bg-green-50"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {/* Logo (mobile only, desktop shows in sidebar) */}
      <div className="flex items-center gap-2 lg:hidden mr-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-green-600">
          <Leaf className="size-4 text-white" />
        </div>
        <span className="font-bold text-green-700 text-base">FreshLink</span>
      </div>

      {/* Search Bar */}
      <div className="hidden sm:flex flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Search crops, buyers, orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-emerald-50/50 border-green-200 rounded-xl h-9 text-sm focus-visible:border-green-400 focus-visible:ring-green-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              navigate('farmer-buyers', { search: searchQuery.trim() });
              setSearchQuery('');
            }
          }}
        />
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Location */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 mr-1">
          <MapPin className="size-3.5 text-green-600" />
          <span className="max-w-[120px] truncate">{user?.location || 'India'}</span>
        </div>

        {/* Language Selector */}
        <div className="hidden md:block">
          <Select value={user?.language === 'Hindi' ? 'hi' : user?.language === 'Marathi' ? 'mr' : user?.language === 'Tamil' ? 'ta' : user?.language === 'Telugu' ? 'te' : 'en'} onValueChange={async (v) => {
            const langMap: Record<string, string> = { en: 'English', hi: 'Hindi', mr: 'Marathi', ta: 'Tamil', te: 'Telugu' };
            const langName = langMap[v] || 'English';
            if (user) {
              try {
                const res = await fetch('/api/auth', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, language: langName }),
                });
                if (res.ok) {
                  const data = await safeJson(res);
                  if (data?.user) useAppStore.getState().setUser(data.user);
                }
              } catch {}
            }
          }}>
            <SelectTrigger className="h-8 w-24 text-xs bg-transparent border-green-200 rounded-lg">
              <Globe className="size-3.5 mr-1 text-green-600" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
              <SelectItem value="mr">मराठी</SelectItem>
              <SelectItem value="ta">தமிழ்</SelectItem>
              <SelectItem value="te">తెలుగు</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-500 hover:text-green-700 hover:bg-green-50"
          onClick={() => navigate('notifications')}
        >
          <Bell className="size-5" />
          {unreadNotifications > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </motion.span>
          )}
        </Button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-green-50 transition-colors">
              <Avatar className="size-8 border-2 border-green-200">
                <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name || 'Farmer'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel className="text-green-700 font-semibold">
              {user?.name || 'Farmer'}
              <p className="text-xs font-normal text-gray-400">{user?.email || ''}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('farmer-settings')}
              className="rounded-lg cursor-pointer"
            >
              <User className="size-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('farmer-settings')}
              className="rounded-lg cursor-pointer"
            >
              <Settings className="size-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="size-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
