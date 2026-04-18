'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddSalesForm({ canEdit }: { canEdit: boolean }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/users/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? '新增失敗')
      }

      setMessage('業務帳號已建立。')
      setName('')
      setEmail('')
      setPassword('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '新增失敗')
    } finally {
      setLoading(false)
    }
  }

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-5 w-5 text-brand-600" />
            添加業務
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">這個功能僅限 Admin 使用。</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <UserPlus className="h-5 w-5 text-brand-600" />
          添加業務
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
          <div>
            <Label htmlFor="name">姓名</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="王小明" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sales@loanflow.tw" />
          </div>
          <div>
            <Label htmlFor="password">密碼</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 碼" />
          </div>
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          <div>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? '新增中...' : '新增業務'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
