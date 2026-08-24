import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const crop = searchParams.get('crop') || 'Tomato'

    const locations = ['Pune', 'Nashik', 'Satara', 'Ahmednagar', 'Solapur']
    const selectedLocation = locations[Math.floor(Math.random() * locations.length)]

    // Demo weather forecast data
    const forecast = [
      { day: 'Today', temp: 32, humidity: 65, condition: 'Partly Cloudy', rain: 20 },
      { day: 'Tomorrow', temp: 30, humidity: 70, condition: 'Light Rain', rain: 60 },
      { day: 'Day 3', temp: 28, humidity: 80, condition: 'Rainy', rain: 80 },
      { day: 'Day 4', temp: 31, humidity: 60, condition: 'Sunny', rain: 10 },
      { day: 'Day 5', temp: 33, humidity: 55, condition: 'Clear', rain: 5 },
    ]

    // AI farming recommendations based on crop and weather
    const recommendations: Array<{ category: string; suggestion: string; priority: 'high' | 'medium' | 'low' }> = [
      {
        category: 'Harvest Timing',
        suggestion: `With expected rain in the next 2 days, consider harvesting ${crop} before Day 3 to prevent water damage.`,
        priority: 'high',
      },
      {
        category: 'Pricing Strategy',
        suggestion: `Weather conditions may reduce supply from other regions. Consider holding ${crop} for 2-3 days for potential price increase of 8-12%.`,
        priority: 'medium',
      },
      {
        category: 'Storage',
        suggestion: 'Increase ventilation in storage areas due to rising humidity. Monitor for fungal growth.',
        priority: 'high',
      },
      {
        category: 'Transport',
        suggestion: 'Plan transport on Day 4-5 when roads are expected to be clear. Avoid Day 2-3 due to rain forecast.',
        priority: 'medium',
      },
      {
        category: 'Quality',
        suggestion: 'High humidity may accelerate spoilage. Ensure proper packaging with moisture-absorbing materials.',
        priority: 'medium',
      },
    ]

    return NextResponse.json({
      location: selectedLocation,
      crop,
      forecast,
      recommendations,
      summary: `Weather in ${selectedLocation} shows intermittent rain over the next 5 days. Plan ${crop} harvest and logistics accordingly.`,
    })
  } catch (error) {
    console.error('Weather GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
