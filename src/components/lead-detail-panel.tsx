import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CheckCircle2, FileText, MessageSquareText, ShieldAlert, Sparkles, User2 } from 'lucide-react'
import type { DemoFollowUp, DemoLead, DemoNotification } from '@/lib/mock-data'

const incomeProofLabels: Record<DemoLead['incomeProofProfile'], string> = {
  none: '都沒有',
  payroll: '只有薪轉',
  laborInsurance: '只有勞保',
  both: '薪轉 + 勞保都有'
}

const bankFinanceIssueLabels: Record<DemoLead['bankFinanceIssueProfile'], string> = {
  none: '都沒有',
  bankDebt: '只有銀行呆帳',
  financeDebt: '只有融資呆帳',
  both: '銀行與融資都有呆帳',
  negotiation: '只有協商 / 更生',
  bankDebtAndNegotiation: '銀行呆帳 + 協商',
  financeDebtAndNegotiation: '融資呆帳 + 協商',
  bothAndNegotiation: '呆帳 + 協商都存在'
}

const vehicleProfileLabels: Record<DemoLead['vehicleProfile'], string> = {
  none: '都沒有',
  motorcycle: '只有機車',
  car: '只有汽車',
  both: '汽車 + 機車都有'
}

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
    ['申辦人姓名', lead.fullName],
    ['有無勞保或薪轉', incomeProofLabels[lead.incomeProofProfile]],
    ['目前在職工作期間多久', `${lead.laborInsuranceYears} 年`],
    ['名下有哪些貸款 / 分別哪間.種類.額度.期數.繳幾期.有無遲繳.遲繳幾天', lead.bankLoanSummary || '無'],
    ['有無信用卡', lead.creditCardSummary || '無'],
    ['是否為警示戶', lead.hasBankWarningAccount ? '是' : '否'],
    ['是否有前科', lead.hasCriminalRecord ? '有' : '無'],
    ['銀行跟融資是否有呆帳 / 協商', bankFinanceIssueLabels[lead.bankFinanceIssueProfile]],
    ['有無罰單', lead.vehicleTaxArrearsSummary || '無'],
    ['有無汽車或機車', vehicleProfileLabels[lead.vehicleProfile]],
    ['有無汽車駕照', lead.hasDrivingLicense ? '有' : '無'],
    ['有無不動產', lead.hasHouseLand ? '有' : '無'],
    ['本次資金預貸金額', formatCurrency(lead.fundingNeed)],
    ['本次資金用途', lead.fundingUse],
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
          <Button variant="outline" size="sm">
            指派業務
          </Button>
          <Button variant="brand" size="sm">
            更新狀態
          </Button>
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
                <ShieldAlert className="h-4 w-4 text-brand-600" />
                全方位分析
              </div>
              <p className="rounded-2xl bg-brand-50 p-4 text-sm leading-7 text-slate-700">{lead.analysisSummary}</p>
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-brand-600" />
                AI 四段式回覆
              </div>
              {lead.assistantReplySnapshot ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant="secondary">{lead.assistantReplySnapshot.provider === 'ollama' ? 'Ollama' : 'Fallback'}</Badge>
                    <Badge variant="outline">{lead.assistantReplySnapshot.model}</Badge>
                  </div>
                  <div className="space-y-4">
                    {lead.assistantReplySnapshot.sections.map((section) => (
                      <div key={section.title} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-slate-950">{section.title}</div>
                        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                          {section.content.map((line, index) => (
                            <p key={`${section.title}-${index}`}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  尚無 AI 四段式回覆
                </div>
              )}
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

            <Separator />

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User2 className="h-4 w-4 text-brand-600" />
                建議動作
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                {lead.recommendedActions.map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
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
              <CardTitle>既有貸款明細</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.existingLoans.length ? (
                lead.existingLoans.map((loan, index) => (
                  <div key={`${loan.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-900">{loan.name || `第 ${index + 1} 筆`}</div>
                      <Badge variant={loan.hasLatePayment ? 'warning' : 'secondary'}>{loan.hasLatePayment ? '有遲繳' : '正常'}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>貸款公司：{loan.company || '未填'}</div>
                      <div>類型：{loan.transactionType}</div>
                      <div>總貸金額：{formatCurrency(loan.totalAmount)}</div>
                      <div>分幾期：{loan.totalInstallments}</div>
                      <div>繳幾期：{loan.paidInstallments}</div>
                      <div>遲繳幾天：{loan.latePaymentDays ? `${loan.latePaymentDays} 天` : '無 / 未填'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">尚無既有貸款明細</div>
              )}
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
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">尚無跟進紀錄</div>
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
