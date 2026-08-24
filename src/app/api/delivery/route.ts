import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const delivery = await db.delivery.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            listing: {
              select: { crop: true, quantity: true, location: true },
            },
            buyer: {
              select: { id: true, name: true, phone: true, location: true },
            },
            farmer: {
              select: { id: true, name: true, phone: true, location: true },
            },
          },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    return NextResponse.json({ delivery })
  } catch (error) {
    console.error('Delivery GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, currentLocation, estimatedArrival } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const existing = await db.delivery.findUnique({ where: { orderId } })
    if (!existing) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (currentLocation) data.currentLocation = currentLocation
    if (estimatedArrival) data.estimatedArrival = new Date(estimatedArrival)

    const delivery = await db.delivery.update({
      where: { orderId },
      data,
    })

    return NextResponse.json({ delivery })
  } catch (error) {
    console.error('Delivery PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
