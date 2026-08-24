import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const crop = searchParams.get('crop') || 'Tomato'

    // Demo demand prediction data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()

    // Generate plausible historical data
    const historical: Array<{ month: string; demand: number; price: number }> = []
    const predicted: Array<{ month: string; demand: number; price: number; confidence: number }> = []

    // Historical: last 6 months
    for (let i = 6; i >= 1; i--) {
      const mIdx = (currentMonth - i + 12) % 12
      const baseDemand = 800 + Math.sin(mIdx * 0.5) * 300 + Math.random() * 200
      const basePrice = 25 + Math.sin(mIdx * 0.4) * 10 + Math.random() * 5
      historical.push({
        month: months[mIdx],
        demand: Math.round(baseDemand),
        price: Math.round(basePrice * 100) / 100,
      })
    }

    // Predicted: next 3 months
    for (let i = 1; i <= 3; i++) {
      const mIdx = (currentMonth + i) % 12
      const baseDemand = 800 + Math.sin(mIdx * 0.5) * 300 + Math.random() * 150
      const basePrice = 25 + Math.sin(mIdx * 0.4) * 10 + Math.random() * 5
      predicted.push({
        month: months[mIdx],
        demand: Math.round(baseDemand),
        price: Math.round(basePrice * 100) / 100,
        confidence: Math.round((85 - i * 8 + Math.random() * 5) * 100) / 100,
      })
    }

    // Chart data array
    const chartData = [
      ...historical.map((h) => ({
        month: h.month,
        type: 'historical' as const,
        demand: h.demand,
        price: h.price,
      })),
      ...predicted.map((p) => ({
        month: p.month,
        type: 'predicted' as const,
        demand: p.demand,
        price: p.price,
        confidence: p.confidence,
      })),
    ]

    // Planned supply suggestion
    const planned = predicted.map((p) => ({
      month: p.month,
      suggestedSupply: Math.round(p.demand * 0.75),
      optimalPrice: Math.round(p.price * 1.05 * 100) / 100,
    }))

    return NextResponse.json({
      crop,
      historical,
      predicted,
      planned,
      chartData,
      insight: `${crop} demand is expected to ${predicted[0].demand > historical[historical.length - 1].demand ? 'increase' : 'decrease'} in the coming month. Consider adjusting supply accordingly.`,
    })
  } catch (error) {
    console.error('Demand GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
