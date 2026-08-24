import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    const targetRole = searchParams.get('targetRole') || 'farmers'

    if (!buyerId) {
      return NextResponse.json({ error: 'buyerId is required' }, { status: 400 })
    }

    const buyer = await db.user.findUnique({
      where: { id: buyerId },
      select: { id: true, location: true },
    })

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get buyer's order history to understand preferences
    const orderHistory = await db.order.findMany({
      where: { buyerId },
      select: { listing: { select: { crop: true } } },
    })

    const preferredCrops = orderHistory.map((o) => o.listing.crop)
    const uniqueCrops = [...new Set(preferredCrops)]

    if (targetRole === 'buyers') {
      // Recommend buyers for farmers - not applicable from buyer's perspective
      // but we return it for completeness
      const recentBuyers = await db.order.groupBy({
        by: ['buyerId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      })

      const buyers = await db.user.findMany({
        where: { id: { in: recentBuyers.map((b) => b.buyerId) } },
        select: { id: true, name: true, location: true },
      })

      return NextResponse.json({
        targetRole,
        recommendations: buyers.map((b) => ({
          ...b,
          reason: 'Active buyer with recent orders',
          orderCount: recentBuyers.find((rb) => rb.buyerId === b.id)?._count?.id || 0,
        })),
      })
    }

    // Default: recommend farmers for buyers
    const where: Record<string, unknown> = {
      role: 'farmer',
    }

    // If buyer has preferred crops, recommend farmers who sell those crops
    if (uniqueCrops.length > 0) {
      where.listings = {
        some: {
          crop: { in: uniqueCrops },
          status: 'active',
        },
      }
    }

    const farmers = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        location: true,
        reliabilityScore: true,
        listings: {
          where: { status: 'active' },
          select: { id: true, crop: true, expectedPrice: true, quantity: true },
          take: 3,
        },
        _count: {
          select: { feedbackReceived: true },
        },
      },
      take: 10,
      orderBy: { reliabilityScore: 'desc' },
    })

    const recommendations = farmers.map((farmer) => ({
      ...farmer,
      reason: uniqueCrops.includes(farmer.listings[0]?.crop)
        ? `Matches your interest in ${farmer.listings[0].crop}`
        : 'Top-rated farmer near you',
      matchScore: Math.round(
        (farmer.reliabilityScore || 50) * 0.4 +
        (farmer._count.feedbackReceived > 0 ? 30 : 0) +
        (uniqueCrops.includes(farmer.listings[0]?.crop) ? 30 : 0)
      ),
    }))

    // Sort by match score
    recommendations.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    return NextResponse.json({
      targetRole,
      recommendations,
    })
  } catch (error) {
    console.error('Recommendations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}