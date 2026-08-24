'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, ShoppingCart, MessageSquare, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const navItems = [
  { label: 'Home', view: 'buyer-dashboard' as const, icon: Home },
  { label: 'Search', view: 'buyer-search' as const, icon: Search },
  { label: 'Orders', view: 'buyer-orders' as const, icon: ShoppingCart },
  { label: 'Messages', view: 'buyer-messages' as const, icon: MessageSquare },
  { label: 'Profile', view: 'buyer-needs' as const, icon: User },
];

export default function BuyerBottomNav() {
  const { currentView, navigate } = useAppStore();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-green-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;

          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <div className="relative">
                <Icon
                  className={`size-5 transition-colors duration-200 ${
                    isActive ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="buyer-bottom-nav-indicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-green-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
