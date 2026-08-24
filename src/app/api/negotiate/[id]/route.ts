import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const negotiation = await db.negotiation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        listing: {
          select: {
            id: true,
            crop: true,
            quantity: true,
            expectedPrice: true,
            harvestDate: true,
            shelfLife: true,
            floorPrice: true, // needed internally for recalculation
          },
        },
      },
    })

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 })
    }

    // Check who is requesting via query param
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isFarmer = userId === negotiation.farmerId

    // NEVER expose floorPrice to buyer
    const safeListing = isFarmer
      ? negotiation.listing
      : (() => {
          const { floorPrice: _, ...rest } = negotiation.listing
          return rest
        })()

    return NextResponse.json({
      negotiation: {
        ...negotiation,
        listing: safeListing,
      },
    })
  } catch (error) {
    console.error('Negotiation GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    const negotiation = await db.negotiation.findUnique({
      where: { id },
      include: {
        listing: true,
        messages: true,
      },
    })

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 })
    }

    if (action === 'counter') {
      const { role, price, message } = body

      if (!role || price == null) {
        return NextResponse.json({ error: 'Role and price are required' }, { status: 400 })
      }

      const counterPrice = Number(price)

      // Recalculate AI suggestion based on new urgency
      const now = new Date()
      const harvestTime = new Date(negotiation.listing.harvestDate)
      const timeSinceHarvestMs = now.getTime() - harvestTime.getTime()
      const timeSinceHarvestHours = Math.max(0, timeSinceHarvestMs / (1000 * 60 * 60))
      const shelfLifeHours = negotiation.listing.shelfLife
      const urgency = Math.min(1, timeSinceHarvestHours / shelfLifeHours)

      const floorPrice = negotiation.listing.floorPrice
      const expectedPrice = negotiation.listing.expectedPrice

      let suggestedMin: number
      let suggestedMax: number
      let explanation: string

      if (urgency < 0.3) {
        suggestedMin = Math.max(counterPrice, floorPrice * 0.95)
        suggestedMax = expectedPrice * 0.95
        explanation = 'Fresh produce - slight negotiation room available. The counter offer is within a reasonable range.'
      } else if (urgency <= 0.7) {
        suggestedMin = Math.max(counterPrice, floorPrice * 0.9)
        suggestedMax = expectedPrice * 0.88
        explanation = 'Mid-shelf life - moderate compromise recommended for both parties.'
      } else {
        suggestedMin = Math.max(counterPrice, floorPrice * 0.85)
        suggestedMax = expectedPrice * 0.8
        explanation = 'URGENT: Approaching end of shelf life. Strongly recommend agreement to avoid spoilage losses.'
      }

      if (suggestedMin > suggestedMax) {
        suggestedMin = suggestedMax * 0.9
      }

      // Add counter message
      await db.negotiationMessage.create({
        data: {
          negotiationId: id,
          senderRole: role,
          senderName: role === 'farmer' ? 'Farmer' : 'Buyer',
          content: message || `Counter offer: ₹${counterPrice} per unit`,
          priceSuggested: counterPrice,
        },
      })

      // Update negotiation with new AI suggestion
      const updated = await db.negotiation.update({
        where: { id },
        data: {
          aiSuggestedMin: Math.round(suggestedMin * 100) / 100,
          aiSuggestedMax: Math.round(suggestedMax * 100) / 100,
          aiExplanation: explanation,
          urgency: Math.round(urgency * 100) / 100,
          timeSinceHarvest: Math.round(timeSinceHarvestHours * 100) / 100,
        },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
        },
      })

      // NEVER expose floorPrice
      const safeListing = {
        id: negotiation.listing.id,
        crop: negotiation.listing.crop,
        quantity: negotiation.listing.quantity,
        expectedPrice: negotiation.listing.expectedPrice,
        harvestDate: negotiation.listing.harvestDate,
        shelfLife: negotiation.listing.shelfLife,
      }

      return NextResponse.json({ negotiation: { ...updated, listing: safeListing } })
    }

    if (action === 'accept') {
      const { role } = body

      if (!role) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 })
      }

      // Use the last priceSuggested or AI suggested mid-point
      const lastMessage = await db.negotiationMessage.findFirst({
        where: { negotiationId: id, priceSuggested: { not: null } },
        orderBy: { createdAt: 'desc' },
      })

      const finalPrice = lastMessage
        ? lastMessage.priceSuggested!
        : (negotiation.aiSuggestedMin + negotiation.aiSuggestedMax) / 2

      const roundedFinalPrice = Math.round(finalPrice * 100) / 100

      // Update negotiation
      const updatedNegotiation = await db.negotiation.update({
        where: { id },
        data: {
          finalPrice: roundedFinalPrice,
          status: 'agreed',
          completedAt: new Date(),
        },
      })

      // Create Order
      const order = await db.order.create({
        data: {
          listingId: negotiation.listingId,
          buyerId: negotiation.buyerId,
          farmerId: negotiation.farmerId,
          agreedPrice: roundedFinalPrice,
          quantity: negotiation.listing.quantity,
          totalAmount: Math.round(roundedFinalPrice * negotiation.listing.quantity * 100) / 100,
          status: 'confirmed',
          paymentStatus: 'pending',
        },
      })

      // Update listing status
      await db.listing.update({
        where: { id: negotiation.listingId },
        data: { status: 'sold' },
      })

      return NextResponse.json({ negotiation: updatedNegotiation, order })
    }

    if (action === 'reject') {
      const { role } = body

      await db.negotiationMessage.create({
        data: {
          negotiationId: id,
          senderRole: role || 'unknown',
          senderName: role === 'farmer' ? 'Farmer' : 'Buyer',
          content: 'Negotiation rejected.',
        },
      })

      const updated = await db.negotiation.update({
        where: { id },
        data: { status: 'rejected', completedAt: new Date() },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })

      return NextResponse.json({ negotiation: updated })
    }

    if (action === 'message') {
      const { role, senderName, content, priceSuggested } = body

      if (!role || !content) {
        return NextResponse.json({ error: 'Role and content are required' }, { status: 400 })
      }

      const msg = await db.negotiationMessage.create({
        data: {
          negotiationId: id,
          senderRole: role,
          senderName: senderName || role,
          content,
          priceSuggested: priceSuggested ? Number(priceSuggested) : null,
        },
      })

      return NextResponse.json({ message: msg })
    }

    return NextResponse.json({ error: 'Invalid action. Use: counter, accept, reject, or message' }, { status: 400 })
  } catch (error) {
    console.error('Negotiation POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
