import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const buyerId = searchParams.get('buyerId')

    const where: Record<string, unknown> = {}
    if (farmerId) where.farmerId = farmerId
    if (buyerId) where.buyerId = buyerId

    const orders = await db.order.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            crop: true,
            quantity: true,
            location: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phone: true, email: true, location: true },
        },
        farmer: {
          select: { id: true, name: true, phone: true, location: true },
        },
        payment: true,
        delivery: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Remove password if present in any included user
    const safeOrders = orders.map((order) => ({
      ...order,
      buyer: { id: order.buyer.id, name: order.buyer.name, phone: order.buyer.phone, email: order.buyer.email, location: order.buyer.location },
      farmer: { id: order.farmer.id, name: order.farmer.name, phone: order.farmer.phone, location: order.farmer.location },
    }))

    return NextResponse.json({ orders: safeOrders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, buyerId, farmerId, agreedPrice, quantity, deliveryMethod } = body

    if (!listingId || !buyerId || !farmerId || !agreedPrice || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const totalAmount = Number(agreedPrice) * Number(quantity)

    const order = await db.order.create({
      data: {
        listingId,
        buyerId,
        farmerId,
        agreedPrice: Number(agreedPrice),
        quantity: Number(quantity),
        totalAmount,
        status: 'confirmed',
        paymentStatus: 'pending',
        deliveryMethod: deliveryMethod || 'standard',
      },
      include: {
        listing: { select: { crop: true, quantity: true, location: true } },
        buyer: { select: { id: true, name: true, phone: true, email: true, location: true } },
        farmer: { select: { id: true, name: true, phone: true, location: true } },
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}