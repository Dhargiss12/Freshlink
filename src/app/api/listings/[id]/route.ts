import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const listing = await db.listing.findUnique({
      where: { id },
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
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const { floorPrice, ...rest } = listing

    if (userId && listing.farmerId === userId) {
      return NextResponse.json({ listing: { ...rest, floorPrice } })
    }

    return NextResponse.json({ listing: rest })
  } catch (error) {
    console.error('Listing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.listing.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.quantity !== undefined) data.quantity = Number(body.quantity)

    const listing = await db.listing.update({
      where: { id },
      data,
    })

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Listing PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}