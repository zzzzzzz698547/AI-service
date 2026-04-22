'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { BrandMark } from '@/components/brand-mark'
import { evaluateLoanIntake } from '@/lib/loan-rules'
import type { AssistantReply } from '@/lib/ollama'
import {
  getBankFinanceIssueFlags,
  getIncomeProofBooleans,
  intakeSteps,
  getVehicleBooleans,
  getVehicleTaxArrearsFlags
} from '@/lib/loan-intake-steps'
import { leadIntakeSchema } from '@/lib/validation'
import type { ExistingLoanRecord, LeadIntakeInput } from '@/lib/types'
import type { RecommendationResult } from '@/lib/types'
import { useLoanWizard } from '@/hooks/use-loan-wizard'
import { formatCurrency } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
  }
}

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function parseAmount(text: string) {
  const normalized = text.replace(/,/g, '').trim()
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(億|萬|千|元)?/)
  if (!match) return 0
  const amount = Number(match[1])
  const unit = match[2] ?? ''
  if (Number.isNaN(amount)) return 0
  if (unit === '億') return Math.round(amount * 100000000)
  if (unit === '萬') return Math.round(amount * 10000)
  if (unit === '千') return Math.round(amount * 1000)
  return Math.round(amount)
}

function parseInstallmentCount(text: string) {
  const match = text.replace(/,/g, '').match(/(\d+)\s*期/)
  return match ? Number(match[1]) : 0
}

function parseLateDays(text: string) {
  const match = text.replace(/,/g, '').match(/遲繳[^0-9]*(\d{1,3})\s*天/)
  return match ? Number(match[1]) : 0
}

function parseYesNo(text: string) {
  const normalized = normalizeText(text)
  if (!normalized) return null
  if (/(沒有|無|否|否定|不|no|none|false|0)/i.test(normalized)) return false
  if (/(有|是|yes|true|1)/i.test(normalized)) return true
  return null
}

function parseIncomeProofProfile(text: string) {
  const normalized = normalizeText(text)
  if (!normalized || /(都沒有|沒有|無|none)/i.test(normalized)) return 'none' as const
  const hasPayroll = /(薪轉|薪水轉帳|轉薪)/.test(normalized)
  const hasLaborInsurance = /(勞保|勞健保|工會)/.test(normalized)
  if (hasPayroll && hasLaborInsurance) return 'both' as const
  if (hasPayroll) return 'payroll' as const
  if (hasLaborInsurance) return 'laborInsurance' as const
  return 'none' as const
}

function parseVehicleProfile(text: string) {
  const normalized = normalizeText(text)
  if (!normalized || /(都沒有|沒有|無|none)/i.test(normalized)) {
    return { vehicleProfile: 'none' as const, hasDrivingLicense: false }
  }

  const hasCar = /(汽車|自小客車|轎車|車)/.test(normalized)
  const hasMotorcycle = /(機車|摩托車)/.test(normalized)
  const hasDrivingLicense =
    /(有.*駕照|駕照.*有|持有駕照|有駕照)/.test(normalized) && !/(沒有.*駕照|無.*駕照|沒.*駕照)/.test(normalized)

  const vehicleProfile =
    hasCar && hasMotorcycle
      ? ('both' as const)
      : hasCar
        ? ('car' as const)
        : hasMotorcycle
          ? ('motorcycle' as const)
          : ('none' as const)

  return {
    vehicleProfile,
    hasDrivingLicense
  }
}

function parseBankFinanceIssueProfile(text: string) {
  const normalized = normalizeText(text)
  if (!normalized || /(都沒有|沒有|無|none)/i.test(normalized)) return 'none' as const
  const hasBankDebt = /(銀行.*呆帳|銀行呆帳)/.test(normalized)
  const hasFinanceDebt = /(融資.*呆帳|融資呆帳)/.test(normalized)
  const hasNegotiation = /(協商|更生|清算|前置協商)/.test(normalized)

  if (hasBankDebt && hasFinanceDebt && hasNegotiation) return 'bothAndNegotiation' as const
  if (hasBankDebt && hasNegotiation) return 'bankDebtAndNegotiation' as const
  if (hasFinanceDebt && hasNegotiation) return 'financeDebtAndNegotiation' as const
  if (hasBankDebt && hasFinanceDebt) return 'both' as const
  if (hasBankDebt) return 'bankDebt' as const
  if (hasFinanceDebt) return 'financeDebt' as const
  if (hasNegotiation) return 'negotiation' as const
  return 'none' as const
}

function getAssessmentStepPrompt(stepIndex: number) {
  const step = intakeSteps[stepIndex]
  if (!step) {
    return '條件已收集完成，接著我可以幫您整理可走方案。'
  }

  return `第 ${stepIndex + 1} 題：${step.label}。`
}

function getAssessmentReminder(stepIndex: number) {
  const step = intakeSteps[stepIndex]
  if (!step) {
    return '我先幫您整理條件，請稍等。'
  }

  return `我先確認第 ${stepIndex + 1} 題「${step.label}」。請直接回答這一題，例如：${step.description}`
}

function isAssessmentAnswerRelevant(stepIndex: number, text: string) {
  const step = intakeSteps[stepIndex]
  const normalized = normalizeText(text)
  if (!step || !normalized) return false

  if (/(可以嗎|怎麼|如何|為什麼|要不要|能不能|可不可以|多少|哪個|怎麼辦|請問|想問|有沒有|可否)/.test(normalized)) {
    if (step.key !== 'bankLoanSummary' && step.key !== 'creditCardSummary') {
      return false
    }
  }

  switch (step.key) {
    case 'incomeProofProfile':
      return /(薪轉|勞保|勞健保|工會|沒有|無|都沒有|都無|只有|兩者|都有)/.test(normalized)
    case 'laborInsuranceYears':
      return /(\d+(?:\.\d+)?)\s*(年|個月|月)/.test(normalized) || /(年資|在職|任職|工作多久|多久)/.test(normalized)
    case 'bankLoanSummary':
      return /^(無|沒有|未填|none)$/i.test(normalized) || /(銀行|融資|當鋪|民間|車貸|房貸|信貸|商品貸|手機貸|卡循|分期|增貸|原車融資|買車找錢|呆帳|協商|期數|額度|遲繳|繳幾期|已繳)/.test(normalized)
    case 'creditCardSummary':
      return /^(無|沒有|未填|none)$/i.test(normalized) || /(信用卡|卡循|額度|持卡|已使用|繳清|繳最低|銀行)/.test(normalized)
    case 'hasBankWarningAccount':
    case 'hasCriminalRecord':
    case 'hasHouseLand':
      return parseYesNo(normalized) !== null || /^(無|沒有|未填|none)$/i.test(normalized)
    case 'bankFinanceIssueProfile':
      return /^(無|沒有|未填|none)$/i.test(normalized) || /(銀行|融資|呆帳|協商|更生|清算)/.test(normalized)
    case 'vehicleTaxArrearsSummary':
      return /^(無|沒有|未填|none)$/i.test(normalized) || /(罰單|監理站|欠費|金額|\d)/.test(normalized)
    case 'vehicleProfile':
      return /^(無|沒有|未填|none)$/i.test(normalized) || /(汽車|機車|駕照|有|沒有|無)/.test(normalized)
    default:
      return true
  }
}

function parseAssessmentAnswer(stepIndex: number, text: string): Partial<LeadIntakeInput> {
  const step = intakeSteps[stepIndex]
  const normalized = normalizeText(text)

  if (!step) return {}

  switch (step.key) {
    case 'incomeProofProfile': {
      const profile = parseIncomeProofProfile(normalized)
      return {
        incomeProofProfile: profile,
        hasPayroll: profile === 'payroll' || profile === 'both',
        hasLaborInsurance: profile === 'laborInsurance' || profile === 'both'
      }
    }
    case 'laborInsuranceYears': {
      const yearMatch = normalized.match(/(\d+(?:\.\d+)?)\s*年/)
      const monthMatch = normalized.match(/(\d+)\s*個月/)
      const years = yearMatch ? Number(yearMatch[1]) : monthMatch ? Number(monthMatch[1]) / 12 : 0
      return { laborInsuranceYears: Number.isFinite(years) ? Math.max(0, Math.floor(years)) : 0 }
    }
    case 'bankLoanSummary':
      return { bankLoanSummary: text.trim() || '無' }
    case 'creditCardSummary':
      return { creditCardSummary: text.trim() || '無' }
    case 'hasBankWarningAccount': {
      const parsed = parseYesNo(normalized)
      return parsed === null ? {} : { hasBankWarningAccount: parsed }
    }
    case 'hasCriminalRecord': {
      const parsed = parseYesNo(normalized)
      return parsed === null ? {} : { hasCriminalRecord: parsed }
    }
    case 'bankFinanceIssueProfile':
      return {
        bankFinanceIssueProfile: parseBankFinanceIssueProfile(normalized),
        hasNegotiationOrBankruptcy: /(協商|更生|清算|前置協商)/.test(normalized)
      }
    case 'vehicleTaxArrearsSummary':
      return { vehicleTaxArrearsSummary: text.trim() || '無' }
    case 'vehicleProfile': {
      const parsed = parseVehicleProfile(normalized)
      return {
        vehicleProfile: parsed.vehicleProfile,
        hasCar: parsed.vehicleProfile === 'car' || parsed.vehicleProfile === 'both',
        hasMotorcycle: parsed.vehicleProfile === 'motorcycle' || parsed.vehicleProfile === 'both',
        hasDrivingLicense: parsed.hasDrivingLicense
      }
    }
    case 'hasHouseLand': {
      const parsed = parseYesNo(normalized)
      return parsed === null ? {} : { hasHouseLand: parsed }
    }
    default:
      return {}
  }
}

function parseExistingLoans(summary: string): ExistingLoanRecord[] {
  const normalized = summary.trim()
  if (!normalized || /^(無|沒有|未填|none)$/i.test(normalized)) {
    return []
  }

  const entries = summary
    .split(/[\n;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return entries.slice(0, 3).map((entry) => {
    const rawParts = entry.split(/[｜|]/).map((part) => part.trim()).filter(Boolean)
    const parts = rawParts.length > 1 ? rawParts : entry.split(/[\/／]/).map((part) => part.trim()).filter(Boolean)
    const [first = '', second = '', third = '', fourth = '', fifth = '', sixth = '', seventh = ''] = parts

    const transactionText = second || ''
    const amountText = third || ''
    const installmentText = fourth || ''
    const paidText = fifth || ''
    const lateText = `${sixth}${seventh}${entry}`

    const transactionType: ExistingLoanRecord['transactionType'] = /增貸/.test(transactionText)
      ? '增貸'
      : /購買/.test(transactionText)
        ? '購買'
        : '其他'

    const paidInstallments = Number((paidText.match(/(\d+)/)?.[1] ?? paidText.match(/已繳\s*(\d+)/)?.[1] ?? '0'))
    const totalInstallments = parseInstallmentCount(installmentText)
    const latePaymentDays = parseLateDays(lateText)
    const hasLatePayment = /遲繳|逾期|未繳/.test(lateText)

    return {
      name: second || first || '未命名貸款',
      company: first || second || '未填',
      transactionType,
      totalAmount: parseAmount(amountText),
      totalInstallments,
      paidInstallments,
      hasLatePayment,
      latePaymentDays: latePaymentDays || undefined
    }
  })
}

function extractLeadHintsFromText(text: string): Partial<LeadIntakeInput> {
  const normalized = normalizeText(text)
  const hints: Partial<LeadIntakeInput> = {}

  const incomeProofProfile = parseIncomeProofProfile(normalized)
  if (/(薪轉|勞保|勞健保|工會)/.test(normalized)) {
    hints.incomeProofProfile = incomeProofProfile
    hints.hasPayroll = incomeProofProfile === 'payroll' || incomeProofProfile === 'both'
    hints.hasLaborInsurance = incomeProofProfile === 'laborInsurance' || incomeProofProfile === 'both'
  }

  if (/(在職|工作|任職|年資|幾年)/.test(normalized)) {
    const yearMatch = normalized.match(/(\d+(?:\.\d+)?)\s*年/)
    if (yearMatch) {
      hints.laborInsuranceYears = Math.max(0, Math.floor(Number(yearMatch[1])))
    }
  }

  if (/(月薪|收入|薪資)/.test(normalized)) {
    const salary = parseAmount(normalized)
    if (salary > 0) {
      hints.monthlySalary = salary
    }
  }

  if (/(資金|預貸|要貸|需要|周轉|借款|借)/.test(normalized)) {
    const amount = parseAmount(normalized)
    if (amount > 0) {
      hints.fundingNeed = amount
    }
  }

  if (/(用途|創業|醫療|整合|買車|買房|修繕|生活|教育|周轉)/.test(normalized)) {
    hints.fundingUse = text.trim()
  }

  if (/09\d{8}/.test(normalized)) {
    hints.phone = normalized.match(/09\d{8}/)?.[0] ?? hints.phone
  }

  if (/(信用卡|卡循|循環)/.test(normalized)) {
    hints.creditCardSummary = text.trim()
  }

  if (/(警示|管制戶)/.test(normalized)) {
    const parsed = parseYesNo(normalized)
    if (parsed !== null) {
      hints.hasBankWarningAccount = parsed
    }
  }

  if (/(前科|案底)/.test(normalized)) {
    const parsed = parseYesNo(normalized)
    if (parsed !== null) {
      hints.hasCriminalRecord = parsed
    }
  }

  if (/(法院|扣款)/.test(normalized)) {
    const parsed = parseYesNo(normalized)
    if (parsed !== null) {
      hints.hasCourtDeduction = parsed
    }
  }

  if (/(協商|更生|清算|呆帳)/.test(normalized)) {
    hints.bankFinanceIssueProfile = parseBankFinanceIssueProfile(normalized)
    hints.hasNegotiationOrBankruptcy = /(協商|更生|清算|前置協商)/.test(normalized)
  }

  if (/(汽車|機車|駕照)/.test(normalized)) {
    const parsed = parseVehicleProfile(normalized)
    hints.vehicleProfile = parsed.vehicleProfile
    hints.hasCar = parsed.vehicleProfile === 'car' || parsed.vehicleProfile === 'both'
    hints.hasMotorcycle = parsed.vehicleProfile === 'motorcycle' || parsed.vehicleProfile === 'both'
    hints.hasDrivingLicense = parsed.hasDrivingLicense
  }

  if (/(房屋|土地|不動產)/.test(normalized)) {
    const parsed = parseYesNo(normalized)
    if (parsed !== null) {
      hints.hasHouseLand = parsed
    }
  }

  if (/(罰單|監理站|欠費)/.test(normalized)) {
    hints.vehicleTaxArrearsSummary = text.trim()
    const flags = getVehicleTaxArrearsFlags(text)
    hints.hasVehicleTaxArrears = flags.hasVehicleTaxArrears
    hints.vehicleTaxArrearsAmount = flags.vehicleTaxArrearsAmount
  }

  if (/(銀行|融資|當鋪|民間|車貸|房貸|商品貸|手機貸|原車融資|買車找錢|整合負債)/.test(normalized)) {
    hints.bankLoanSummary = text.trim()
  }

  if (/(姓名|叫做|我是|我叫)/.test(normalized) && normalized.length <= 30) {
    hints.fullName = text.trim()
  }

  if (/(line id|line)/i.test(normalized) && normalized.length <= 40) {
    hints.lineId = text.trim()
  }

  if (normalized.includes('現職') || normalized.includes('職稱') || normalized.includes('工作')) {
    hints.currentJobTitle = text.trim()
  }

  return hints
}

function sanitizeLeadInput(formData: Partial<LeadIntakeInput>): LeadIntakeInput {
  const incomeProofProfile = formData.incomeProofProfile ?? 'none'
  const vehicleProfile = formData.vehicleProfile ?? 'none'
  const bankFinanceIssueProfile = formData.bankFinanceIssueProfile ?? 'none'
  const vehicleTaxArrearsSummary = formData.vehicleTaxArrearsSummary ?? '無'

  const incomeProofFlags = getIncomeProofBooleans(incomeProofProfile)
  const vehicleFlags = getVehicleBooleans(vehicleProfile)
  const bankFinanceIssueFlags = getBankFinanceIssueFlags(bankFinanceIssueProfile)
  const vehicleTaxArrearsFlags = getVehicleTaxArrearsFlags(vehicleTaxArrearsSummary)
  const existingLoans = parseExistingLoans(formData.bankLoanSummary ?? '')
  const hasHouseLand = Boolean(formData.hasHouseLand)
  const assetProfile =
    vehicleProfile === 'both' && hasHouseLand
      ? 'allAssets'
      : vehicleProfile === 'car' && hasHouseLand
        ? 'carAndHouse'
      : vehicleProfile === 'both'
          ? 'carAndMotorcycle'
          : hasHouseLand
            ? 'houseLand'
            : vehicleProfile === 'car'
              ? 'car'
              : vehicleProfile === 'motorcycle'
                ? 'motorcycle'
                : 'none'

  const debtProfile =
    /卡循|循環/.test(formData.creditCardSummary ?? '')
      ? 'cardRevolving'
      : existingLoans.length >= 3
        ? 'multipleLoans'
        : existingLoans.length > 0
          ? 'otherLoans'
          : 'none'

  const creditRiskProfile =
    vehicleTaxArrearsFlags.hasVehicleTaxArrears
      ? 'vehicleTaxArrears'
      : formData.hasBankWarningAccount
        ? 'warningAccount'
        : formData.hasCourtDeduction
          ? 'courtDeduction'
          : formData.hasCriminalRecord
            ? 'criminalRecord'
            : bankFinanceIssueFlags.creditRiskProfile

  return {
    fullName: formData.fullName ?? '',
    birthDate: formData.birthDate ?? '1900-01-01',
    nationalId: formData.nationalId ?? 'A123456789',
    householdRegistrationAddress: formData.householdRegistrationAddress ?? '未提供',
    currentResidenceAddress: formData.currentResidenceAddress ?? '未提供',
    currentJobTitle: formData.currentJobTitle ?? '未提供',
    laborInsuranceYears: Number(formData.laborInsuranceYears ?? 0),
    monthlySalary: Number(formData.monthlySalary ?? 0),
    hasPayroll: Boolean(formData.hasPayroll ?? incomeProofFlags.hasPayroll),
    hasLaborInsurance: Boolean(formData.hasLaborInsurance ?? incomeProofFlags.hasLaborInsurance),
    incomeProofProfile,
    hasVehicleTaxArrears: Boolean(formData.hasVehicleTaxArrears ?? vehicleTaxArrearsFlags.hasVehicleTaxArrears),
    vehicleTaxArrearsAmount: Number(formData.vehicleTaxArrearsAmount ?? vehicleTaxArrearsFlags.vehicleTaxArrearsAmount),
    vehicleTaxArrearsSummary,
    hasCriminalRecord: Boolean(formData.hasCriminalRecord ?? false),
    criminalRecordCharge: formData.criminalRecordCharge ?? '無',
    hasCourtDeduction: Boolean(formData.hasCourtDeduction ?? false),
    hasBankWarningAccount: Boolean(formData.hasBankWarningAccount ?? false),
    hasCar: Boolean(formData.hasCar ?? vehicleFlags.hasCar),
    hasMotorcycle: Boolean(formData.hasMotorcycle ?? vehicleFlags.hasMotorcycle),
    hasHouseLand,
    vehicleProfile,
    bankFinanceIssueProfile,
    assetProfile,
    debtProfile,
    creditRiskProfile,
    hasNegotiationOrBankruptcy: Boolean(formData.hasNegotiationOrBankruptcy ?? bankFinanceIssueFlags.hasNegotiationOrBankruptcy),
    bankLoanSummary: formData.bankLoanSummary ?? '無',
    financeLoanSummary: formData.financeLoanSummary ?? '無',
    pawnshopLoanSummary: formData.pawnshopLoanSummary ?? '無',
    privateLoanSummary: formData.privateLoanSummary ?? '無',
    creditCardSummary: formData.creditCardSummary ?? '無',
    fundingNeed: Number(formData.fundingNeed ?? 0),
    fundingUse: formData.fundingUse ?? '未提供',
    recentBankFinanceLoanApplication: formData.recentBankFinanceLoanApplication ?? '無',
    repaymentHistorySummary: formData.repaymentHistorySummary ?? '無',
    totalLoanTermSummary: formData.totalLoanTermSummary ?? '無',
    hasDrivingLicense: Boolean(formData.hasDrivingLicense ?? false),
    existingLoans,
    phone: formData.phone ?? '0900000000',
    lineId: formData.lineId ?? '未提供'
  }
}

function getGreeting() {
  return '您好，這裡可以直接聊天，也可以依您的需求或者想了解的問題回答您。若要進入條件評估，請輸入「評估」。也可直接聯絡客服。'
}

function getSuggestedFollowUpQuestion(formData: LeadIntakeInput) {
  if (!formData.fullName || formData.fullName === '未提供') return '姓名'
  if (!formData.currentJobTitle || formData.currentJobTitle === '未提供') return '目前工作職稱'
  if (!formData.laborInsuranceYears) return '目前在職工作期間多久'
  if (!formData.bankLoanSummary || formData.bankLoanSummary === '無') return '名下有哪些貸款'
  if (!formData.creditCardSummary || formData.creditCardSummary === '無') return '有無信用卡'
  if (!formData.phone || formData.phone === '0900000000') return '聯絡電話'
  if (!formData.lineId || formData.lineId === '未提供') return 'LINE ID'
  return null
}

function isLikelyQuestion(text: string) {
  const normalized = normalizeText(text)
  return /\?$|？$/.test(normalized) || /^(可以嗎|怎麼|如何|為什麼|要不要|能不能|可不可以|多少|哪個|怎麼辦|請問|想問|有沒有|可否)/.test(normalized)
}

function isInitialReviewKeyword(text: string) {
  const normalized = normalizeText(text)
  return /評估|條件評估|開始評估|進入評估|我要評估|方案評估|初審|初審模式|開始初審|進入初審|我要初審/.test(normalized)
}

function classifyChatIntent(text: string) {
  const normalized = normalizeText(text)
  if (/(貸款|申辦|初審|條件|月付|期數|額度|利率|薪轉|勞保|勞健保|信用卡|卡循|呆帳|協商|更生|警示|前科|法院|扣款|罰單|車|機車|汽車|房|不動產|資金|周轉|過件|核貸|配車|車貸|房貸|整合負債|商品貸|手機貸|代書貸款)/.test(normalized)) {
    return 'loan' as const
  }
  return 'general' as const
}

export function LoanChatbot() {
  const {
    isOpen,
    open,
    close,
    formData,
    setField,
    isSubmitting,
    setSubmitting,
    submittedLeadId,
    setSubmittedLeadId,
    reset,
    currentStep,
    setStep
  } = useLoanWizard()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [assistantTyping, setAssistantTyping] = useState(false)
  const [assistantReply, setAssistantReply] = useState<string | null>(null)
  const [assistantProvider, setAssistantProvider] = useState<'ollama' | 'fallback' | null>(null)
  const [assistantModel, setAssistantModel] = useState<string | null>(null)
  const [isIntakeStarted, setIsIntakeStarted] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<RecommendationResult | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const preview = useMemo(() => {
    return leadIntakeSchema.safeParse(sanitizeLeadInput(formData))
  }, [formData])

  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    setMessages([createMessage('assistant', getGreeting())])
  }, [isOpen, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, assistantTyping, isOpen])

  function resetAll() {
    reset()
    setMessages([])
    setInputValue('')
    setIsIntakeStarted(false)
    setSubmittedLeadId(null)
    setAssistantReply(null)
    setAssistantProvider(null)
    setAssistantModel(null)
    setAssessmentResult(null)
    setLocalError(null)
    setAssistantTyping(false)
  }

  async function handleSubmitLead() {
    const parsed = leadIntakeSchema.safeParse(sanitizeLeadInput(formData))
    if (!parsed.success) {
      setLocalError('資料尚未完整，請再補充幾項內容。')
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
    } catch {
      setLocalError('送出失敗，請稍後再試。')
    } finally {
      setSubmitting(false)
    }
  }

  async function sendChatMessage(rawText: string) {
    const text = rawText.trim()
    if (!text || assistantTyping) return

    setLocalError(null)
    const userMessage = createMessage('user', text)
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInputValue('')

    if (!isIntakeStarted) {
      if (isInitialReviewKeyword(text)) {
        setIsIntakeStarted(true)
        setAssessmentResult(null)
        setStep(0)
        setMessages((current) => [
          ...current,
          createMessage('assistant', '好的，已進入條件評估模式。')
        ])
        setTimeout(() => {
          setMessages((current) => [
            ...current,
            createMessage('assistant', getAssessmentStepPrompt(0))
          ])
        }, 350)
        return
      }
    }

    if (isIntakeStarted) {
      const assessmentStep = intakeSteps[currentStep]
      if (assessmentStep) {
        if (!isAssessmentAnswerRelevant(currentStep, text)) {
          setMessages((current) => [
            ...current,
            createMessage('assistant', getAssessmentReminder(currentStep))
          ])
          return
        }

        const parsedAnswer = parseAssessmentAnswer(currentStep, text)
        const mergedApplicant = sanitizeLeadInput({ ...formData, ...parsedAnswer })
        Object.entries(parsedAnswer).forEach(([key, value]) => {
          setField(key as keyof LeadIntakeInput, value as never)
        })

        const nextStepIndex = currentStep + 1
        setStep(nextStepIndex)

        if (nextStepIndex >= intakeSteps.length) {
          setIsIntakeStarted(false)
          const result = evaluateLoanIntake(mergedApplicant)
          setAssessmentResult(result)
          setMessages((current) => [
            ...current,
            createMessage(
              'assistant',
              `條件已收集完成，我已幫您做整體分析。主推方案是「${result.primaryRecommendation}」，若要進一步確認，請看下方完整分析與官方 LINE 按鈕。`
            )
          ])
          return
        }

        setMessages((current) => [
          ...current,
          createMessage('assistant', getAssessmentStepPrompt(nextStepIndex))
        ])
        return
      }
    }

    const intent = classifyChatIntent(text)
    const hints = intent === 'loan' ? extractLeadHintsFromText(text) : {}
    const mergedApplicant = sanitizeLeadInput({ ...formData, ...hints })
    const suggestedNextQuestion =
      isIntakeStarted && intent === 'loan' && !isLikelyQuestion(text)
        ? getSuggestedFollowUpQuestion(mergedApplicant)
        : null
    Object.entries(hints).forEach(([key, value]) => {
      setField(key as keyof LeadIntakeInput, value as never)
    })

    setAssistantTyping(true)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'chat',
          intent,
          message: text,
          transcript: nextMessages.map(({ role, content }) => ({ role, content })),
          applicant: mergedApplicant,
          suggestedNextQuestion
        })
      })

      if (!response.ok) {
        throw new Error('assistant request failed')
      }

      const result = (await response.json()) as { reply?: AssistantReply }
      const replyText =
        result.reply?.content?.trim() ||
        (intent === 'general'
          ? '可以，您直接問我就行，我會先回覆您現在的問題。'
          : suggestedNextQuestion
            ? `我先幫您記下了，您可以繼續問我其他問題。若方便，也可以補充：${suggestedNextQuestion}`
            : '我先幫您記下了，您可以繼續問我其他問題。')
      setMessages((current) => [...current, createMessage('assistant', replyText)])
    } catch {
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          intent === 'general'
            ? '可以，您直接問我就行，我會先回覆您現在的問題。'
            : suggestedNextQuestion
              ? `可以，我先幫您記下這些資訊。您也可以繼續問我其他問題，若方便也可以補充：${suggestedNextQuestion}`
              : '可以，我先幫您記下這些資訊。您也可以繼續問我其他問題，我會先回答您剛剛的內容。'
        )
      ])
    } finally {
      setAssistantTyping(false)
    }
  }

  async function handleSend() {
    if (!inputValue.trim()) return
    await sendChatMessage(inputValue)
  }

  function renderMessageBubble(message: ChatMessage) {
    if (message.role === 'assistant') {
      return (
        <div key={message.id} className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1.5 ring-1 ring-white/70">
            <BrandMark className="h-full w-full scale-[0.92]" />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/70 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
            <p className="whitespace-pre-line">{message.content}</p>
          </div>
        </div>
      )
    }

    return (
      <div key={message.id} className="flex items-start justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#06C755] px-4 py-3 text-sm leading-6 text-white shadow-sm">
          <p className="whitespace-pre-line">{message.content}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B7E6C0] text-[#2F6E3D]">
          你
        </div>
      </div>
    )
  }

  function renderAssessmentCard() {
    if (!assessmentResult) return null

    return (
      <div className="rounded-[26px] border border-emerald-200 bg-white/95 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">整體分析結果</p>
            <p className="mt-1 text-xs text-slate-500">依您目前輸入條件整理適合方案</p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            分數 {assessmentResult.score}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-50 p-3">
            <p className="text-xs text-slate-500">主推方案</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assessmentResult.primaryRecommendation}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">次選方案</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assessmentResult.secondaryRecommendation ?? '暫無'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">風險等級</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assessmentResult.riskLevel}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">是否需人工覆核</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assessmentResult.needManualReview ? '需要' : '不需要'}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">整體分析</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{assessmentResult.analysisSummary}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">可參考原因</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                {assessmentResult.reasons.slice(0, 4).map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">補件建議</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                {assessmentResult.requiredDocuments.slice(0, 4).map((document) => (
                  <li key={document}>• {document}</li>
                ))}
              </ul>
            </div>
          </div>

          {assessmentResult.recommendedActions.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">建議下一步</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                {assessmentResult.recommendedActions.slice(0, 4).map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-medium text-brand-700">預估狀況</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {assessmentResult.primaryRecommendation === '暫不建議承作'
                ? '目前條件較不適合直接承作，建議先由專員進一步確認。'
                : assessmentResult.primaryRecommendation === '人工覆核'
                  ? '目前屬於需要專員進一步審視的案件，建議先聯絡客服。'
                  : `目前較適合先往「${assessmentResult.primaryRecommendation}」方向評估。`}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="brand"
            className="flex-1"
            onClick={() => window.open('https://lin.ee/8ZzehUW', '_blank', 'noopener,noreferrer')}
          >
            聯絡官方 LINE
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={async () => {
              const content = [
                `主推方案：${assessmentResult.primaryRecommendation}`,
                `次選方案：${assessmentResult.secondaryRecommendation ?? '暫無'}`,
                `風險等級：${assessmentResult.riskLevel}`,
                `分數：${assessmentResult.score}`,
                `分析：${assessmentResult.analysisSummary}`,
                `推薦動作：${assessmentResult.recommendedActions.join('；')}`,
                `預估需求：${formatCurrency(formData.fundingNeed || 0)}`
              ].join('\n')

              try {
                await navigator.clipboard.writeText(content)
                setLocalError('已複製整體分析內容。')
              } catch {
                setLocalError('複製失敗，請手動複製。')
              }
            }}
          >
            複製分析內容
          </Button>
        </div>
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
        <div className="fixed inset-0 z-40 bg-slate-950/15 backdrop-blur-[2px]">
          <div className="absolute bottom-4 right-4 w-[calc(100vw-2rem)] max-w-md">
            <Card className="overflow-hidden border-slate-200 bg-[#EAF6EA] shadow-lift">
              <CardHeader className="flex items-center justify-between bg-[#06C755] text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-white/20">
                    <BrandMark className="h-full w-full scale-[0.92]" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">貸款智能初審客服</CardTitle>
                    <p className="mt-1 text-xs text-white/85">LINE 對話風格 / 可自由聊天</p>
                  </div>
                </div>
                <button onClick={close} className="rounded-full p-1 text-white/90 hover:bg-white/15">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="flex h-[min(78vh,760px)] flex-col gap-4 p-4">
                <div
                  className="rounded-[28px] border border-[#D8E8D8] bg-[#DDEEDD] p-4 shadow-soft"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7) 0, rgba(255,255,255,0.25) 22%, transparent 23%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.18) 20%, transparent 21%), linear-gradient(180deg, rgba(240,248,240,0.98), rgba(220,235,220,0.98))'
                  }}
                >
                  <div className="mb-3 flex items-center justify-between text-xs text-[#4B5B4B]">
                    <span>像 LINE 一樣直接聊，隨時可換話題</span>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium text-[#2F6E3D]">自由聊天中</span>
                  </div>

                <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
                  {messages.map(renderMessageBubble)}
                  {assistantTyping ? (
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1.5 ring-1 ring-white/70">
                          <BrandMark className="h-full w-full scale-[0.92]" />
                        </div>
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/70 bg-white px-4 py-3 text-sm leading-6 text-slate-500 shadow-sm">
                        正在整理回覆...
                      </div>
                    </div>
                  ) : null}
                  {assessmentResult ? renderAssessmentCard() : null}
                  <div ref={messagesEndRef} />
                </div>
                </div>

                <div className="rounded-[26px] border border-[#D8E8D8] bg-white/95 p-3 shadow-soft backdrop-blur">
                  <div className="mb-2 text-xs text-slate-500">
                    你可以像 LINE 一樣直接傳訊息，也可以中途換話題，不用照順序回答。
                  </div>
                  <Textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void handleSend()
                      }
                    }}
                    placeholder="例如：我名下有車貸，這樣可以走哪個方案？"
                    className="min-h-[76px] resize-none border-slate-200 bg-white focus-visible:ring-brand-500"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    {preview.success ? '目前資料可直接送件，您也可以繼續聊天補充細節。' : '目前仍可繼續聊天補充條件，不用一次填完。'}
                  </div>
                  {localError ? <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{localError}</div> : null}
                  <div className="mt-3 flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setInputValue('')}>
                      清除
                    </Button>
                    <Button
                      type="button"
                      variant="brand"
                      size="sm"
                      onClick={() => window.open('https://lin.ee/8ZzehUW', '_blank', 'noopener,noreferrer')}
                    >
                      聯絡客服
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={close}>
                      收起
                    </Button>
                    <div className="ml-auto flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSubmitLead}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '送出中...' : '送出案件'}
                      </Button>
                      <Button type="button" variant="brand" size="sm" onClick={handleSend} disabled={!inputValue.trim() || assistantTyping}>
                        傳送
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
