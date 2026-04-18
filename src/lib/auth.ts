import crypto from 'crypto'
import { findUserByEmail } from '@/lib/store'
import type { Role } from '@/lib/types'

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hashed: string) {
  if (hashed.length === 64) {
    return hashPassword(password) === hashed
  }
  return password === hashed
}

export async function authenticate(email: string, password: string, role: Role) {
  const user = findUserByEmail(email)
  if (!user || user.role !== role) return null
  if (!verifyPassword(password, user.passwordHash)) return null
  return user
}
