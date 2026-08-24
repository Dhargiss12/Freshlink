'use client';

import React, { lazy, Suspense } from 'react';
import { useAppStore, ViewType } from '@/lib/store';

// Only load layout and auth eagerly
import OnboardingPage from '@/components/freshlink/auth/OnboardingPage';
import SignupPage from '@/components/freshlink/auth/SignupPage';
import LoginPage from '@/components/freshlink/auth/LoginPage';

// Lazy load everything else - only compiles when navigated to
const FarmerLayout = lazy(() => import('@/components/freshlink/layout/FarmerLayout').then(m => ({ default: m.default || m })));

const BuyerLayout = lazy(() => import('@/components/freshlink/layout/BuyerLayout').then(m => ({ default: m.default || m })));

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
    </div>
  );
}

const authViews = new Set<ViewType>(['onboarding', 'signup', 'login']);

function AuthView({ view }: { view: ViewType }) {
  switch (view) {
    case 'onboarding': return <OnboardingPage />;
    case 'signup': return <SignupPage />;
    case 'login': return <LoginPage />;
    default: return null;
  }
}

export default function Home() {
  const { currentView, user, toast } = useAppStore();
  const isAuth = authViews.has(currentView);
  const role = user?.role;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {toast && (
        <div className={"fixed top-4 right-4 z-[100] px-6 py-3 rounded-xl shadow-lg text-white font-medium " +
          (toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-500' : 'bg-green-700')}>
          {toast.message}
        </div>
      )}

      {isAuth && <AuthView view={currentView} />}

      {!isAuth && role === 'farmer' && (
        <Suspense fallback={<Spinner />}>
          <FarmerLayout />
        </Suspense>
      )}

      {!isAuth && role === 'buyer' && (
        <Suspense fallback={<Spinner />}>
          <BuyerLayout />
        </Suspense>
      )}
    </div>
  );
}
