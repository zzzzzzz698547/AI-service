import { NextResponse } from 'next/server'
import { createSalesUser } from '@/lib/store'
import { loginSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginSchema.safeParse({
    email: body.email,
    password: body.password,
    role: 'SALES'
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (typeof body.name !== 'string' || body.name.trim().length < 2) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  try {
    const user = createSalesUser({
      name: body.name.trim(),
      email: parsed.data.email,
      password: parsed.data.password
    })

    return NextResponse.json({ ok: true, user })
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_EXISTS') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
