import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const crop = searchParams.get('crop')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (farmerId) {
      where.farmerId = farmerId
    }
    if (crop) {
      where.crop = { contains: crop, mode: 'insensitive' as const }
    }
    if (status) {
      where.status = status
    }

    const listings = await db.listing.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            reliabilityScore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const isFarmerRequestingOwn = farmerId !== null

    const safeListings = listings.map((listing) => {
      const { floorPrice, ...rest } = listing
      if (isFarmerRequestingOwn) {
        return { ...rest, floorPrice }
      }
      return rest
    })

    return NextResponse.json({ listings: safeListings })
  } catch (error) {
    console.error('Listings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      farmerId, crop, quantity, harvestDate, shelfLife,
      expectedPrice, floorPrice, location, qualityDetails, packagingDetails,
    } = body

    if (!farmerId || !crop || quantity == null || !harvestDate || !shelfLife || !expectedPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const finalFloorPrice = floorPrice != null ? Number(floorPrice) : Number(expectedPrice) * 0.8

    const listing = await db.listing.create({
      data: {
        farmerId,
        crop,
        quantity: Number(quantity),
        harvestDate: new Date(harvestDate),
        shelfLife: Number(shelfLife),
        expectedPrice: Number(expectedPrice),
        floorPrice: finalFloorPrice,
        location: location || 'Pune, Maharashtra',
        qualityDetails: qualityDetails || null,
        packagingDetails: packagingDetails || null,
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    console.error('Listings POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}