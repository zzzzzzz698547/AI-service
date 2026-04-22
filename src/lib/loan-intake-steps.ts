import type { LeadAnswerKey, LeadIntakeInput } from '@/lib/types'

export type StepKind = 'money' | 'number' | 'text' | 'boolean' | 'select' | 'phone' | 'date'

export type StepOption = {
  label: string
  value: string
}

export type IntakeStep = {
  key: LeadAnswerKey
  label: string
  description: string
  kind: StepKind
  placeholder?: string
  options?: StepOption[]
}

export const intakeSteps: IntakeStep[] = [
  {
    key: 'incomeProofProfile',
    label: '有無勞保或薪轉',
    description: '請先選目前是否有薪轉、勞保或兩者都有。',
    kind: 'select',
    options: [
      { label: '都沒有', value: 'none' },
      { label: '只有薪轉', value: 'payroll' },
      { label: '只有勞保', value: 'laborInsurance' },
      { label: '薪轉 + 勞保都有', value: 'both' }
    ]
  },
  { key: 'laborInsuranceYears', label: '目前在職工作期間多久', description: '請填目前工作年資，單位為年。', kind: 'number', placeholder: '例如 3' },
  {
    key: 'bankLoanSummary',
    label: '名下有哪些貸款 / 分別哪間.種類.額度.期數.繳幾期.有無遲繳.遲繳幾天',
    description: '若有多筆，請每筆分行或用 / 分隔；例如：中國信託｜房貸｜120萬｜240期｜已繳36期｜無遲繳；裕融｜車貸｜48萬｜60期｜已繳10期｜遲繳1次約7天。沒有請填「無」。',
    kind: 'text',
    placeholder: '例如：中國信託｜房貸｜120萬｜240期｜已繳36期｜無遲繳；裕融｜車貸｜48萬｜60期｜已繳10期｜遲繳1次約7天'
  },
  {
    key: 'creditCardSummary',
    label: '有無信用卡',
    description: '若有，請填銀行名稱、持卡多久、額度、已使用多少、是否繳清或繳最低。',
    kind: 'text',
    placeholder: '例如：台新 3 年 / 額度 10 萬 / 已用 2 萬 / 繳最低'
  },
  { key: 'hasBankWarningAccount', label: '是否為警示戶', description: '是否有警示戶、管制戶或異常帳戶紀錄。', kind: 'boolean' },
  { key: 'hasCriminalRecord', label: '是否有前科', description: '是否有刑事前科或司法紀錄。', kind: 'boolean' },
  {
    key: 'bankFinanceIssueProfile',
    label: '銀行跟融資是否有呆帳 / 協商',
    description: '請選目前是否有銀行或融資呆帳、協商、或兩者皆有。',
    kind: 'select',
    options: [
      { label: '都沒有', value: 'none' },
      { label: '只有銀行呆帳', value: 'bankDebt' },
      { label: '只有融資呆帳', value: 'financeDebt' },
      { label: '銀行與融資都有呆帳', value: 'both' },
      { label: '只有協商 / 更生', value: 'negotiation' },
      { label: '銀行呆帳 + 協商', value: 'bankDebtAndNegotiation' },
      { label: '融資呆帳 + 協商', value: 'financeDebtAndNegotiation' },
      { label: '呆帳 + 協商都存在', value: 'bothAndNegotiation' }
    ]
  },
  {
    key: 'vehicleTaxArrearsSummary',
    label: '有無罰單 (有)多少',
    description: '若有，請直接填「有，金額」；若沒有請填「無」。',
    kind: 'text',
    placeholder: '例如：有，3600 / 無'
  },
  {
    key: 'vehicleProfile',
    label: '有無汽車或機車 / 有無汽車駕照',
    description: '請先選目前名下是否有汽車、機車或兩者都有，並一併確認是否有汽車駕照。',
    kind: 'select',
    options: [
      { label: '都沒有', value: 'none' },
      { label: '只有機車', value: 'motorcycle' },
      { label: '只有汽車', value: 'car' },
      { label: '汽車 + 機車都有', value: 'both' }
    ]
  },
  { key: 'hasHouseLand', label: '有無不動產', description: '是否名下有房屋或土地。', kind: 'boolean' },
  { key: 'phone', label: '聯絡電話', description: '請填寫 09 開頭手機號碼。', kind: 'phone', placeholder: '0912345678' },
  { key: 'lineId', label: 'LINE ID', description: '請填寫可聯繫的 LINE ID。', kind: 'text', placeholder: 'mylineid' }
]

function parseVehicleTaxArrearsAmount(summary: string) {
  const match = summary.match(/(\d[\d,]*)/)
  return match ? Number(match[1].replace(/,/g, '')) : 0
}

export function getIncomeProofBooleans(profile: LeadIntakeInput['incomeProofProfile']) {
  return {
    hasPayroll: profile === 'payroll' || profile === 'both',
    hasLaborInsurance: profile === 'laborInsurance' || profile === 'both'
  }
}

export function getVehicleBooleans(profile: LeadIntakeInput['vehicleProfile']) {
  return {
    hasCar: profile === 'car' || profile === 'both',
    hasMotorcycle: profile === 'motorcycle' || profile === 'both'
  }
}

export function getBankFinanceIssueFlags(profile: LeadIntakeInput['bankFinanceIssueProfile']) {
  const hasDebt = profile === 'bankDebt' || profile === 'financeDebt' || profile === 'both' || profile.includes('Debt')
  const hasNegotiationOrBankruptcy = profile.includes('Negotiation') || profile === 'negotiation'

  return {
    hasNegotiationOrBankruptcy,
    creditRiskProfile:
      profile === 'none'
        ? 'none'
        : profile === 'negotiation'
          ? 'negotiationOrBankruptcy'
          : hasDebt && hasNegotiationOrBankruptcy
            ? 'multipleRisks'
            : hasDebt
              ? 'recentLatePayment'
              : 'none'
  } as const
}

export function getVehicleTaxArrearsFlags(summary: string) {
  const normalized = summary.trim()
  const amount = parseVehicleTaxArrearsAmount(normalized)
  const hasVehicleTaxArrears = /^(有|yes|y|true)/i.test(normalized) || amount > 0

  return {
    hasVehicleTaxArrears,
    vehicleTaxArrearsAmount: hasVehicleTaxArrears ? amount : 0
  }
}

export const intakeDefaults: LeadIntakeInput = {
  fullName: '',
  birthDate: '1900-01-01',
  nationalId: 'A123456789',
  householdRegistrationAddress: '未提供',
  currentResidenceAddress: '未提供',
  currentJobTitle: '未提供',
  laborInsuranceYears: 0,
  monthlySalary: 0,
  hasPayroll: false,
  hasLaborInsurance: false,
  incomeProofProfile: 'none',
  hasVehicleTaxArrears: false,
  vehicleTaxArrearsAmount: 0,
  vehicleTaxArrearsSummary: '無',
  hasCriminalRecord: false,
  criminalRecordCharge: '無',
  hasCourtDeduction: false,
  hasBankWarningAccount: false,
  hasCar: false,
  hasMotorcycle: false,
  hasHouseLand: false,
  vehicleProfile: 'none',
  bankFinanceIssueProfile: 'none',
  assetProfile: 'none',
  debtProfile: 'none',
  creditRiskProfile: 'none',
  hasNegotiationOrBankruptcy: false,
  bankLoanSummary: '無',
  financeLoanSummary: '無',
  pawnshopLoanSummary: '無',
  privateLoanSummary: '無',
  creditCardSummary: '無',
  fundingNeed: 300000,
  fundingUse: '未提供',
  recentBankFinanceLoanApplication: '無',
  repaymentHistorySummary: '無',
  totalLoanTermSummary: '無',
  hasDrivingLicense: false,
  existingLoans: [],
  phone: '0900000000',
  lineId: '未提供'
}
