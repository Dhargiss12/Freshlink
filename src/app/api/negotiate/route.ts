import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, buyerId, offerPrice } = body

    if (!listingId || !buyerId || offerPrice == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const listing = await db.listing.findUnique({ where: { id: listingId } })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const farmerId = listing.farmerId
    const buyerOffer = Number(offerPrice)
    const expectedPrice = listing.expectedPrice
    const floorPrice = listing.floorPrice

    // Calculate urgency
    const now = new Date()
    const harvestTime = new Date(listing.harvestDate)
    const timeSinceHarvestMs = now.getTime() - harvestTime.getTime()
    const timeSinceHarvestHours = Math.max(0, timeSinceHarvestMs / (1000 * 60 * 60))
    const shelfLifeHours = listing.shelfLife
    const urgency = Math.min(1, timeSinceHarvestHours / shelfLifeHours)

    let suggestedMin: number
    let suggestedMax: number
    let explanation: string

    if (urgency < 0.3) {
      // Fresh harvest - farmer has leverage
      suggestedMin = Math.max(buyerOffer, floorPrice * 0.95)
      suggestedMax = expectedPrice * 0.95
      explanation =
        'The harvest is fresh and shelf life is long. The farmer has good leverage to hold for a better price. Slight flexibility is available for serious buyers.'
    } else if (urgency <= 0.7) {
      // Moderate urgency
      suggestedMin = Math.max(buyerOffer, floorPrice * 0.9)
      suggestedMax = expectedPrice * 0.88
      explanation =
        'The produce is approaching mid-shelf life. Both parties should consider a moderate compromise to reach an agreement soon. The farmer should consider accepting a lower price to avoid waste.'
    } else {
      // High urgency - perishable
      suggestedMin = Math.max(buyerOffer, floorPrice * 0.85)
      suggestedMax = expectedPrice * 0.8
      explanation =
        'URGENT: The produce is nearing end of shelf life. Strongly recommended to agree on a deal quickly to avoid spoilage. The buyer has significant negotiation advantage.'
    }

    // Ensure suggestedMin <= suggestedMax
    if (suggestedMin > suggestedMax) {
      suggestedMin = suggestedMax * 0.9
    }

    // Check for existing active negotiation
    const existingNeg = await db.negotiation.findFirst({
      where: { listingId, buyerId, status: 'active' },
    })

    if (existingNeg) {
      // Return existing negotiation
      const safeNeg = {
        ...existingNeg,
        listing: {
          id: listing.id,
          crop: listing.crop,
          quantity: listing.quantity,
          expectedPrice: listing.expectedPrice,
          harvestDate: listing.harvestDate,
          shelfLife: listing.shelfLife,
        },
      }
      return NextResponse.json({ negotiation: safeNeg })
    }

    // Create an offer if one doesn't exist yet
    let offerId: string | null = null
    const existingOffer = await db.offer.findFirst({
      where: { listingId, buyerId },
    })

    if (existingOffer) {
      offerId = existingOffer.id
    } else {
      const newOffer = await db.offer.create({
        data: {
          listingId,
          buyerId,
          offerPrice: buyerOffer,
          status: 'negotiating',
        },
      })
      offerId = newOffer.id
    }

    const negotiation = await db.negotiation.create({
      data: {
        listingId,
        buyerId,
        farmerId,
        offerId,
        aiSuggestedMin: Math.round(suggestedMin * 100) / 100,
        aiSuggestedMax: Math.round(suggestedMax * 100) / 100,
        aiExplanation: explanation,
        urgency: Math.round(urgency * 100) / 100,
        timeSinceHarvest: Math.round(timeSinceHarvestHours * 100) / 100,
      },
      include: {
        listing: {
          select: { id: true, crop: true, quantity: true, expectedPrice: true, harvestDate: true, shelfLife: true },
        },
      },
    })

    // NEVER return floorPrice to buyer
    const safeNegotiation = {
      ...negotiation,
      listing: negotiation.listing,
    }

    return NextResponse.json({ negotiation: safeNegotiation }, { status: 201 })
  } catch (error) {
    console.error('Negotiate POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}