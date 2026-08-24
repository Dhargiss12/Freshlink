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

    const offer = await db.offer.create({
      data: {
        listingId,
        buyerId,
        offerPrice: Number(offerPrice),
      },
      include: {
        buyer: {
          select: { id: true, name: true },
        },
        listing: {
          select: { id: true, crop: true, quantity: true, expectedPrice: true },
        },
      },
    })

    return NextResponse.json({ offer }, { status: 201 })
  } catch (error) {
    console.error('Offers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const buyerId = searchParams.get('buyerId')

    const where: Record<string, unknown> = {}
    if (listingId) where.listingId = listingId
    if (buyerId) where.buyerId = buyerId

    const offers = await db.offer.findMany({
      where,
      include: {
        buyer: {
          select: { id: true, name: true },
        },
        listing: {
          select: { id: true, crop: true, quantity: true, expectedPrice: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Offers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}