import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')

    if (!farmerId) {
      return NextResponse.json({ error: 'farmerId is required' }, { status: 400 })
    }

    const farmer = await db.user.findUnique({
      where: { id: farmerId },
      select: { id: true, name: true, reliabilityScore: true },
    })

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

    const feedback = await db.feedback.findMany({
      where: { farmerId },
    })

    if (feedback.length === 0) {
      return NextResponse.json({
        farmerId,
        farmerName: farmer.name,
        overallScore: 0,
        totalReviews: 0,
        breakdown: {
          overall: { score: 0, label: 'Overall Rating', reviews: 0 },
          quality: { score: 0, label: 'Product Quality', reviews: 0 },
          freshness: { score: 0, label: 'Freshness', reviews: 0 },
          packaging: { score: 0, label: 'Packaging', reviews: 0 },
          delivery: { score: 0, label: 'Delivery Experience', reviews: 0 },
        },
      })
    }

    const avgRating = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length

    const withQuality = feedback.filter((f) => f.qualityRating != null)
    const avgQuality = withQuality.length > 0
      ? withQuality.reduce((s, f) => s + f.qualityRating!, 0) / withQuality.length
      : avgRating

    const withFreshness = feedback.filter((f) => f.freshnessRating != null)
    const avgFreshness = withFreshness.length > 0
      ? withFreshness.reduce((s, f) => s + f.freshnessRating!, 0) / withFreshness.length
      : avgRating

    const withPackaging = feedback.filter((f) => f.packagingRating != null)
    const avgPackaging = withPackaging.length > 0
      ? withPackaging.reduce((s, f) => s + f.packagingRating!, 0) / withPackaging.length
      : avgRating

    const withDelivery = feedback.filter((f) => f.deliveryRating != null)
    const avgDelivery = withDelivery.length > 0
      ? withDelivery.reduce((s, f) => s + f.deliveryRating!, 0) / withDelivery.length
      : avgRating

    return NextResponse.json({
      farmerId,
      farmerName: farmer.name,
      overallScore: farmer.reliabilityScore || 0,
      totalReviews: feedback.length,
      breakdown: {
        overall: {
          score: Math.round(avgRating * 100) / 100,
          label: 'Overall Rating',
          reviews: feedback.length,
        },
        quality: {
          score: Math.round(avgQuality * 100) / 100,
          label: 'Product Quality',
          reviews: withQuality.length,
        },
        freshness: {
          score: Math.round(avgFreshness * 100) / 100,
          label: 'Freshness',
          reviews: withFreshness.length,
        },
        packaging: {
          score: Math.round(avgPackaging * 100) / 100,
          label: 'Packaging',
          reviews: withPackaging.length,
        },
        delivery: {
          score: Math.round(avgDelivery * 100) / 100,
          label: 'Delivery Experience',
          reviews: withDelivery.length,
        },
      },
    })
  } catch (error) {
    console.error('Reliability GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
