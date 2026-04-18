import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { Role } from '@/lib/types'

const COOKIE_NAME = 'loan_session'

type SessionPayload = {
  userId: string
  email: string
  role: Role
  name: string
}

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-me'
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function encodeSession(payload: SessionPayload) {
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${raw}.${sign(raw)}`
}

function decodeSession(value: string): SessionPayload | null {
  const [raw, signature] = value.split('.')
  if (!raw || !signature) return null
  if (sign(raw) !== signature) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as SessionPayload
  } catch {
    return null
  }
}

export function setSessionCookie(payload: SessionPayload) {
  cookies().set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
}

export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export function requireSession() {
  const session = getSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

export function makeSessionPayload(payload: SessionPayload) {
  return encodeSession(payload)
}
