import { evaluateLoanIntake } from '@/lib/loan-rules'
import type {
  DashboardStats,
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
}

const passwordHash = {
  admin: 'admin1234',
  sales: 'sales1234'
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
    needManualReview: recommendation.needManualReview
  }
}

export const demoLeads: DemoLead[] = [
  makeLead(
    'lead_001',
    {
      fundingNeed: 260000,
      fundingUse: '公司營運周轉',
      jobType: '上班族',
      monthlyIncome: 62000,
      hasPayroll: true,
      hasLaborInsurance: true,
      hasTaxRecords: true,
      hasCreditCard: true,
      hasRevolving: false,
      hasOtherLoans: false,
      monthlyDebtPayment: 8000,
      recentLatePayment: false,
      hasNegotiationOrBankruptcy: false,
      hasCar: false,
      hasHouse: false,
      hasGuarantor: false,
      fullName: '王志明',
      phone: '0911222333',
      lineId: 'mingw2026'
    },
    { status: 'HIGH_INTENT', assignedSalesId: 'user_sales' }
  ),
  makeLead(
    'lead_002',
    {
      fundingNeed: 1200000,
      fundingUse: '房屋裝修與債務整合',
      jobType: '自由工作者',
      monthlyIncome: 88000,
      hasPayroll: false,
      hasLaborInsurance: true,
      hasTaxRecords: true,
      hasCreditCard: true,
      hasRevolving: true,
      hasOtherLoans: true,
      monthlyDebtPayment: 38000,
      recentLatePayment: true,
      hasNegotiationOrBankruptcy: false,
      hasCar: true,
      hasHouse: true,
      hasGuarantor: true,
      fullName: '林雅婷',
      phone: '0922333444',
      lineId: 'linyating_fin'
    },
    { status: 'REVIEWING', assignedSalesId: 'user_sales' }
  ),
  makeLead(
    'lead_003',
    {
      fundingNeed: 90000,
      fundingUse: '短期資金需求',
      jobType: '餐飲業',
      monthlyIncome: 36000,
      hasPayroll: false,
      hasLaborInsurance: false,
      hasTaxRecords: false,
      hasCreditCard: false,
      hasRevolving: false,
      hasOtherLoans: false,
      monthlyDebtPayment: 3000,
      recentLatePayment: false,
      hasNegotiationOrBankruptcy: false,
      hasCar: true,
      hasHouse: false,
      hasGuarantor: false,
      fullName: '陳柏宇',
      phone: '0933555666',
      lineId: 'poyu_loan'
    },
    { status: 'CONTACT_PENDING', assignedSalesId: null }
  ),
  makeLead(
    'lead_004',
    {
      fundingNeed: 180000,
      fundingUse: '整合信用卡與生活周轉',
      jobType: '服務業',
      monthlyIncome: 45000,
      hasPayroll: true,
      hasLaborInsurance: true,
      hasTaxRecords: false,
      hasCreditCard: true,
      hasRevolving: true,
      hasOtherLoans: true,
      monthlyDebtPayment: 22000,
      recentLatePayment: false,
      hasNegotiationOrBankruptcy: false,
      hasCar: false,
      hasHouse: false,
      hasGuarantor: false,
      fullName: '黃思涵',
      phone: '0944666777',
      lineId: 'sihan07'
    },
    { status: 'NEW', assignedSalesId: null }
  )
]

export const demoFollowUps: DemoFollowUp[] = [
  {
    id: 'log_001',
    leadId: 'lead_001',
    note: '已初步確認薪轉與工作年資，待補身分證與薪轉明細。',
    status: 'HIGH_INTENT',
    createdAt: new Date().toISOString(),
    createdBy: 'user_sales'
  },
  {
    id: 'log_002',
    leadId: 'lead_002',
    note: '有遲繳與卡循紀錄，需先人工覆核並評估房屋二胎或整合負債。',
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
