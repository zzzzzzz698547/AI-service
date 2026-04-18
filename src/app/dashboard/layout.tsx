import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/session'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSession()
  if (!session) {
    redirect('/login')
  }

  return <DashboardShell>{children}</DashboardShell>
}
