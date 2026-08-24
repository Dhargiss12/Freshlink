import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding FreshLink database...')

  // Create Farmer User
  const farmerPassword = await bcrypt.hash('password123', 10)
  const farmer = await db.user.upsert({
    where: { username: 'rajesh_farm' },
    update: {},
    create: {
      name: 'Rajesh Patil',
      age: 42,
      username: 'rajesh_farm',
      phone: '+91 98765 43210',
      email: 'rajesh@freshlink.demo',
      password: farmerPassword,
      role: 'farmer',
      location: 'Pune, Maharashtra',
      language: 'English',
      reliabilityScore: 92.5,
    },
  })
  console.log(`  ✅ Farmer created: ${farmer.name} (${farmer.id})`)

  // Create Buyer User
  const buyerPassword = await bcrypt.hash('password123', 10)
  const buyer = await db.user.upsert({
    where: { username: 'amit_buy' },
    update: {},
    create: {
      name: 'Amit Deshmukh',
      age: 35,
      username: 'amit_buy',
      phone: '+91 91234 56789',
      email: 'amit@freshlink.demo',
      password: buyerPassword,
      role: 'buyer',
      location: 'Pune, Maharashtra',
      language: 'English',
    },
  })
  console.log(`  ✅ Buyer created: ${buyer.name} (${buyer.id})`)

  // Create Farmer 2
  const farmer2Password = await bcrypt.hash('password123', 10)
  const farmer2 = await db.user.upsert({
    where: { username: 'sunita_farm' },
    update: {},
    create: {
      name: 'Sunita Devi',
      age: 38,
      username: 'sunita_farm',
      phone: '+91 97654 32100',
      email: 'sunita@freshlink.demo',
      password: farmer2Password,
      role: 'farmer',
      location: 'Nashik, Maharashtra',
      language: 'Hindi',
      reliabilityScore: 88.0,
    },
  })
  console.log(`  ✅ Farmer 2 created: ${farmer2.name} (${farmer2.id})`)

  // Create Farmer 3
  const farmer3Password = await bcrypt.hash('password123', 10)
  const farmer3 = await db.user.upsert({
    where: { username: 'arun_farm' },
    update: {},
    create: {
      name: 'Arun Sharma',
      age: 45,
      username: 'arun_farm',
      phone: '+91 96543 21000',
      email: 'arun@freshlink.demo',
      password: farmer3Password,
      role: 'farmer',
      location: 'Satara, Maharashtra',
      language: 'Marathi',
      reliabilityScore: 95.2,
    },
  })
  console.log(`  ✅ Farmer 3 created: ${farmer3.name} (${farmer3.id})`)

  // Create Listings for Farmer 1 (Rajesh)
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const listing1 = await db.listing.create({
    data: {
      farmerId: farmer.id,
      crop: 'Tomato',
      quantity: 150,
      unit: 'kg',
      location: 'Pune, Maharashtra',
      harvestDate: yesterday,
      shelfLife: 72,
      expectedPrice: 32,
      floorPrice: 25,
      qualityDetails: 'Grade A, fresh from farm, organically grown',
      packagingDetails: 'Packed in ventilated crates, 10kg per crate',
      qualityScore: 88,
      spoilageRisk: 'Low',
      status: 'active',
      region: 'Pune, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing1.crop} ${listing1.quantity}kg @ ₹${listing1.expectedPrice}/kg`)

  const listing2 = await db.listing.create({
    data: {
      farmerId: farmer.id,
      crop: 'Onion',
      quantity: 200,
      unit: 'kg',
      location: 'Pune, Maharashtra',
      harvestDate: twoDaysAgo,
      shelfLife: 168,
      expectedPrice: 22,
      floorPrice: 18,
      qualityDetails: 'Medium size, good quality, Nashik variety',
      packagingDetails: '50kg jute bags',
      qualityScore: 82,
      spoilageRisk: 'Low',
      status: 'active',
      region: 'Pune, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing2.crop} ${listing2.quantity}kg @ ₹${listing2.expectedPrice}/kg`)

  const listing3 = await db.listing.create({
    data: {
      farmerId: farmer.id,
      crop: 'Potato',
      quantity: 300,
      unit: 'kg',
      location: 'Pune, Maharashtra',
      harvestDate: yesterday,
      shelfLife: 240,
      expectedPrice: 18,
      floorPrice: 14,
      qualityDetails: 'Fresh harvest, clean and sorted',
      packagingDetails: '30kg mesh bags',
      qualityScore: 90,
      spoilageRisk: 'Low',
      status: 'active',
      region: 'Pune, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing3.crop} ${listing3.quantity}kg @ ₹${listing3.expectedPrice}/kg`)

  // Create Listings for Farmer 2 (Sunita)
  const listing4 = await db.listing.create({
    data: {
      farmerId: farmer2.id,
      crop: 'Grapes',
      quantity: 80,
      unit: 'kg',
      location: 'Nashik, Maharashtra',
      harvestDate: yesterday,
      shelfLife: 120,
      expectedPrice: 65,
      floorPrice: 50,
      qualityDetails: 'Thompson seedless, export quality',
      packagingDetails: '5kg carton boxes',
      qualityScore: 95,
      spoilageRisk: 'Medium',
      status: 'active',
      region: 'Nashik, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing4.crop} ${listing4.quantity}kg @ ₹${listing4.expectedPrice}/kg`)

  const listing5 = await db.listing.create({
    data: {
      farmerId: farmer2.id,
      crop: 'Banana',
      quantity: 120,
      unit: 'kg',
      location: 'Nashik, Maharashtra',
      harvestDate: twoDaysAgo,
      shelfLife: 96,
      expectedPrice: 35,
      floorPrice: 28,
      qualityDetails: 'Ripe and ready, Yelakki variety',
      packagingDetails: '15kg cardboard boxes',
      qualityScore: 85,
      spoilageRisk: 'Medium',
      status: 'active',
      region: 'Nashik, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing5.crop} ${listing5.quantity}kg @ ₹${listing5.expectedPrice}/kg`)

  // Create Listings for Farmer 3 (Arun)
  const listing6 = await db.listing.create({
    data: {
      farmerId: farmer3.id,
      crop: 'Spinach',
      quantity: 50,
      unit: 'kg',
      location: 'Satara, Maharashtra',
      harvestDate: yesterday,
      shelfLife: 48,
      expectedPrice: 15,
      floorPrice: 10,
      qualityDetails: 'Fresh green, hand-picked, no pesticides',
      packagingDetails: '2kg bundles',
      qualityScore: 92,
      spoilageRisk: 'High',
      status: 'active',
      region: 'Satara, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing6.crop} ${listing6.quantity}kg @ ₹${listing6.expectedPrice}/kg`)

  const listing7 = await db.listing.create({
    data: {
      farmerId: farmer3.id,
      crop: 'Coriander',
      quantity: 30,
      unit: 'kg',
      location: 'Satara, Maharashtra',
      harvestDate: now,
      shelfLife: 48,
      expectedPrice: 12,
      floorPrice: 8,
      qualityDetails: 'Aromatic, fresh cut, green stems',
      packagingDetails: '1kg bunches',
      qualityScore: 88,
      spoilageRisk: 'High',
      status: 'active',
      region: 'Satara, Maharashtra',
    },
  })
  console.log(`  ✅ Listing: ${listing7.crop} ${listing7.quantity}kg @ ₹${listing7.expectedPrice}/kg`)

  // Create an Order (completed)
  const order1 = await db.order.create({
    data: {
      listingId: listing1.id,
      buyerId: buyer.id,
      farmerId: farmer.id,
      agreedPrice: 30,
      quantity: 50,
      totalAmount: 1500,
      status: 'delivered',
      paymentStatus: 'completed',
      deliveryMethod: 'delivery',
    },
  })
  console.log(`  ✅ Order: ${order1.id} - Tomato 50kg @ ₹30 = ₹1500 (delivered)`)

  // Create Payment for order 1
  await db.payment.create({
    data: {
      orderId: order1.id,
      userId: buyer.id,
      amount: 1500,
      paymentMethod: 'upi',
      paymentStatus: 'completed',
      transactionRef: 'UPI_TXN_001',
    },
  })

  // Create Delivery for order 1
  await db.delivery.create({
    data: {
      orderId: order1.id,
      partner: 'FreshLink Express',
      status: 'delivered',
    },
  })

  // Create Feedback for order 1
  await db.feedback.create({
    data: {
      orderId: order1.id,
      buyerId: buyer.id,
      farmerId: farmer.id,
      rating: 4.5,
      qualityRating: 4.5,
      freshnessRating: 5,
      packagingRating: 4,
      deliveryRating: 4.5,
      comment: 'Excellent quality tomatoes! Very fresh and well-packed.',
    },
  })

  // Create Order 2 (in transit)
  const order2 = await db.order.create({
    data: {
      listingId: listing2.id,
      buyerId: buyer.id,
      farmerId: farmer.id,
      agreedPrice: 20,
      quantity: 100,
      totalAmount: 2000,
      status: 'in_transit',
      paymentStatus: 'completed',
      deliveryMethod: 'delivery',
    },
  })
  console.log(`  ✅ Order: ${order2.id} - Onion 100kg @ ₹20 = ₹2000 (in_transit)`)

  await db.payment.create({
    data: {
      orderId: order2.id,
      userId: buyer.id,
      amount: 2000,
      paymentMethod: 'card',
      paymentStatus: 'completed',
      transactionRef: 'CARD_TXN_002',
    },
  })

  await db.delivery.create({
    data: {
      orderId: order2.id,
      partner: 'FreshLink Express',
      status: 'in_transit',
      currentLocation: 'Pune - Shivajinagar Hub',
      estimatedArrival: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    },
  })

  // Create Order 3 (confirmed/preparing)
  const order3 = await db.order.create({
    data: {
      listingId: listing4.id,
      buyerId: buyer.id,
      farmerId: farmer2.id,
      agreedPrice: 60,
      quantity: 20,
      totalAmount: 1200,
      status: 'confirmed',
      paymentStatus: 'pending',
      deliveryMethod: 'delivery',
    },
  })
  console.log(`  ✅ Order: ${order3.id} - Grapes 20kg @ ₹60 = ₹1200 (confirmed)`)

  // Create Discounts
  await db.discount.create({
    data: {
      farmerId: farmer.id,
      listingId: listing1.id,
      crop: 'Tomato',
      discountType: 'percentage',
      discountValue: 10,
      minQuantity: 20,
      status: 'active',
    },
  })
  console.log(`  ✅ Discount: Tomato 10% off (min 20kg)`)

  await db.discount.create({
    data: {
      farmerId: farmer2.id,
      listingId: listing4.id,
      crop: 'Grapes',
      discountType: 'fixed',
      discountValue: 5,
      minQuantity: 10,
      status: 'active',
    },
  })
  console.log(`  ✅ Discount: Grapes ₹5 off (min 10kg)`)

  // Create Notifications for Farmer
  await db.notification.create({
    data: {
      userId: farmer.id,
      title: 'New Order Received',
      message: 'Amit Deshmukh placed an order for 100kg Onion',
      type: 'order',
      read: false,
      relatedId: order2.id,
    },
  })
  await db.notification.create({
    data: {
      userId: farmer.id,
      title: 'Feedback Received',
      message: 'You received 4.5★ rating for your Tomato delivery',
      type: 'feedback',
      read: true,
      relatedId: order1.id,
    },
  })
  await db.notification.create({
    data: {
      userId: farmer.id,
      title: 'Price Alert: Tomato',
      message: 'Market price for Tomato has increased by 8% in your region',
      type: 'info',
      read: false,
    },
  })

  // Create Notifications for Buyer
  await db.notification.create({
    data: {
      userId: buyer.id,
      title: 'Order In Transit',
      message: 'Your Onion order (100kg) is on the way!',
      type: 'order',
      read: false,
      relatedId: order2.id,
    },
  })
  await db.notification.create({
    data: {
      userId: buyer.id,
      title: 'Fresh Deal Available',
      message: 'Rajesh Patil is offering 10% off on fresh Tomatoes',
      type: 'info',
      read: false,
    },
  })

  console.log('\n✨ Seeding complete!')
  console.log('---')
  console.log('Farmer login: username=rajesh_farm  password=password123')
  console.log('Buyer login:  username=amit_buy     password=password123')
  console.log('Farmer 2:     username=sunita_farm  password=password123')
  console.log('Farmer 3:     username=arun_farm    password=password123')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
