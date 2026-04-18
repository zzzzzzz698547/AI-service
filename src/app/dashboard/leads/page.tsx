import Link from 'next/link'
import { ArrowRight, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { LeadsTable } from '@/components/lead-table'
import { listLeads } from '@/lib/store'
import type { LeadStatus, RiskLevel } from '@/lib/types'

type SearchParams = Record<string, string | string[] | undefined>

const pageSize = 8

export default function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  const recommendation = typeof searchParams.recommendation === 'string' ? searchParams.recommendation : ''
  const status = typeof searchParams.status === 'string' ? (searchParams.status as LeadStatus) : undefined
  const riskLevel = typeof searchParams.riskLevel === 'string' ? (searchParams.riskLevel as RiskLevel) : undefined
  const from = typeof searchParams.from === 'string' ? searchParams.from : ''
  const to = typeof searchParams.to === 'string' ? searchParams.to : ''
  const page = Number(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1

  const filtered = listLeads({
    query,
    recommendation,
    status,
    riskLevel,
    from,
    to
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const baseQuery = new URLSearchParams()
  if (query) baseQuery.set('q', query)
  if (recommendation) baseQuery.set('recommendation', recommendation)
  if (status) baseQuery.set('status', status)
  if (riskLevel) baseQuery.set('riskLevel', riskLevel)
  if (from) baseQuery.set('from', from)
  if (to) baseQuery.set('to', to)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">案件列表</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">搜尋 / 篩選 / 分頁</h1>
          <p className="mt-2 text-sm text-slate-500">可依日期、推薦方案、跟進狀態、指派業務與風險等級快速定位案件。</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            回到總覽
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label htmlFor="q">搜尋</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input id="q" name="q" defaultValue={query} className="pl-10" placeholder="姓名、電話、LINE ID、用途" />
          </div>
        </div>
        <div>
          <Label htmlFor="recommendation">推薦方案</Label>
          <Select id="recommendation" name="recommendation" defaultValue={recommendation}>
            <option value="">全部</option>
            <option value="信用貸款">信用貸款</option>
            <option value="汽車貸款">汽車貸款</option>
            <option value="汽車增貸">汽車增貸</option>
            <option value="機車貸款">機車貸款</option>
            <option value="房屋二胎">房屋二胎</option>
            <option value="代書貸款">代書貸款</option>
            <option value="整合負債">整合負債</option>
            <option value="商品貸">商品貸</option>
            <option value="人工覆核">人工覆核</option>
            <option value="暫不建議承作">暫不建議承作</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">跟進狀態</Label>
          <Select id="status" name="status" defaultValue={status ?? ''}>
            <option value="">全部</option>
            <option value="NEW">NEW</option>
            <option value="CONTACT_PENDING">CONTACT_PENDING</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="HIGH_INTENT">HIGH_INTENT</option>
            <option value="REVIEWING">REVIEWING</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="DECLINED">DECLINED</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="riskLevel">風險等級</Label>
          <Select id="riskLevel" name="riskLevel" defaultValue={riskLevel ?? ''}>
            <option value="">全部</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </Select>
        </div>
        <div className="lg:col-span-1">
          <Label htmlFor="from">起始日期</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="lg:col-span-1">
          <Label htmlFor="to">結束日期</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <div className="lg:col-span-6 flex justify-end">
          <Button variant="brand" type="submit">
            <Filter className="h-4 w-4" />
            套用篩選
          </Button>
        </div>
      </form>

      <LeadsTable
        leads={paged.map((lead) => ({
          id: lead.id,
          fullName: lead.fullName,
          phone: lead.phone,
          createdAt: lead.createdAt,
          status: lead.status,
          primaryRecommendation: lead.primaryRecommendation,
          riskLevel: lead.riskLevel,
          score: lead.score,
          assignedSalesId: lead.assignedSalesId,
          fundingNeed: lead.fundingNeed
        }))}
      />

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          顯示 {paged.length} / {filtered.length} 筆
        </div>
        <div className="flex items-center gap-2">
          <Link href={`?${withPage(baseQuery, Math.max(1, currentPage - 1))}`}>
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              上一頁
            </Button>
          </Link>
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            {currentPage} / {totalPages}
          </span>
          <Link href={`?${withPage(baseQuery, Math.min(totalPages, currentPage + 1))}`}>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
              下一頁
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function withPage(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params)
  next.set('page', String(page))
  return next.toString()
}
