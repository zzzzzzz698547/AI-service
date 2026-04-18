'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@loanflow.tw')
  const [password, setPassword] = useState('admin1234')
  const [role, setRole] = useState<'ADMIN' | 'SALES'>('ADMIN')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })

      if (!response.ok) {
        throw new Error('登入失敗')
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('帳號、密碼或角色不正確。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(31,143,138,0.14),transparent_40%),linear-gradient(180deg,#f8fafc,white)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LockKeyhole className="h-5 w-5 text-brand-600" />
            後台登入
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role">角色</Label>
              <Select id="role" value={role} onChange={(event) => setRole(event.target.value as 'ADMIN' | 'SALES')}>
                <option value="ADMIN">Admin</option>
                <option value="SALES">Sales</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">密碼</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <Button type="submit" variant="brand" className="w-full" disabled={loading}>
              {loading ? '登入中...' : '登入'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              測試帳號：
              <br />
              Admin: admin@loanflow.tw / admin1234
              <br />
              Sales: sales@loanflow.tw / sales1234
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
