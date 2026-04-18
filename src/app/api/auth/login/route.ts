import { NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { makeSessionPayload, setSessionCookie } from '@/lib/session'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid login payload' }, { status: 400 })
  }

  const user = await authenticate(parsed.data.email, parsed.data.password, parsed.data.role)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = makeSessionPayload({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  })

  setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  })

  return NextResponse.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}
