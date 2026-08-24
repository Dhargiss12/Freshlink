import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const userSelect = {
  id: true,
  name: true,
  age: true,
  username: true,
  phone: true,
  email: true,
  role: true,
  location: true,
  language: true,
  idProofRef: true,
  profileImage: true,
  reliabilityScore: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'signup') {
      const { name, age, username, phone, email, password, role, location, language } = body

      if (!username || !email || !password) {
        return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 })
      }

      const existingUser = await db.user.findFirst({
        where: { OR: [{ username }, { email }] },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await db.user.create({
        data: {
          name: name || '',
          age: age || 0,
          username,
          phone: phone || '',
          email,
          password: hashedPassword,
          role: role || 'buyer',
          location: location || 'Pune, Maharashtra',
          language: language || 'English',
        },
        select: userSelect,
      })

      return NextResponse.json({ user }, { status: 201 })
    }

    if (action === 'login') {
      const { email, username, password } = body
      const identifier = email || username

      if (!identifier || !password) {
        return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 })
      }

      const user = await db.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] },
      })

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, user.password)

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const { password: _, ...safeUser } = user

      return NextResponse.json({ user: safeUser })
    }

    return NextResponse.json({ error: 'Invalid action. Use "signup" or "login"' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, phone, location, language } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (location !== undefined) data.location = location
    if (language !== undefined) data.language = language

    const user = await db.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}