import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const validStatuses = ['under_review', 'approved', 'rejected', 'refunded']

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.refund.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 })
    }

    const refund = await db.refund.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ refund })
  } catch (error) {
    console.error('Refund PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
