import { create } from 'zustand';

export type ViewType =
  | 'onboarding'
  | 'signup'
  | 'login'
  | 'farmer-dashboard'
  | 'farmer-crops'
  | 'farmer-create-listing'
  | 'farmer-demand'
  | 'farmer-selling'
  | 'farmer-orders'
  | 'farmer-negotiations'
  | 'farmer-buyers'
  | 'farmer-discounts'
  | 'farmer-quality'
  | 'farmer-weather'
  | 'farmer-unsold'
  | 'farmer-messages'
  | 'farmer-payments'
  | 'farmer-feedback'
  | 'farmer-settings'
  | 'buyer-dashboard'
  | 'buyer-search'
  | 'buyer-nearby'
  | 'buyer-discover'
  | 'buyer-product'
  | 'buyer-negotiation'
  | 'buyer-orders'
  | 'buyer-delivery'
  | 'buyer-refund'
  | 'buyer-messages'
  | 'buyer-feedback'
  | 'buyer-needs'
  | 'buyer-profile'
  | 'buyer-settings'
  | 'notifications';

export interface User {
  id: string;
  name: string;
  age: number;
  username: string;
  phone: string;
  email: string;
  role: 'farmer' | 'buyer';
  location: string;
  language: string;
  reliabilityScore?: number | null;
  profileImage?: string | null;
  createdAt?: string;
}

export interface Listing {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmerReliability?: number;
  crop: string;
  quantity: number;
  unit: string;
  location: string;
  harvestDate: string;
  shelfLife: number;
  expectedPrice: number;
  floorPrice?: number;
  qualityDetails?: string;
  packagingDetails?: string;
  productImages?: string;
  qualityScore?: number;
  spoilageRisk?: string;
  status: string;
  region: string;
  createdAt: string;
}

export interface Negotiation {
  id: string;
  listingId: string;
  buyerId: string;
  farmerId: string;
  aiSuggestedMin: number;
  aiSuggestedMax: number;
  aiExplanation: string;
  finalPrice?: number;
  status: string;
  urgency: number;
  messages?: NegotiationMessage[];
}

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderRole: string;
  senderName: string;
  content: string;
  priceSuggested?: number;
  createdAt: string;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  farmerId: string;
  agreedPrice: number;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  listing?: Listing;
  buyer?: User;
  farmer?: User;
  payment?: Payment;
  delivery?: Delivery;
  feedback?: Feedback;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef?: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  orderId: string;
  buyerId: string;
  farmerId: string;
  rating: number;
  qualityRating?: number;
  freshnessRating?: number;
  packagingRating?: number;
  deliveryRating?: number;
  comment?: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  partner: string;
  status: string;
  currentLocation?: string;
  estimatedArrival?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  orderRef?: string;
  read: boolean;
  createdAt: string;
}

export interface Discount {
  id: string;
  farmerId: string;
  listingId?: string;
  crop: string;
  discountType: string;
  discountValue: number;
  minQuantity?: number;
  validUntil?: string;
  status: string;
}

interface AppState {
  // Navigation
  currentView: ViewType;
  viewHistory: ViewType[];
  viewParams: Record<string, any>;

  // Auth
  user: User | null;
  isAuthenticated: boolean;

  // Data
  listings: Listing[];
  selectedListing: Listing | null;
  orders: Order[];
  selectedOrder: Order | null;
  negotiations: Negotiation[];
  selectedNegotiation: Negotiation | null;
  notifications: Notification[];
  messages: Message[];
  discounts: Discount[];
  unreadNotifications: number;

  // UI state
  sidebarOpen: boolean;
  loading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Actions
  navigate: (view: ViewType, params?: Record<string, any>) => void;
  goBack: () => void;
  setUser: (user: User | null) => void;
  setListings: (listings: Listing[]) => void;
  setSelectedListing: (listing: Listing | null) => void;
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setNegotiations: (negotiations: Negotiation[]) => void;
  setSelectedNegotiation: (negotiation: Negotiation | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  setMessages: (messages: Message[]) => void;
  setDiscounts: (discounts: Discount[]) => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'onboarding',
  viewHistory: [],
  viewParams: {},
  user: null,
  isAuthenticated: false,
  listings: [],
  selectedListing: null,
  orders: [],
  selectedOrder: null,
  negotiations: [],
  selectedNegotiation: null,
  notifications: [],
  messages: [],
  discounts: [],
  unreadNotifications: 0,
  sidebarOpen: true,
  loading: false,
  toast: null,

  navigate: (view, params = {}) => {
    const { currentView, viewHistory } = get();
    set({
      currentView: view,
      viewHistory: [...viewHistory, currentView],
      viewParams: params,
      toast: null,
    });
  },

  goBack: () => {
    const { viewHistory } = get();
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      set({
        currentView: prev,
        viewHistory: viewHistory.slice(0, -1),
      });
    }
  },

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    currentView: user ? (user.role === 'farmer' ? 'farmer-dashboard' : 'buyer-dashboard') : 'onboarding',
  }),

  setListings: (listings) => set({ listings }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setNegotiations: (negotiations) => set({ negotiations }),
  setSelectedNegotiation: (negotiation) => set({ selectedNegotiation: negotiation }),
  setNotifications: (notifications) => set({
    notifications,
    unreadNotifications: notifications.filter((n) => !n.read).length,
  }),
  setMessages: (messages) => set({ messages }),
  setDiscounts: (discounts) => set({ discounts }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setLoading: (loading) => set({ loading }),
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => get().clearToast(), 4000);
  },
  clearToast: () => set({ toast: null }),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    currentView: 'onboarding',
    viewHistory: [],
    listings: [],
    orders: [],
    negotiations: [],
    notifications: [],
    messages: [],
    discounts: [],
  }),
}));
