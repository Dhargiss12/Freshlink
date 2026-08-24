import { db } from '../src/lib/db';
import { hashSync } from 'bcryptjs';

const NOW = new Date();
const HOURS_AGO = (h: number) => new Date(NOW.getTime() - h * 3600000);
const HOURS_LATER = (h: number) => new Date(NOW.getTime() + h * 3600000);
const DAYS_AGO = (d: number) => new Date(NOW.getTime() - d * 86400000);

async function seed() {
  console.log('Seeding database...');

  // Clean existing data
  await db.message.deleteMany();
  await db.notification.deleteMany();
  await db.refund.deleteMany();
  await db.feedback.deleteMany();
  await db.delivery.deleteMany();
  await db.payment.deleteMany();
  await db.negotiationMessage.deleteMany();
  await db.negotiation.deleteMany();
  await db.order.deleteMany();
  await db.offer.deleteMany();
  await db.discount.deleteMany();
  await db.listing.deleteMany();
  await db.user.deleteMany();

  // Password hash for all users
  const pw = hashSync('demo1234', 10);

  // --- FARMERS ---
  const ravi = await db.user.create({
    data: {
      id: 'farmer_ravi', name: 'Ravi Kumar', age: 35, username: 'ravikumar',
      phone: '+919876543210', email: 'ravi@freshlink.demo', password: pw,
      role: 'farmer', location: 'Pune, Maharashtra', reliabilityScore: 92,
    },
  });

  const anita = await db.user.create({
    data: {
      id: 'farmer_anita', name: 'Anita Deshmukh', age: 42, username: 'anitafarm',
      phone: '+919876543211', email: 'anita@freshlink.demo', password: pw,
      role: 'farmer', location: 'Nashik, Maharashtra', reliabilityScore: 88,
    },
  });

  const suresh = await db.user.create({
    data: {
      id: 'farmer_suresh', name: 'Suresh Patil', age: 29, username: 'sureshpatil',
      phone: '+919876543212', email: 'suresh@freshlink.demo', password: pw,
      role: 'farmer', location: 'Satara, Maharashtra', reliabilityScore: 85,
    },
  });

  // --- BUYERS ---
  const sneha = await db.user.create({
    data: {
      id: 'buyer_sneha', name: 'Sneha Sharma', age: 28, username: 'snehasharma',
      phone: '+919123456789', email: 'sneha@freshlink.demo', password: pw,
      role: 'buyer', location: 'Pune, Maharashtra',
    },
  });

  const amit = await db.user.create({
    data: {
      id: 'buyer_amit', name: 'Amit Mehta', age: 34, username: 'amitmehta',
      phone: '+919123456790', email: 'amit@freshlink.demo', password: pw,
      role: 'buyer', location: 'Pune, Maharashtra',
    },
  });

  const priya = await db.user.create({
    data: {
      id: 'buyer_priya', name: 'Priya Nair', age: 31, username: 'priyanair',
      phone: '+919123456791', email: 'priya@freshlink.demo', password: pw,
      role: 'buyer', location: 'Mumbai, Maharashtra',
    },
  });

  // --- LISTINGS ---
  const tomatoListing = await db.listing.create({
    data: {
      id: 'listing_tomato_1', farmerId: ravi.id, crop: 'Tomato', quantity: 200,
      unit: 'kg', location: 'Pune, Maharashtra', harvestDate: HOURS_AGO(18),
      shelfLife: 96, expectedPrice: 25, floorPrice: 22,
      qualityDetails: 'Farm-fresh, hand-picked, no pesticides',
      packagingDetails: 'Cardboard crates, 10kg each',
      productImages: '[]', qualityScore: 89, spoilageRisk: 'Medium',
      status: 'active', region: 'Pune, Maharashtra',
    },
  });

  await db.listing.create({
    data: {
      id: 'listing_onion_1', farmerId: ravi.id, crop: 'Onion', quantity: 150,
      unit: 'kg', location: 'Pune, Maharashtra', harvestDate: HOURS_AGO(12),
      shelfLife: 168, expectedPrice: 30, floorPrice: 25,
      qualityDetails: 'Freshly harvested, medium sized',
      packagingDetails: 'Mesh bags, 25kg each',
      productImages: '[]', qualityScore: 91, spoilageRisk: 'Low',
      status: 'active', region: 'Pune, Maharashtra',
    },
  });

  await db.listing.create({
    data: {
      id: 'listing_spinach_1', farmerId: anita.id, crop: 'Spinach', quantity: 80,
      unit: 'kg', location: 'Nashik, Maharashtra', harvestDate: HOURS_AGO(6),
      shelfLife: 48, expectedPrice: 20, floorPrice: 15,
      qualityDetails: 'Organic, tender leaves',
      packagingDetails: 'Bundled in newspaper, 2kg bundles',
      productImages: '[]', qualityScore: 94, spoilageRisk: 'Low',
      status: 'active', region: 'Nashik, Maharashtra',
    },
  });

  await db.listing.create({
    data: {
      id: 'listing_carrot_1', farmerId: suresh.id, crop: 'Carrot', quantity: 120,
      unit: 'kg', location: 'Satara, Maharashtra', harvestDate: HOURS_AGO(24),
      shelfLife: 120, expectedPrice: 35, floorPrice: 28,
      qualityDetails: 'Fresh orange carrots, medium size',
      packagingDetails: 'Plastic crates, 15kg each',
      productImages: '[]', qualityScore: 87, spoilageRisk: 'Low',
      status: 'active', region: 'Satara, Maharashtra',
    },
  });

  await db.listing.create({
    data: {
      id: 'listing_potato_1', farmerId: suresh.id, crop: 'Potato', quantity: 300,
      unit: 'kg', location: 'Satara, Maharashtra', harvestDate: DAYS_AGO(3),
      shelfLife: 240, expectedPrice: 22, floorPrice: 18,
      qualityDetails: 'Aloo variety, clean and sorted',
      packagingDetails: 'Jute bags, 50kg each',
      productImages: '[]', qualityScore: 85, spoilageRisk: 'Low',
      status: 'active', region: 'Satara, Maharashtra',
    },
  });

  // --- COMPLETED ORDER (for feedback demo) ---
  const completedListing = await db.listing.create({
    data: {
      id: 'listing_tomato_old', farmerId: ravi.id, crop: 'Tomato', quantity: 50,
      unit: 'kg', location: 'Pune, Maharashtra', harvestDate: DAYS_AGO(5),
      shelfLife: 96, expectedPrice: 24, floorPrice: 20,
      qualityDetails: 'Good quality tomatoes', packagingDetails: 'Standard packing',
      qualityScore: 90, spoilageRisk: 'Low', status: 'sold', region: 'Pune, Maharashtra',
    },
  });

  const completedOrder = await db.order.create({
    data: {
      id: 'order_completed_1', listingId: completedListing.id,
      buyerId: sneha.id, farmerId: ravi.id,
      agreedPrice: 22, quantity: 50, totalAmount: 1100,
      status: 'delivered', paymentStatus: 'paid', createdAt: DAYS_AGO(4),
    },
  });

  await db.payment.create({
    data: {
      id: 'pay_completed_1', orderId: completedOrder.id, userId: sneha.id,
      amount: 1100, paymentMethod: 'upi', paymentStatus: 'completed',
      transactionRef: 'UPI_TXN_' + Date.now(), createdAt: DAYS_AGO(4),
    },
  });

  await db.delivery.create({
    data: {
      id: 'del_completed_1', orderId: completedOrder.id,
      partner: 'FreshLink Express', status: 'delivered',
      currentLocation: 'Pune, Maharashtra', createdAt: DAYS_AGO(4),
    },
  });

  await db.feedback.create({
    data: {
      id: 'feedback_1', orderId: completedOrder.id, buyerId: sneha.id, farmerId: ravi.id,
      rating: 4.5, qualityRating: 4.5, freshnessRating: 4, packagingRating: 5, deliveryRating: 4,
      comment: 'Fresh and good quality tomatoes. Delivered on time.', createdAt: DAYS_AGO(3),
    },
  });

  // --- ACTIVE ORDER (in transit) ---
  const activeListing = await db.listing.create({
    data: {
      id: 'listing_onion_active', farmerId: ravi.id, crop: 'Onion', quantity: 30,
      unit: 'kg', location: 'Pune, Maharashtra', harvestDate: DAYS_AGO(2),
      shelfLife: 168, expectedPrice: 28, floorPrice: 24,
      qualityDetails: 'Fresh onions', packagingDetails: 'Mesh bags',
      qualityScore: 88, spoilageRisk: 'Low', status: 'sold', region: 'Pune, Maharashtra',
    },
  });

  const activeOrder = await db.order.create({
    data: {
      id: 'order_active_1', listingId: activeListing.id,
      buyerId: amit.id, farmerId: ravi.id,
      agreedPrice: 26, quantity: 30, totalAmount: 780,
      status: 'in_transit', paymentStatus: 'paid', createdAt: DAYS_AGO(1),
    },
  });

  await db.payment.create({
    data: {
      id: 'pay_active_1', orderId: activeOrder.id, userId: amit.id,
      amount: 780, paymentMethod: 'card', paymentStatus: 'completed',
      transactionRef: 'CARD_TXN_' + Date.now(), createdAt: DAYS_AGO(1),
    },
  });

  await db.delivery.create({
    data: {
      id: 'del_active_1', orderId: activeOrder.id,
      partner: 'FreshLink Express', status: 'in_transit',
      currentLocation: 'Pune - Shivajinagar', estimatedArrival: HOURS_LATER(3),
      createdAt: DAYS_AGO(1),
    },
  });

  // --- DISCOUNTS ---
  await db.discount.create({
    data: {
      id: 'discount_1', farmerId: ravi.id, listingId: tomatoListing.id,
      crop: 'Tomato', discountType: 'percentage', discountValue: 10,
      minQuantity: 50, validUntil: HOURS_LATER(48), status: 'active',
    },
  });

  await db.discount.create({
    data: {
      id: 'discount_2', farmerId: anita.id, crop: 'Spinach',
      discountType: 'bulk', discountValue: 15, minQuantity: 20,
      validUntil: HOURS_LATER(24), status: 'active',
    },
  });

  // --- NOTIFICATIONS ---
  await db.notification.create({
    data: {
      userId: ravi.id, title: 'New Buyer Offer',
      message: 'Sneha Sharma made an offer of ₹18/kg for your Tomato listing.',
      type: 'info', relatedId: 'listing_tomato_1', read: false,
    },
  });
  await db.notification.create({
    data: {
      userId: ravi.id, title: 'Unsold Stock Alert',
      message: '35 kg of Tomato may remain unsold within the next 24 hours. Consider creating a discount.',
      type: 'warning', relatedId: 'listing_tomato_1', read: false,
    },
  });
  await db.notification.create({
    data: {
      userId: ravi.id, title: 'Payment Received',
      message: 'Payment of ₹780 received for Onion order.',
      type: 'success', relatedId: 'order_active_1', read: true,
    },
  });
  await db.notification.create({
    data: {
      userId: ravi.id, title: 'New Customer Feedback',
      message: 'Sneha Sharma rated your tomatoes 4.5/5.',
      type: 'success', relatedId: 'feedback_1', read: true,
    },
  });
  await db.notification.create({
    data: {
      userId: sneha.id, title: 'Delivery Update',
      message: 'Your Onion order is now in transit. Estimated arrival in 3 hours.',
      type: 'info', relatedId: 'order_active_1', read: false,
    },
  });
  await db.notification.create({
    data: {
      userId: sneha.id, title: 'New Nearby Produce',
      message: 'Ravi Kumar has listed fresh Tomatoes near you.',
      type: 'info', read: false,
    },
  });

  // --- MESSAGES ---
  await db.message.create({
    data: {
      senderId: ravi.id, receiverId: sneha.id,
      content: 'Hi Sneha, I have fresh tomatoes available. Would you like to place an order?',
      orderRef: 'order_completed_1', read: true, createdAt: DAYS_AGO(5),
    },
  });
  await db.message.create({
    data: {
      senderId: sneha.id, receiverId: ravi.id,
      content: 'Yes! I would like 50 kg. Can we discuss the price?',
      orderRef: 'order_completed_1', read: true, createdAt: DAYS_AGO(5),
    },
  });

  // --- NEGOTIATION (completed for demo) ---
  const demoNeg = await db.negotiation.create({
    data: {
      id: 'neg_completed_1', listingId: completedListing.id,
      buyerId: sneha.id, farmerId: ravi.id, offerId: null,
      aiSuggestedMin: 20, aiSuggestedMax: 22,
      aiExplanation: 'Based on market conditions and freshness, a fair range is ₹20–22/kg.',
      finalPrice: 22, status: 'agreed', urgency: 0.6,
      timeSinceHarvest: 24, completedAt: DAYS_AGO(4), createdAt: DAYS_AGO(5),
    },
  });

  await db.negotiationMessage.createMany({
    data: [
      { id: 'nm1', negotiationId: demoNeg.id, senderRole: 'buyer', senderName: 'Sneha', content: 'I can offer ₹18/kg.', priceSuggested: 18, createdAt: DAYS_AGO(5) },
      { id: 'nm2', negotiationId: demoNeg.id, senderRole: 'ai', senderName: 'FreshLink AI', content: 'Based on the current market range (₹20–28/kg) and the freshness of the produce (harvested 1 day ago), a reasonable negotiation range is ₹20–22/kg. The farmer\'s expected price is ₹24/kg but the freshness is high, giving room for a fair deal.', priceSuggested: null, createdAt: DAYS_AGO(5) },
      { id: 'nm3', negotiationId: demoNeg.id, senderRole: 'farmer', senderName: 'Ravi', content: 'I can do ₹21/kg for 50 kg or more.', priceSuggested: 21, createdAt: DAYS_AGO(5) },
      { id: 'nm4', negotiationId: demoNeg.id, senderRole: 'ai', senderName: 'FreshLink AI', content: '₹21/kg is within the suggested range and represents a good deal for both parties. The price is 12.5% below market average while still covering the farmer\'s costs.', priceSuggested: null, createdAt: DAYS_AGO(5) },
      { id: 'nm5', negotiationId: demoNeg.id, senderRole: 'buyer', senderName: 'Sneha', content: 'I accept ₹21/kg. Let\'s proceed.', priceSuggested: 21, createdAt: DAYS_AGO(5) },
    ],
  });

  console.log('Seeding complete!');
  console.log('Demo accounts:');
  console.log('  Farmer: ravi@freshlink.demo / demo1234');
  console.log('  Buyer:  sneha@freshlink.demo / demo1234');
}

seed().catch(console.error).finally(() => process.exit(0));
