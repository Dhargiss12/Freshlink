import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            crop: true,
            quantity: true,
            unit: true,
            location: true,
            qualityDetails: true,
            packagingDetails: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phone: true, email: true, location: true },
        },
        farmer: {
          select: { id: true, name: true, phone: true, email: true, location: true, reliabilityScore: true },
        },
        payment: true,
        delivery: true,
        feedback: true,
        refunds: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order GET error:', error)
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

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.status !== undefined) data.status = body.status
    if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus

    const order = await db.order.update({
      where: { id },
      data,
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
