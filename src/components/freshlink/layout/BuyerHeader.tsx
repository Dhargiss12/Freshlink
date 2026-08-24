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
  Home,
  ShoppingCart,
  MessageSquare,
  Star,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const mobileNavItems = [
  { label: 'Home', view: 'buyer-dashboard' as const, icon: <Home className="size-5" /> },
  { label: 'My Orders', view: 'buyer-orders' as const, icon: <ShoppingCart className="size-5" /> },
  { label: 'Messages', view: 'buyer-messages' as const, icon: <MessageSquare className="size-5" /> },
  { label: 'Feedback', view: 'buyer-feedback' as const, icon: <Star className="size-5" /> },
  { label: 'Settings', view: 'buyer-settings' as const, icon: <Settings className="size-5" /> },
];

export default function BuyerHeader() {
  const { user, unreadNotifications, navigate, logout, sidebarOpen, setSidebarOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) || 'BU';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('buyer-search', { q: searchQuery.trim() });
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-green-100 shadow-sm">
        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2 text-green-700 hover:bg-green-50"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo */}
        <div
          className="flex items-center gap-2 mr-4 cursor-pointer"
          onClick={() => navigate('buyer-dashboard')}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-green-600">
            <Leaf className="size-4 text-white" />
          </div>
          <span className="font-bold text-green-700 text-base hidden sm:inline">FreshLink</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search for fresh produce..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-emerald-50/50 border-green-200 rounded-xl h-9 text-sm focus-visible:border-green-400 focus-visible:ring-green-200"
          />
        </form>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Location */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 mr-1">
            <MapPin className="size-3.5 text-green-600" />
            <span className="max-w-[100px] truncate">{user?.location || 'India'}</span>
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
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name || 'Buyer'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel className="text-green-700 font-semibold">
                {user?.name || 'Buyer'}
                <p className="text-xs font-normal text-gray-400">{user?.email || ''}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('buyer-profile')}
                className="rounded-lg cursor-pointer"
              >
                <User className="size-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('buyer-settings')}
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

      {/* Mobile Drawer */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Buyer Menu</SheetTitle>
            <SheetDescription>FreshLink buyer navigation</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="flex items-center gap-3 px-4 py-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-600 shadow-md">
                <Leaf className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-green-700">FreshLink</h1>
                <p className="text-[10px] text-green-600/70 font-medium">AI Agriculture</p>
              </div>
            </div>

            {/* User Info */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border-2 border-green-200">
                  <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">
                    {user?.name || 'Buyer'}
                  </p>
                  <p className="text-xs text-green-600 font-medium">🛒 Buyer</p>
                </div>
              </div>
            </div>

            <Separator className="bg-green-100" />

            {/* Nav Items */}
            <nav className="flex flex-col gap-1 px-3 py-3">
              {mobileNavItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    navigate(item.view);
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto px-3 pb-4">
              <Separator className="bg-green-100 mb-3" />
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="size-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
