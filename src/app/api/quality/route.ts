import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, demo } = body

    if (demo) {
      // Return simulated quality analysis
      const score = Math.round((75 + Math.random() * 20) * 100) / 100
      const freshness = Math.round((70 + Math.random() * 25) * 100) / 100

      return NextResponse.json({
        analysis: {
          score,
          freshness,
          damageIndicators: [
            { type: 'bruising', level: Math.round(Math.random() * 30 * 100) / 100, severity: 'low' },
            { type: 'discoloration', level: Math.round(Math.random() * 15 * 100) / 100, severity: 'negligible' },
            { type: 'moisture', level: Math.round(20 + Math.random() * 40) * 100 / 100, severity: 'moderate' },
          ],
          explanation:
            score > 85
              ? 'Excellent quality produce. Fresh appearance with minimal defects. Suitable for premium market.'
              : score > 70
                ? 'Good quality produce with minor cosmetic issues. Recommended for standard market sale.'
                : 'Moderate quality detected. Consider discounting or quick sale to maintain value.',
          spoilageRisk: freshness > 80 ? 'Low' : freshness > 50 ? 'Medium' : 'High',
          recommendedActions:
            freshness > 80
              ? ['Maintain current storage conditions', 'Premium packaging recommended', 'No immediate action needed']
              : freshness > 50
                ? ['Increase ventilation', 'Consider reduced pricing for faster sale', 'Monitor daily for quality changes']
                : ['Immediate sale recommended', 'Maximum discount suggested', 'Prioritize quick delivery'],
        },
      })
    }

    if (listingId) {
      const listing = await db.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }

      // Simulate quality analysis based on listing data
      const now = new Date()
      const harvestTime = new Date(listing.harvestDate)
      const hoursSinceHarvest = Math.max(0, (now.getTime() - harvestTime.getTime()) / (1000 * 60 * 60))
      const shelfLifeHours = listing.shelfLife * 24
      const ageRatio = hoursSinceHarvest / shelfLifeHours

      const score = Math.round(Math.max(40, 95 - ageRatio * 40 + Math.random() * 10) * 100) / 100
      const freshness = Math.round(Math.max(30, 98 - ageRatio * 50 + Math.random() * 8) * 100) / 100

      const analysis = {
        listingId,
        crop: listing.crop,
        score,
        freshness,
        damageIndicators: [
          { type: 'age_degradation', level: Math.round(ageRatio * 100 * 100) / 100, severity: ageRatio < 0.3 ? 'low' : ageRatio < 0.7 ? 'moderate' : 'high' },
          { type: 'shelf_life_consumed', level: Math.round(ageRatio * 100 * 100) / 100, severity: ageRatio < 0.3 ? 'low' : ageRatio < 0.7 ? 'moderate' : 'high' },
        ],
        explanation:
          score > 85
            ? `${listing.crop} is in excellent condition. Harvested ${Math.round(hoursSinceHarvest)}h ago with ${listing.shelfLife}d shelf life remaining.`
            : score > 70
              ? `${listing.crop} shows good quality with expected age-related changes. ${Math.round((1 - ageRatio) * listing.shelfLife * 24)}h of shelf life remaining.`
              : `${listing.crop} quality is declining. Only ${Math.round((1 - ageRatio) * listing.shelfLife * 24)}h shelf life remaining. Quick sale recommended.`,
        spoilageRisk: ageRatio < 0.3 ? 'Low' : ageRatio < 0.7 ? 'Medium' : 'High',
      }

      // Update listing with quality score
      await db.listing.update({
        where: { id: listingId },
        data: { qualityScore: score, spoilageRisk: analysis.spoilageRisk },
      })

      return NextResponse.json({ analysis })
    }

    return NextResponse.json({ error: 'Provide listingId or demo flag' }, { status: 400 })
  } catch (error) {
    console.error('Quality POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
