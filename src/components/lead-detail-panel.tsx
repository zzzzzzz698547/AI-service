import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CheckCircle2, FileText, MessageSquareText, ShieldAlert, User2 } from 'lucide-react'
import type { DemoLead } from '@/lib/mock-data'
import type { DemoFollowUp, DemoNotification } from '@/lib/mock-data'

export function LeadDetailPanel({
  lead,
  followUps,
  notifications
}: {
  lead: DemoLead
  followUps: DemoFollowUp[]
  notifications: DemoNotification[]
}) {
  const answers = [
    ['資金需求', formatCurrency(lead.fundingNeed)],
    ['資金用途', lead.fundingUse],
    ['職業類型', lead.jobType],
    ['月收入', formatCurrency(lead.monthlyIncome)],
    ['薪轉', lead.hasPayroll ? '有' : '無'],
    ['勞保', lead.hasLaborInsurance ? '有' : '無'],
    ['報稅資料', lead.hasTaxRecords ? '有' : '無'],
    ['信用卡', lead.hasCreditCard ? '有' : '無'],
    ['卡循', lead.hasRevolving ? '有' : '無'],
    ['其他貸款', lead.hasOtherLoans ? '有' : '無'],
    ['每月負債月付', formatCurrency(lead.monthlyDebtPayment)],
    ['近期遲繳', lead.recentLatePayment ? '有' : '無'],
    ['協商/更生/警示帳戶', lead.hasNegotiationOrBankruptcy ? '有' : '無'],
    ['汽車', lead.hasCar ? '有' : '無'],
    ['房屋', lead.hasHouse ? '有' : '無'],
    ['保人', lead.hasGuarantor ? '可提供' : '無'],
    ['姓名', lead.fullName],
    ['電話', lead.phone],
    ['LINE ID', lead.lineId]
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{lead.fullName}</h1>
            <Badge variant="secondary">{lead.primaryRecommendation}</Badge>
            <Badge variant={lead.needManualReview ? 'warning' : 'success'}>{lead.riskLevel}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {lead.phone} · 建立時間 {formatDateTime(lead.createdAt)} · 分數 {lead.score}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">指派業務</Button>
          <Button variant="brand" size="sm">更新狀態</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>客戶資料與初審結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['主推方案', lead.primaryRecommendation],
                ['次推方案', lead.secondaryRecommendation ?? '無'],
                ['風險等級', lead.riskLevel],
                ['是否人工覆核', lead.needManualReview ? '是' : '否']
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-1 font-medium text-slate-950">{value}</div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MessageSquareText className="h-4 w-4 text-brand-600" />
                推薦原因
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                {lead.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-brand-600" />
                補件建議
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.requiredDocuments.map((doc) => (
                  <Badge key={doc} variant="outline">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>完整問答紀錄</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {answers.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 pb-3 last:border-b-0 last:pb-0">
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="max-w-[60%] text-right text-sm font-medium text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>跟進紀錄</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {followUps.length ? (
                followUps.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.createdBy}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.note}</p>
                    <div className="mt-3">
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  尚無跟進紀錄
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>通知紀錄</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm">
                  <div>
                    <div className="font-medium text-slate-900">{item.channel}</div>
                    <div className="text-xs text-slate-500">{item.target}</div>
                  </div>
                  <Badge variant={item.status === 'SENT' ? 'success' : 'secondary'}>{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
