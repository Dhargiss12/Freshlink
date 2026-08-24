import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, userId, paymentMethod } = body

    if (!orderId || !userId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const transactionRef = `FL-${crypto.randomBytes(8).toString('hex').toUpperCase()}`

    // Create payment record
    const payment = await db.payment.create({
      data: {
        orderId,
        userId,
        amount: order.totalAmount,
        paymentMethod,
        paymentStatus: 'completed',
        transactionRef,
      },
    })

    // Update order payment status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid' },
    })

    // Create delivery record
    await db.delivery.create({
      data: {
        orderId,
        partner: 'FreshLink Express',
        status: 'confirmed',
        estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
    })

    return NextResponse.json({ payment, order: updatedOrder })
  } catch (error) {
    console.error('Payment POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const payments = await db.payment.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            listing: {
              select: { crop: true, quantity: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payment GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
