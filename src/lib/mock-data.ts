import { buildAssistantReplySnapshot, buildAssistantReplyContent } from '@/lib/assistant-reply'
import { evaluateLoanIntake } from '@/lib/loan-rules'
import type {
  AssistantReplySnapshot,
  DashboardStats,
  ExistingLoanRecord,
  LeadIntakeInput,
  LeadStatus,
  LoanRecommendation,
  NotificationChannel,
  Role,
  RiskLevel
} from '@/lib/types'

export type DemoUser = {
  id: string
  name: string
  email: string
  role: Role
  passwordHash: string
}

export type DemoFollowUp = {
  id: string
  leadId: string
  note: string
  status: LeadStatus
  createdAt: string
  createdBy: string
}

export type DemoNotification = {
  id: string
  leadId: string
  channel: NotificationChannel
  target: string
  status: 'QUEUED' | 'SENT' | 'SKIPPED'
  createdAt: string
}

export type DemoLead = LeadIntakeInput & {
  id: string
  createdAt: string
  updatedAt: string
  status: LeadStatus
  assignedSalesId: string | null
  score: number
  riskLevel: RiskLevel
  primaryRecommendation: LoanRecommendation
  secondaryRecommendation: LoanRecommendation | null
  reasons: string[]
  requiredDocuments: string[]
  needManualReview: boolean
  analysisSummary: string
  recommendedActions: string[]
  intakeSnapshot: LeadIntakeInput
  assistantReplySnapshot: AssistantReplySnapshot | null
}

const passwordHash = {
  admin: 'admin1234',
  sales: 'sales1234'
}

function createLoanRecord(record: Partial<ExistingLoanRecord>): ExistingLoanRecord {
  return {
    name: record.name ?? '',
    company: record.company ?? '',
    transactionType: record.transactionType ?? '購買',
    totalAmount: record.totalAmount ?? 0,
    totalInstallments: record.totalInstallments ?? 0,
    paidInstallments: record.paidInstallments ?? 0,
    hasLatePayment: record.hasLatePayment ?? false,
    latePaymentDays: record.latePaymentDays
  }
}

export const demoUsers: DemoUser[] = [
  {
    id: 'user_admin',
    name: '系統管理員',
    email: 'admin@loanflow.tw',
    role: 'ADMIN',
    passwordHash: passwordHash.admin
  },
  {
    id: 'user_sales',
    name: '業務專員',
    email: 'sales@loanflow.tw',
    role: 'SALES',
    passwordHash: passwordHash.sales
  }
]

function makeLead(id: string, data: LeadIntakeInput, meta: Partial<Pick<DemoLead, 'status' | 'assignedSalesId'>> = {}): DemoLead {
  const recommendation = evaluateLoanIntake(data)
  const assistantReplyContent = buildAssistantReplyContent({
    applicantName: data.fullName,
    recommendation
  })

  return {
    id,
    ...data,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    status: meta.status ?? 'NEW',
    assignedSalesId: meta.assignedSalesId ?? null,
    score: recommendation.score,
    riskLevel: recommendation.riskLevel,
    primaryRecommendation: recommendation.primaryRecommendation,
    secondaryRecommendation: recommendation.secondaryRecommendation ?? null,
    reasons: recommendation.reasons,
    requiredDocuments: recommendation.requiredDocuments,
    needManualReview: recommendation.needManualReview,
    analysisSummary: recommendation.analysisSummary,
    recommendedActions: recommendation.recommendedActions,
    intakeSnapshot: data,
    assistantReplySnapshot: buildAssistantReplySnapshot(
      {
        provider: 'fallback',
        model: 'demo',
        content: assistantReplyContent
      },
      {
        applicantName: data.fullName,
        recommendation
      }
    )
  }
}

export const demoLeads: DemoLead[] = [
  makeLead(
    'lead_001',
    {
      fullName: '王志明',
      birthDate: '1991-04-18',
      nationalId: 'A123456789',
      householdRegistrationAddress: '台北市中山區...',
      currentResidenceAddress: '新北市板橋區...',
      currentJobTitle: '業務主任',
      laborInsuranceYears: 6,
      monthlySalary: 62000,
      hasPayroll: true,
      hasLaborInsurance: true,
      incomeProofProfile: 'both',
      assetProfile: 'none',
      debtProfile: 'cardRevolving',
      creditRiskProfile: 'none',
      hasNegotiationOrBankruptcy: false,
      hasVehicleTaxArrears: false,
      vehicleTaxArrearsAmount: 0,
      vehicleTaxArrearsSummary: '無',
      hasCriminalRecord: false,
      criminalRecordCharge: '',
      hasCourtDeduction: false,
      hasBankWarningAccount: false,
      hasCar: false,
      hasMotorcycle: false,
      hasHouseLand: false,
      vehicleProfile: 'none',
      bankFinanceIssueProfile: 'none',
      bankLoanSummary: '無',
      financeLoanSummary: '無',
      pawnshopLoanSummary: '無',
      privateLoanSummary: '無',
      creditCardSummary: '中信 20萬 / 繳最低 / 卡循 0',
      fundingNeed: 260000,
      fundingUse: '公司營運周轉',
      recentBankFinanceLoanApplication: '近三個月未送件',
      repaymentHistorySummary: '信用良好，無遲繳',
      totalLoanTermSummary: '目前無其他分期貸款',
      hasDrivingLicense: true,
      phone: '0911222333',
      lineId: 'mingw2026',
      existingLoans: []
    },
    { status: 'HIGH_INTENT', assignedSalesId: 'user_sales' }
  ),
  makeLead(
    'lead_002',
    {
      fullName: '林雅婷',
      birthDate: '1988-11-02',
      nationalId: 'B223456789',
      householdRegistrationAddress: '桃園市桃園區...',
      currentResidenceAddress: '新北市新莊區...',
      currentJobTitle: '自由工作者',
      laborInsuranceYears: 3,
      monthlySalary: 88000,
      hasPayroll: false,
      hasLaborInsurance: true,
      incomeProofProfile: 'laborInsurance',
      assetProfile: 'carAndHouse',
      debtProfile: 'multipleLoans',
      creditRiskProfile: 'recentLatePayment',
      hasNegotiationOrBankruptcy: false,
      hasVehicleTaxArrears: false,
      vehicleTaxArrearsAmount: 0,
      vehicleTaxArrearsSummary: '無',
      hasCriminalRecord: false,
      criminalRecordCharge: '',
      hasCourtDeduction: false,
      hasBankWarningAccount: false,
      hasCar: true,
      hasMotorcycle: false,
      hasHouseLand: true,
      vehicleProfile: 'car',
      bankFinanceIssueProfile: 'both',
      bankLoanSummary: '中國信託房貸 / 120萬 / 240期 / 已繳36期 / 無遲繳',
      financeLoanSummary: '裕融 / 80萬 / 84期 / 已繳18期 / 遲繳1次',
      pawnshopLoanSummary: '無',
      privateLoanSummary: '民間借款 30萬 / 月繳12000 / 有遲繳',
      creditCardSummary: '國泰 20萬 / 繳最低 / 卡循 3萬',
      fundingNeed: 1200000,
      fundingUse: '房屋裝修與債務整合',
      recentBankFinanceLoanApplication: '2026-03 送件玉山銀行 / 未過件',
      repaymentHistorySummary: '車貸與融資貸款曾有遲繳紀錄，每次約 7 天',
      totalLoanTermSummary: '房貸 240 期已繳 36 期；車貸 60 期已繳 10 期',
      hasDrivingLicense: true,
      phone: '0922333444',
      lineId: 'linyating_fin',
      existingLoans: [
        createLoanRecord({
          name: '房屋貸款',
          company: '中國信託',
          transactionType: '購買',
          totalAmount: 1200000,
          totalInstallments: 240,
          paidInstallments: 36,
          hasLatePayment: false
        }),
        createLoanRecord({
          name: '車貸',
          company: '和潤',
          transactionType: '增貸',
          totalAmount: 480000,
          totalInstallments: 60,
          paidInstallments: 10,
          hasLatePayment: true,
          latePaymentDays: 7
        })
      ]
    },
    { status: 'REVIEWING', assignedSalesId: 'user_sales' }
  ),
  makeLead(
    'lead_003',
    {
      fullName: '陳柏宇',
      birthDate: '1995-07-08',
      nationalId: 'C323456789',
      householdRegistrationAddress: '台中市南屯區...',
      currentResidenceAddress: '台中市南區...',
      currentJobTitle: '餐飲店長',
      laborInsuranceYears: 1,
      monthlySalary: 36000,
      hasPayroll: false,
      hasLaborInsurance: false,
      incomeProofProfile: 'none',
      assetProfile: 'carAndMotorcycle',
      debtProfile: 'none',
      creditRiskProfile: 'vehicleTaxArrears',
      hasNegotiationOrBankruptcy: false,
      hasVehicleTaxArrears: true,
      vehicleTaxArrearsAmount: 3600,
      vehicleTaxArrearsSummary: '有，3600',
      hasCriminalRecord: false,
      criminalRecordCharge: '',
      hasCourtDeduction: false,
      hasBankWarningAccount: false,
      hasCar: true,
      hasMotorcycle: true,
      hasHouseLand: false,
      vehicleProfile: 'both',
      bankFinanceIssueProfile: 'none',
      bankLoanSummary: '無',
      financeLoanSummary: '無',
      pawnshopLoanSummary: '無',
      privateLoanSummary: '無',
      creditCardSummary: '無信用卡',
      fundingNeed: 90000,
      fundingUse: '短期資金需求',
      recentBankFinanceLoanApplication: '2026-02 送件台新銀行 / 未過件',
      repaymentHistorySummary: '無明顯遲繳，但收入波動較大',
      totalLoanTermSummary: '目前無其他貸款',
      hasDrivingLicense: true,
      phone: '0933555666',
      lineId: 'poyu_loan',
      existingLoans: []
    },
    { status: 'CONTACT_PENDING', assignedSalesId: null }
  ),
  makeLead(
    'lead_004',
    {
      fullName: '黃思涵',
      birthDate: '1990-01-12',
      nationalId: 'D423456789',
      householdRegistrationAddress: '高雄市苓雅區...',
      currentResidenceAddress: '高雄市前鎮區...',
      currentJobTitle: '美業顧問',
      laborInsuranceYears: 4,
      monthlySalary: 45000,
      hasPayroll: true,
      hasLaborInsurance: true,
      incomeProofProfile: 'both',
      assetProfile: 'none',
      debtProfile: 'otherLoans',
      creditRiskProfile: 'none',
      hasNegotiationOrBankruptcy: false,
      hasVehicleTaxArrears: false,
      vehicleTaxArrearsAmount: 0,
      vehicleTaxArrearsSummary: '無',
      hasCriminalRecord: false,
      criminalRecordCharge: '',
      hasCourtDeduction: false,
      hasBankWarningAccount: false,
      hasCar: false,
      hasMotorcycle: false,
      hasHouseLand: false,
      vehicleProfile: 'none',
      bankFinanceIssueProfile: 'financeDebt',
      bankLoanSummary: '無',
      financeLoanSummary: '台灣企銀 / 30萬 / 36期 / 已繳12期 / 無遲繳',
      pawnshopLoanSummary: '無',
      privateLoanSummary: '民間借款 12萬 / 已繳半年 / 無遲繳',
      creditCardSummary: '玉山 12萬 / 繳最低 / 卡循 2萬',
      fundingNeed: 180000,
      fundingUse: '整合信用卡與生活周轉',
      recentBankFinanceLoanApplication: '2026-01 送件永豐銀行 / 過件但未承作',
      repaymentHistorySummary: '近半年無明顯遲繳',
      totalLoanTermSummary: '融資貸款 36 期已繳 12 期',
      hasDrivingLicense: false,
      phone: '0944666777',
      lineId: 'sihan07',
      existingLoans: [
        createLoanRecord({
          name: '融資貸款',
          company: '台灣企銀',
          transactionType: '增貸',
          totalAmount: 300000,
          totalInstallments: 36,
          paidInstallments: 12,
          hasLatePayment: false
        })
      ]
    },
    { status: 'NEW', assignedSalesId: null }
  )
]

export const demoFollowUps: DemoFollowUp[] = [
  {
    id: 'log_001',
    leadId: 'lead_001',
    note: '已確認薪轉與年資穩定，初步適合信用貸款方向。',
    status: 'HIGH_INTENT',
    createdAt: new Date().toISOString(),
    createdBy: 'user_sales'
  },
  {
    id: 'log_002',
    leadId: 'lead_002',
    note: '有遲繳與多筆貸款壓力，需先人工覆核並評估房屋二胎與整合負債。',
    status: 'REVIEWING',
    createdAt: new Date().toISOString(),
    createdBy: 'user_admin'
  }
]

export const demoNotifications: DemoNotification[] = [
  {
    id: 'noti_001',
    leadId: 'lead_001',
    channel: 'EMAIL',
    target: 'crm@loanflow.tw',
    status: 'SKIPPED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'noti_002',
    leadId: 'lead_001',
    channel: 'LINE',
    target: 'line-webhook',
    status: 'SKIPPED',
    createdAt: new Date().toISOString()
  }
]

export function demoStats(): DashboardStats {
  const today = new Date().toDateString()
  const todayLeads = demoLeads.filter((lead) => new Date(lead.createdAt).toDateString() === today)

  return {
    newLeads: todayLeads.length,
    pendingContacts: demoLeads.filter((lead) => lead.status === 'CONTACT_PENDING' || lead.status === 'NEW').length,
    highIntent: demoLeads.filter((lead) => lead.status === 'HIGH_INTENT').length,
    converted: demoLeads.filter((lead) => lead.status === 'CONVERTED').length
  }
}
