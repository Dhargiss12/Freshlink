'use client';

import { useAppStore, ViewType } from '@/lib/store';
import FarmerSidebar from './FarmerSidebar';
import FarmerTopBar from './FarmerTopBar';
import dynamic from 'next/dynamic';

const FarmerDashboard = dynamic(() => import('@/components/freshlink/farmer/FarmerDashboard').then(m => ({ default: m.default || m })));
const MyCrops = dynamic(() => import('@/components/freshlink/farmer/MyCrops').then(m => ({ default: m.default || m })));
const CreateListing = dynamic(() => import('@/components/freshlink/farmer/CreateListing').then(m => ({ default: m.default || m })));
const DemandForecast = dynamic(() => import('@/components/freshlink/farmer/DemandForecast').then(m => ({ default: m.default || m })));
const SellingAdvisor = dynamic(() => import('@/components/freshlink/farmer/SellingAdvisor').then(m => ({ default: m.default || m })));
const MyOrders = dynamic(() => import('@/components/freshlink/farmer/MyOrders').then(m => ({ default: m.default || m })));
const Negotiations = dynamic(() => import('@/components/freshlink/farmer/Negotiations').then(m => ({ default: m.default || m })));
const RecommendedBuyers = dynamic(() => import('@/components/freshlink/farmer/RecommendedBuyers').then(m => ({ default: m.default || m })));
const Discounts = dynamic(() => import('@/components/freshlink/farmer/Discounts').then(m => ({ default: m.default || m })));
const QualityCheck = dynamic(() => import('@/components/freshlink/farmer/QualityCheck').then(m => ({ default: m.default || m })));
const WeatherFarming = dynamic(() => import('@/components/freshlink/farmer/WeatherFarming').then(m => ({ default: m.default || m })));
const UnsoldStock = dynamic(() => import('@/components/freshlink/farmer/UnsoldStock').then(m => ({ default: m.default || m })));
const Messages = dynamic(() => import('@/components/freshlink/farmer/Messages').then(m => ({ default: m.default || m })));
const Payments = dynamic(() => import('@/components/freshlink/farmer/Payments').then(m => ({ default: m.default || m })));
const FeedbackReliability = dynamic(() => import('@/components/freshlink/farmer/FeedbackReliability').then(m => ({ default: m.default || m })));
const Settings = dynamic(() => import('@/components/freshlink/farmer/Settings').then(m => ({ default: m.default || m })));

import OrderDetails from '@/components/freshlink/shared/OrderDetails';
import PaymentDialog from '@/components/freshlink/shared/PaymentDialog';

const viewMap: Record<string, React.ComponentType> = {
  'farmer-dashboard': FarmerDashboard,
  'farmer-crops': MyCrops,
  'farmer-create-listing': CreateListing,
  'farmer-demand': DemandForecast,
  'farmer-selling': SellingAdvisor,
  'farmer-orders': MyOrders,
  'farmer-negotiations': Negotiations,
  'farmer-buyers': RecommendedBuyers,
  'farmer-discounts': Discounts,
  'farmer-quality': QualityCheck,
  'farmer-weather': WeatherFarming,
  'farmer-unsold': UnsoldStock,
  'farmer-messages': Messages,
  'farmer-payments': Payments,
  'farmer-feedback': FeedbackReliability,
  'farmer-settings': Settings,
  'notifications': (() => { const n = dynamic(() => import('@/components/freshlink/shared/NotificationsPanel').then(m => ({ default: m.default || m }))); return n; })(),
};

export default function FarmerLayout() {
  const { currentView, viewParams } = useAppStore();
  const ViewComponent = viewMap[currentView];

  if (!ViewComponent) return <div className="p-8">View not found</div>;

  return (
    <div className="flex min-h-screen">
      <FarmerSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <FarmerTopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {viewParams?.showOrderDetails ? <OrderDetails /> : viewParams?.showPayment ? <PaymentDialog /> : <ViewComponent />}
        </main>
      </div>
    </div>
  );
}