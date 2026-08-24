import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId, buyerId, farmerId, rating, qualityRating,
      freshnessRating, packagingRating, deliveryRating, comment,
    } = body

    if (!orderId || !buyerId || !farmerId || rating == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing feedback on this order
    const existing = await db.feedback.findUnique({ where: { orderId } })
    if (existing) {
      return NextResponse.json({ error: 'Feedback already submitted for this order' }, { status: 409 })
    }

    const feedback = await db.feedback.create({
      data: {
        orderId,
        buyerId,
        farmerId,
        rating: Number(rating),
        qualityRating: qualityRating ? Number(qualityRating) : null,
        freshnessRating: freshnessRating ? Number(freshnessRating) : null,
        packagingRating: packagingRating ? Number(packagingRating) : null,
        deliveryRating: deliveryRating ? Number(deliveryRating) : null,
        comment: comment || null,
      },
    })

    // Recalculate farmer's reliability score
    const allFeedback = await db.feedback.findMany({
      where: { farmerId },
    })

    if (allFeedback.length > 0) {
      const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length

      const withQuality = allFeedback.filter((f) => f.qualityRating != null)
      const avgQuality = withQuality.length > 0
        ? withQuality.reduce((sum, f) => sum + f.qualityRating!, 0) / withQuality.length
        : avgRating

      const withFreshness = allFeedback.filter((f) => f.freshnessRating != null)
      const avgFreshness = withFreshness.length > 0
        ? withFreshness.reduce((sum, f) => sum + f.freshnessRating!, 0) / withFreshness.length
        : avgRating

      const withPackaging = allFeedback.filter((f) => f.packagingRating != null)
      const avgPackaging = withPackaging.length > 0
        ? withPackaging.reduce((sum, f) => sum + f.packagingRating!, 0) / withPackaging.length
        : avgRating

      const withDelivery = allFeedback.filter((f) => f.deliveryRating != null)
      const avgDelivery = withDelivery.length > 0
        ? withDelivery.reduce((sum, f) => sum + f.deliveryRating!, 0) / withDelivery.length
        : avgRating

      // Reliability = average of (avgRating, quality, freshness, packaging, delivery) * 20, capped at 100
      const reliabilityScore = Math.min(
        100,
        ((avgRating + avgQuality + avgFreshness + avgPackaging + avgDelivery) / 5) * 20
      )

      await db.user.update({
        where: { id: farmerId },
        data: { reliabilityScore: Math.round(reliabilityScore * 100) / 100 },
      })
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error('Feedback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')

    if (!farmerId) {
      return NextResponse.json({ error: 'farmerId is required' }, { status: 400 })
    }

    const feedback = await db.feedback.findMany({
      where: { farmerId },
      include: {
        buyer: {
          select: { id: true, name: true },
        },
        order: {
          select: { id: true, totalAmount: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
