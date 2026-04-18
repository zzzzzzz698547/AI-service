import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, CalendarClock, BadgeCheck } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

const items = [
  { key: 'newLeads', label: '今日新進件', icon: CalendarClock },
  { key: 'pendingContacts', label: '待聯繫案件', icon: Users },
  { key: 'highIntent', label: '高意向案件', icon: TrendingUp },
  { key: 'converted', label: '成交案件', icon: BadgeCheck }
] as const

export function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        const value = stats[item.key]
        return (
          <Card key={item.key}>
            <CardHeader className="flex-row items-center justify-between border-b-0 pb-0">
              <CardTitle className="text-sm font-medium text-slate-500">{item.label}</CardTitle>
              <Badge variant="outline">
                <Icon className="h-3.5 w-3.5" />
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-semibold text-slate-950">{value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
