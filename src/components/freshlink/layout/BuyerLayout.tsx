'use client';

import { useAppStore } from '@/lib/store';
import BuyerHeader from './BuyerHeader';
import BuyerBottomNav from './BuyerBottomNav';
import dynamic from 'next/dynamic';

const BuyerDashboard = dynamic(() => import('@/components/freshlink/buyer/BuyerDashboard').then(m => ({ default: m.default || m })));
const SearchResults = dynamic(() => import('@/components/freshlink/buyer/SearchResults').then(m => ({ default: m.default || m })));
const NearbyFarmers = dynamic(() => import('@/components/freshlink/buyer/NearbyFarmers').then(m => ({ default: m.default || m })));
const ProductDiscovery = dynamic(() => import('@/components/freshlink/buyer/ProductDiscovery').then(m => ({ default: m.default || m })));
const ProductDetails = dynamic(() => import('@/components/freshlink/buyer/ProductDetails').then(m => ({ default: m.default || m })));
const BuyerNegotiation = dynamic(() => import('@/components/freshlink/buyer/BuyerNegotiation').then(m => ({ default: m.default || m })));
const BuyerOrders = dynamic(() => import('@/components/freshlink/buyer/BuyerOrders').then(m => ({ default: m.default || m })));
const DeliveryTracking = dynamic(() => import('@/components/freshlink/buyer/DeliveryTracking').then(m => ({ default: m.default || m })));
const RefundRequest = dynamic(() => import('@/components/freshlink/buyer/RefundRequest').then(m => ({ default: m.default || m })));
const BuyerMessages = dynamic(() => import('@/components/freshlink/buyer/BuyerMessages').then(m => ({ default: m.default || m })));
const BuyerFeedback = dynamic(() => import('@/components/freshlink/buyer/BuyerFeedback').then(m => ({ default: m.default || m })));
const BuyerNeeds = dynamic(() => import('@/components/freshlink/buyer/BuyerNeeds').then(m => ({ default: m.default || m })));
const BuyerProfile = dynamic(() => import('@/components/freshlink/buyer/BuyerProfile').then(m => ({ default: m.default || m })));
const BuyerSettings = dynamic(() => import('@/components/freshlink/buyer/BuyerSettings').then(m => ({ default: m.default || m })));

import OrderDetails from '@/components/freshlink/shared/OrderDetails';
import PaymentDialog from '@/components/freshlink/shared/PaymentDialog';

const viewMap: Record<string, React.ComponentType> = {
  'buyer-dashboard': BuyerDashboard,
  'buyer-search': SearchResults,
  'buyer-nearby': NearbyFarmers,
  'buyer-discover': ProductDiscovery,
  'buyer-product': ProductDetails,
  'buyer-negotiation': BuyerNegotiation,
  'buyer-orders': BuyerOrders,
  'buyer-delivery': DeliveryTracking,
  'buyer-refund': RefundRequest,
  'buyer-messages': BuyerMessages,
  'buyer-feedback': BuyerFeedback,
  'buyer-needs': BuyerNeeds,
  'buyer-profile': BuyerProfile,
  'buyer-settings': BuyerSettings,
  'notifications': dynamic(() => import('@/components/freshlink/shared/NotificationsPanel').then(m => ({ default: m.default || m }))),
};

export default function BuyerLayout() {
  const { currentView, viewParams } = useAppStore();
  const ViewComponent = viewMap[currentView];

  if (!ViewComponent) return <div className="p-8">View not found</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <BuyerHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
        {viewParams?.showOrderDetails ? <OrderDetails /> : viewParams?.showPayment ? <PaymentDialog /> : <ViewComponent />}
      </main>
      <BuyerBottomNav />
    </div>
  );
}
