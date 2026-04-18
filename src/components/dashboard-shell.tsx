import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getSession } from '@/lib/session'
import { LogOut, LayoutDashboard, ListChecks, Sparkles, UserPlus } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: '案件列表', icon: ListChecks },
  { href: '/dashboard/sales/new', label: '添加業務', icon: UserPlus }
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = getSession()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">LF</div>
            <div>
              <div className="font-semibold text-slate-950">CRM 後台</div>
              <div className="text-xs text-slate-500">案件管理與初審跟進</div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          <Separator className="my-6" />
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">目前登入</div>
            <div className="mt-1 font-semibold text-slate-950">{session?.name ?? '未登入'}</div>
            <Badge variant={session?.role === 'ADMIN' ? 'success' : 'secondary'} className="mt-3">
              {session?.role ?? 'GUEST'}
            </Badge>
          </div>
          <form action="/api/auth/logout" method="post" className="mt-4">
            <Button type="submit" variant="outline" className="w-full justify-center">
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </form>
        </aside>
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
