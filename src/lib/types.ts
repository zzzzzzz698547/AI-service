export type Role = 'ADMIN' | 'SALES'

export type LeadStatus =
  | 'NEW'
  | 'CONTACT_PENDING'
  | 'QUALIFIED'
  | 'HIGH_INTENT'
  | 'CONVERTED'
  | 'REVIEWING'
  | 'DECLINED'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type LoanRecommendation =
  | '信用貸款'
  | '汽車貸款'
  | '汽車增貸'
  | '機車貸款'
  | '房屋二胎'
  | '代書貸款'
  | '整合負債'
  | '商品貸'
  | '人工覆核'
  | '暫不建議承作'

export type NotificationChannel = 'EMAIL' | 'LINE' | 'TELEGRAM'

export type LeadAnswerKey =
  | 'fundingNeed'
  | 'fundingUse'
  | 'jobType'
  | 'monthlyIncome'
  | 'hasPayroll'
  | 'hasLaborInsurance'
  | 'hasTaxRecords'
  | 'hasCreditCard'
  | 'hasRevolving'
  | 'hasOtherLoans'
  | 'monthlyDebtPayment'
  | 'recentLatePayment'
  | 'hasNegotiationOrBankruptcy'
  | 'hasCar'
  | 'hasHouse'
  | 'hasGuarantor'
  | 'fullName'
  | 'phone'
  | 'lineId'

export type LeadAnswerValue = string | number | boolean

export type LeadAnswerInput = {
  key: LeadAnswerKey
  value: LeadAnswerValue
}

export type LeadIntakeInput = {
  fundingNeed: number
  fundingUse: string
  jobType: string
  monthlyIncome: number
  hasPayroll: boolean
  hasLaborInsurance: boolean
  hasTaxRecords: boolean
  hasCreditCard: boolean
  hasRevolving: boolean
  hasOtherLoans: boolean
  monthlyDebtPayment: number
  recentLatePayment: boolean
  hasNegotiationOrBankruptcy: boolean
  hasCar: boolean
  hasHouse: boolean
  hasGuarantor: boolean
  fullName: string
  phone: string
  lineId: string
}

export type RecommendationResult = {
  primaryRecommendation: LoanRecommendation
  secondaryRecommendation?: LoanRecommendation | null
  riskLevel: RiskLevel
  score: number
  reasons: string[]
  requiredDocuments: string[]
  needManualReview: boolean
}

export type DashboardStats = {
  newLeads: number
  pendingContacts: number
  highIntent: number
  converted: number
}
