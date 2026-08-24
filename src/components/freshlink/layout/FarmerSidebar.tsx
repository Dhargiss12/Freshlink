'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Sprout,
  BarChart3,
  Bot,
  ShoppingCart,
  MessageSquare,
  Users,
  Tags,
  ShieldCheck,
  CloudSun,
  PackageX,
  CreditCard,
  Star,
  Settings,
  LogOut,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Handshake,
} from 'lucide-react';
import { useAppStore, ViewType } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  view: ViewType;
  icon: React.ReactNode;
  badge?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', view: 'farmer-dashboard', icon: <Home className="size-4" /> },
  { label: 'My Crops', view: 'farmer-crops', icon: <Sprout className="size-4" /> },
  { label: 'Demand Forecast', view: 'farmer-demand', icon: <BarChart3 className="size-4" /> },
  { label: 'AI Selling Advisor', view: 'farmer-selling', icon: <Bot className="size-4" /> },
  { label: 'My Orders', view: 'farmer-orders', icon: <ShoppingCart className="size-4" />, badge: true },
  { label: 'Negotiations', view: 'farmer-negotiations', icon: <Handshake className="size-4" />, badge: true },
  { label: 'Buyers', view: 'farmer-buyers', icon: <Users className="size-4" /> },
  { label: 'Discounts & Offers', view: 'farmer-discounts', icon: <Tags className="size-4" /> },
  { label: 'Quality Check', view: 'farmer-quality', icon: <ShieldCheck className="size-4" /> },
  { label: 'Weather & Farming', view: 'farmer-weather', icon: <CloudSun className="size-4" /> },
  { label: 'Unsold Stock', view: 'farmer-unsold', icon: <PackageX className="size-4" /> },
  { label: 'Messages', view: 'farmer-messages', icon: <MessageSquare className="size-4" />, badge: true },
  { label: 'Payments', view: 'farmer-payments', icon: <CreditCard className="size-4" /> },
  { label: 'Feedback & Reliability', view: 'farmer-feedback', icon: <Star className="size-4" /> },
  { label: 'Settings', view: 'farmer-settings', icon: <Settings className="size-4" /> },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { currentView, navigate, user, logout, unreadNotifications } = useAppStore();

  const handleNav = (view: ViewType) => {
    navigate(view);
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-600 shadow-md">
          <Leaf className="size-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold text-green-700 whitespace-nowrap">FreshLink</h1>
              <p className="text-[10px] text-green-600/70 font-medium whitespace-nowrap">AI Agriculture</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="bg-green-100" />

      {/* Farmer Info */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0 border-2 border-green-200">
            <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'FA'}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-800 whitespace-nowrap truncate max-w-[160px]">
                  {user?.name || 'Farmer'}
                </p>
                <p className="text-xs text-green-600 font-medium whitespace-nowrap">🌾 Farmer</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Separator className="bg-green-100" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            const showBadge = item.badge && unreadNotifications > 0;

            if (collapsed) {
              return (
                <TooltipProvider key={item.view} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleNav(item.view)}
                        className={`relative flex items-center justify-center size-10 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-green-600 text-white shadow-md shadow-green-200'
                            : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        {item.icon}
                        {showBadge && (
                          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-800 text-white text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return (
              <motion.button
                key={item.view}
                onClick={() => handleNav(item.view)}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom: Logout */}
      <div className="px-3 pb-4">
        <Separator className="bg-green-100 mb-3" />
        {collapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center size-10 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 mx-auto"
                >
                  <LogOut className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-800 text-white text-xs">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function FarmerSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen bg-white border-r border-green-100 shadow-sm shrink-0 overflow-hidden relative"
      >
        <SidebarContent collapsed={!sidebarOpen} />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-20 z-10 hidden lg:flex items-center justify-center size-7 rounded-full bg-white border border-green-200 text-green-600 shadow-md hover:bg-green-50 transition-colors"
          style={{ left: sidebarOpen ? 242 : 58 }}
        >
          {sidebarOpen ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>FreshLink farmer navigation</SheetDescription>
          </SheetHeader>
          <SidebarContent collapsed={false} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
