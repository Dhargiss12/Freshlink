import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const crop = searchParams.get('crop')

    const where: Record<string, unknown> = {}
    if (farmerId) where.farmerId = farmerId
    if (crop) where.crop = { contains: crop }

    const discounts = await db.discount.findMany({
      where,
      include: {
        farmer: {
          select: { id: true, name: true, location: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ discounts })
  } catch (error) {
    console.error('Discounts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      farmerId, listingId, crop, discountType, discountValue,
      minQuantity, maxDiscount, validUntil,
    } = body

    if (!farmerId || !crop || !discountType || discountValue == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const discount = await db.discount.create({
      data: {
        farmerId,
        listingId: listingId || null,
        crop,
        discountType,
        discountValue: Number(discountValue),
        minQuantity: minQuantity ? Number(minQuantity) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        status: 'active',
      },
    })

    return NextResponse.json({ discount }, { status: 201 })
  } catch (error) {
    console.error('Discounts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Discount id is required' }, { status: 400 })
    }

    const existing = await db.discount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (status) data.status = status

    const discount = await db.discount.update({
      where: { id },
      data,
    })

    return NextResponse.json({ discount })
  } catch (error) {
    console.error('Discounts PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}