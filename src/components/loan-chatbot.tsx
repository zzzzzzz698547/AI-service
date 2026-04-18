'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AssistantReply } from '@/lib/ollama'
import { intakeSteps } from '@/lib/loan-intake-steps'
import { leadIntakeSchema } from '@/lib/validation'
import type { LeadIntakeInput } from '@/lib/types'
import { useLoanWizard } from '@/hooks/use-loan-wizard'

const booleanLabels = {
  true: '是',
  false: '否'
}

function getBooleanValue(value: unknown) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function LoanChatbot() {
  const {
    isOpen,
    currentStep,
    open,
    close,
    nextStep,
    prevStep,
    setStep,
    formData,
    setField,
    isSubmitting,
    setSubmitting,
    submittedLeadId,
    setSubmittedLeadId,
    reset
  } = useLoanWizard()
  const [localError, setLocalError] = useState<string | null>(null)
  const [assistantReply, setAssistantReply] = useState<string | null>(null)
  const [assistantProvider, setAssistantProvider] = useState<'ollama' | 'fallback' | null>(null)
  const [assistantModel, setAssistantModel] = useState<string | null>(null)
  const [stepAssistantReply, setStepAssistantReply] = useState<string | null>(null)
  const [stepAssistantProvider, setStepAssistantProvider] = useState<'ollama' | 'fallback' | null>(null)
  const [stepAssistantModel, setStepAssistantModel] = useState<string | null>(null)
  const [stepAssistantLoading, setStepAssistantLoading] = useState(false)

  const step = intakeSteps[currentStep]
  const progress = ((currentStep + 1) / intakeSteps.length) * 100

  const canGoBack = currentStep > 0
  const isLastStep = currentStep === intakeSteps.length - 1

  const preview = useMemo(() => {
    return leadIntakeSchema.safeParse(formData)
  }, [formData])

  useEffect(() => {
    if (!isOpen || currentStep >= intakeSteps.length) {
      return
    }

    let cancelled = false

    async function loadStepAssistant() {
      setStepAssistantReply(null)
      setStepAssistantProvider(null)
      setStepAssistantModel(null)
      setStepAssistantLoading(true)
      try {
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stepKey: step.key,
            stepLabel: step.label,
            stepDescription: step.description,
            currentAnswer: formData[step.key as keyof LeadIntakeInput] ?? null,
            applicant: formData
          })
        })

        if (!response.ok) {
          throw new Error('assistant request failed')
        }

        const result = (await response.json()) as { reply?: AssistantReply }
        if (cancelled) {
          return
        }

        setStepAssistantReply(result.reply?.content ?? null)
        setStepAssistantProvider(result.reply?.provider ?? null)
        setStepAssistantModel(result.reply?.model ?? null)
      } catch {
        if (!cancelled) {
          setStepAssistantReply(null)
          setStepAssistantProvider(null)
          setStepAssistantModel(null)
        }
      } finally {
        if (!cancelled) {
          setStepAssistantLoading(false)
        }
      }
    }

    void loadStepAssistant()

    return () => {
      cancelled = true
    }
  }, [currentStep, isOpen, step.description, step.key, step.label])

  function resetAll() {
    reset()
    setSubmittedLeadId(null)
    setAssistantReply(null)
    setAssistantProvider(null)
    setAssistantModel(null)
    setStepAssistantReply(null)
    setStepAssistantProvider(null)
    setStepAssistantModel(null)
    setStepAssistantLoading(false)
    setLocalError(null)
  }

  async function handleNext() {
    const currentValue = formData[step.key as keyof LeadIntakeInput]

    const result = validateStepValue(step.key, currentValue)
    if (!result.success) {
      setLocalError('請先完成這一題，再往下一步。')
      return
    }

    setLocalError(null)
    if (!isLastStep) nextStep()
  }

  async function handleSubmit() {
    const parsed = leadIntakeSchema.safeParse(formData)
    if (!parsed.success) {
      setLocalError('資料尚未完整，請回到前一步補齊。')
      return
    }

    setSubmitting(true)
    setLocalError(null)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed.data)
      })

      if (!response.ok) {
        throw new Error('送出失敗')
      }

      const result = (await response.json()) as {
        leadId: string
        assistantReply?: { provider: 'ollama' | 'fallback'; model: string; content: string }
      }
      setSubmittedLeadId(result.leadId)
      setAssistantReply(result.assistantReply?.content ?? null)
      setAssistantProvider(result.assistantReply?.provider ?? null)
      setAssistantModel(result.assistantReply?.model ?? null)
      setStep(intakeSteps.length)
    } catch {
      setLocalError('送出失敗，請稍後再試。')
    } finally {
      setSubmitting(false)
  }
}

function validateStepValue(key: keyof LeadIntakeInput, value: unknown) {
  switch (key) {
    case 'fundingNeed':
      return value === '' || value == null
        ? { success: false as const }
        : leadIntakeSchema.shape.fundingNeed.safeParse(Number(value))
    case 'monthlyIncome':
      return value === '' || value == null
        ? { success: false as const }
        : leadIntakeSchema.shape.monthlyIncome.safeParse(Number(value))
    case 'monthlyDebtPayment':
      return value === '' || value == null
        ? { success: false as const }
        : leadIntakeSchema.shape.monthlyDebtPayment.safeParse(Number(value))
    case 'fundingUse':
      return leadIntakeSchema.shape.fundingUse.safeParse(String(value ?? '').trim())
    case 'jobType':
      return leadIntakeSchema.shape.jobType.safeParse(String(value ?? '').trim())
    case 'fullName':
      return leadIntakeSchema.shape.fullName.safeParse(String(value ?? '').trim())
    case 'lineId':
      return leadIntakeSchema.shape.lineId.safeParse(String(value ?? '').trim())
    case 'phone':
      return leadIntakeSchema.shape.phone.safeParse(String(value ?? '').trim())
    case 'hasPayroll':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasPayroll.safeParse(value) : { success: false as const }
    case 'hasLaborInsurance':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasLaborInsurance.safeParse(value) : { success: false as const }
    case 'hasTaxRecords':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasTaxRecords.safeParse(value) : { success: false as const }
    case 'hasCreditCard':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasCreditCard.safeParse(value) : { success: false as const }
    case 'hasRevolving':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasRevolving.safeParse(value) : { success: false as const }
    case 'hasOtherLoans':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasOtherLoans.safeParse(value) : { success: false as const }
    case 'recentLatePayment':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.recentLatePayment.safeParse(value) : { success: false as const }
    case 'hasNegotiationOrBankruptcy':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasNegotiationOrBankruptcy.safeParse(value) : { success: false as const }
    case 'hasCar':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasCar.safeParse(value) : { success: false as const }
    case 'hasHouse':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasHouse.safeParse(value) : { success: false as const }
    case 'hasGuarantor':
      return typeof value === 'boolean' ? leadIntakeSchema.shape.hasGuarantor.safeParse(value) : { success: false as const }
    default:
      return { success: false as const }
  }
}

  function renderInput() {
    const value = formData[step.key as keyof LeadIntakeInput]

    if (step.kind === 'money') {
      return (
        <Input
          inputMode="numeric"
          placeholder={step.placeholder}
          value={typeof value === 'number' ? value : ''}
          onChange={(event) => setField(step.key as keyof LeadIntakeInput, Number(event.target.value))}
        />
      )
    }

    if (step.kind === 'phone') {
      return (
        <Input
          placeholder={step.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setField(step.key as keyof LeadIntakeInput, event.target.value)}
        />
      )
    }

    if (step.kind === 'text') {
      return (
        <Textarea
          placeholder={step.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setField(step.key as keyof LeadIntakeInput, event.target.value)}
        />
      )
    }

    if (step.kind === 'select') {
      return (
        <Select value={typeof value === 'string' ? value : ''} onChange={(event) => setField(step.key as keyof LeadIntakeInput, event.target.value)}>
          <option value="" disabled>
            請選擇
          </option>
          {step.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((choice) => (
          <button
            key={String(choice)}
            type="button"
            onClick={() => setField(step.key as keyof LeadIntakeInput, choice)}
            className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
              value === choice ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="block font-medium">{booleanLabels[choice ? 'true' : 'false']}</span>
            <span className="mt-1 block text-xs text-slate-500">{choice ? '符合此條件' : '目前沒有'}</span>
          </button>
        ))}
      </div>
    )
  }

  if (submittedLeadId) {
    return (
      <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2rem)] max-w-md">
        <Card className="overflow-hidden border-brand-200 shadow-lift">
          <CardHeader className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 text-white">
            <CardTitle className="text-base text-white">已完成送件</CardTitle>
            <button onClick={() => { resetAll(); close(); }} className="rounded-full p-1 text-white/80 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
              案件已建立，系統會同步完成初審與通知流程。
            </div>
            {assistantReply ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>模型回覆</span>
                  <span>
                    {assistantProvider === 'ollama' ? 'Ollama' : 'Fallback'} · {assistantModel ?? 'n/a'}
                  </span>
                </div>
                <p className="whitespace-pre-line leading-6">{assistantReply}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" variant="brand" onClick={() => (window.location.href = `/dashboard/leads/${submittedLeadId}`)}>
                查看案件
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => { resetAll(); open(); }}>
                再送一筆
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {!isOpen ? (
        <button
          onClick={open}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <MessageCircle className="h-4 w-4" />
          立即評估
        </button>
      ) : (
        <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm">
          <div className="absolute bottom-4 right-4 w-[calc(100vw-2rem)] max-w-md">
            <Card className="overflow-hidden border-slate-200 shadow-lift">
              <CardHeader className="flex items-center justify-between bg-slate-950 text-white">
                <div>
                  <CardTitle className="text-base text-white">貸款智能初審客服</CardTitle>
                  <p className="mt-1 text-xs text-slate-400">多步驟初步條件評估</p>
                </div>
                <button onClick={close} className="rounded-full p-1 text-white/80 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>進度</span>
                    <span>{currentStep + 1} / {intakeSteps.length}</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {currentStep < intakeSteps.length ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-700">初步條件評估</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.label}</h3>
                      <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                    </div>

                    {stepAssistantReply || stepAssistantLoading ? (
                      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-700">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                          <span>模型陪聊</span>
                          <span>
                            {stepAssistantProvider === 'ollama' ? 'Ollama' : 'Fallback'} · {stepAssistantModel ?? 'n/a'}
                          </span>
                        </div>
                        <p className="whitespace-pre-line leading-6">
                          {stepAssistantLoading ? '模型正在整理目前這一步的說明...' : stepAssistantReply}
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor={`step-${step.key}`}>請填寫</Label>
                      {renderInput()}
                    </div>

                    {localError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{localError}</div> : null}

                    <div className="flex items-center justify-between gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={prevStep} disabled={!canGoBack}>
                        <ChevronLeft className="h-4 w-4" />
                        上一題
                      </Button>
                      {isLastStep ? (
                        <Button type="button" variant="brand" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                          {isSubmitting ? '送出中...' : '送出案件'}
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button type="button" variant="brand" size="sm" onClick={handleNext}>
                          下一題
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-brand-50 p-4">
                      <p className="text-sm font-medium text-brand-800">初審摘要</p>
                      <p className="mt-1 text-sm text-slate-600">
                        你可以先確認資料是否完整，再按下送出建立案件。
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                      <div className="grid gap-2">
                        <div className="flex justify-between"><span>姓名</span><span>{formData.fullName}</span></div>
                        <div className="flex justify-between"><span>電話</span><span>{formData.phone}</span></div>
                        <div className="flex justify-between"><span>LINE ID</span><span>{formData.lineId}</span></div>
                        <div className="flex justify-between"><span>評估狀態</span><span>{preview.success ? '可送出' : '需補齊'}</span></div>
                      </div>
                    </div>
                    {localError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{localError}</div> : null}
                    <div className="flex justify-between gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={prevStep}>
                        <ChevronLeft className="h-4 w-4" />
                        返回
                      </Button>
                      <Button type="button" variant="brand" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '送出中...' : '確認送出'}
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
