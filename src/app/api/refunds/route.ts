import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, buyerId, reason, description } = body

    if (!orderId || !buyerId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const refund = await db.refund.create({
      data: {
        orderId,
        buyerId,
        reason,
        description: description || null,
        amount: order.totalAmount,
      },
    })

    return NextResponse.json({ refund }, { status: 201 })
  } catch (error) {
    console.error('Refund POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    const farmerId = searchParams.get('farmerId')

    const where: Record<string, unknown> = {}
    if (buyerId) where.buyerId = buyerId
    if (farmerId) {
      // For farmer queries, find orders by this farmer
      const orders = await db.order.findMany({
        where: { farmerId },
        select: { id: true },
      })
      where.orderId = { in: orders.map((o) => o.id) }
    }

    const refunds = await db.refund.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            listing: {
              select: { crop: true, quantity: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ refunds })
  } catch (error) {
    console.error('Refund GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}