import Link from 'next/link'
import { ArrowRight, Clock3, Flame, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStatsGrid } from '@/components/dashboard-stats'
import { getDashboardStats, listLeads } from '@/lib/store'
import { formatDateTime } from '@/lib/utils'

export default function DashboardPage() {
  const stats = getDashboardStats()
  const leads = listLeads().slice(0, 6)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">案件總覽</h1>
          <p className="mt-2 text-sm text-slate-500">快速掌握今天的進件、待聯繫與高意向案件。</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads">
            <Button variant="brand">
              查看全部案件
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <DashboardStatsGrid stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>最新案件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-950">{lead.fullName}</div>
                    <div className="mt-1 text-sm text-slate-500">{lead.primaryRecommendation} · {lead.phone}</div>
                  </div>
                  <Badge variant={lead.needManualReview ? 'warning' : 'success'}>{lead.riskLevel}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDateTime(lead.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />分數 {lead.score}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>營運提示</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-brand-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
                <Flame className="h-4 w-4" />
                高風險案件提醒
              </div>
              <p className="mt-2 text-sm text-slate-600">遇到遲繳、協商或警示帳戶，系統會自動提高人工覆核優先度。</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              通知模組已預留 Email / LINE / Telegram 介面，後續可直接接到你現有的工作流。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
