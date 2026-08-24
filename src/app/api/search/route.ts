import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const query = q.trim()
    const queryPattern = `%${query}%`

    // Search users (name, username)
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        location: true,
        reliabilityScore: true,
      },
      take: 10,
    })

    // Search listings (crop, location, qualityDetails)
    const listings = await db.listing.findMany({
      where: {
        AND: [
          { status: 'active' },
          {
            OR: [
              { crop: { contains: query, mode: 'insensitive' } },
              { location: { contains: query, mode: 'insensitive' } },
              { qualityDetails: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        farmer: {
          select: { id: true, name: true, location: true, reliabilityScore: true },
        },
      },
      take: 20,
    })

    // Remove floorPrice from search results
    const safeListings = listings.map(({ floorPrice, ...rest }) => rest)

    // Get distinct crops using findMany + dedup in JS
    const allMatching = await db.listing.findMany({
      where: { crop: { contains: query, mode: 'insensitive' }, status: 'active' },
      select: { crop: true, expectedPrice: true, id: true },
      take: 100,
    })
    const cropMap = new Map<string, { count: number; totalPrice: number }>()
    for (const l of allMatching) {
      const existing = cropMap.get(l.crop) || { count: 0, totalPrice: 0 }
      cropMap.set(l.crop, { count: existing.count + 1, totalPrice: existing.totalPrice + l.expectedPrice })
    }
    const crops = Array.from(cropMap.entries()).slice(0, 10).map(([crop, data]) => ({
      crop,
      count: data.count,
      avgPrice: Math.round(data.totalPrice / data.count),
    }))

    return NextResponse.json({
      query,
      results: { users, listings: safeListings, crops },
    })
  } catch (error) {
    console.error('Search GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
