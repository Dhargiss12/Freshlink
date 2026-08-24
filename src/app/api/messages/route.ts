import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderId = searchParams.get('senderId')
    const receiverId = searchParams.get('receiverId')

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'senderId and receiverId are required' }, { status: 400 })
    }

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, profileImage: true },
        },
        receiver: {
          select: { id: true, name: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, content, orderRef } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId,
        content,
        orderRef: orderRef || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, profileImage: true },
        },
        receiver: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
