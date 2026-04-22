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
  | '房貸'
  | '買車找錢'
  | '原車融資'
  | '汽車改裝分期'
  | '機車改裝分期'
  | '汽車貸款'
  | '汽車增貸'
  | '機車貸款'
  | '商品貸款'
  | '手機貸款'
  | '呆帳專案'
  | '房屋二胎'
  | '代書貸款'
  | '整合負債'
  | '商品貸'
  | '人工覆核'
  | '暫不建議承作'

export type NotificationChannel = 'EMAIL' | 'LINE' | 'TELEGRAM'

export type IncomeProofProfile = 'none' | 'payroll' | 'laborInsurance' | 'both'

export type BankFinanceIssueProfile =
  | 'none'
  | 'bankDebt'
  | 'financeDebt'
  | 'both'
  | 'negotiation'
  | 'bankDebtAndNegotiation'
  | 'financeDebtAndNegotiation'
  | 'bothAndNegotiation'

export type VehicleProfile = 'none' | 'motorcycle' | 'car' | 'both'

export type AssetProfile =
  | 'none'
  | 'motorcycle'
  | 'car'
  | 'houseLand'
  | 'carAndMotorcycle'
  | 'carAndHouse'
  | 'allAssets'

export type DebtProfile =
  | 'none'
  | 'cardRevolving'
  | 'otherLoans'
  | 'multipleLoans'
  | 'heavyDebt'

export type CreditRiskProfile =
  | 'none'
  | 'recentLatePayment'
  | 'negotiationOrBankruptcy'
  | 'warningAccount'
  | 'courtDeduction'
  | 'criminalRecord'
  | 'vehicleTaxArrears'
  | 'multipleRisks'

export type ExistingLoanRecord = {
  name: string
  company: string
  transactionType: '購買' | '增貸' | '其他'
  totalAmount: number
  totalInstallments: number
  paidInstallments: number
  hasLatePayment: boolean
  latePaymentDays?: number
}

export type LeadAnswerKey =
  | 'fullName'
  | 'birthDate'
  | 'nationalId'
  | 'householdRegistrationAddress'
  | 'currentResidenceAddress'
  | 'currentJobTitle'
  | 'laborInsuranceYears'
  | 'monthlySalary'
  | 'hasPayroll'
  | 'hasLaborInsurance'
  | 'incomeProofProfile'
  | 'hasVehicleTaxArrears'
  | 'vehicleTaxArrearsAmount'
  | 'vehicleTaxArrearsSummary'
  | 'hasCriminalRecord'
  | 'criminalRecordCharge'
  | 'hasCourtDeduction'
  | 'hasBankWarningAccount'
  | 'hasCar'
  | 'hasMotorcycle'
  | 'hasHouseLand'
  | 'vehicleProfile'
  | 'bankFinanceIssueProfile'
  | 'assetProfile'
  | 'debtProfile'
  | 'creditRiskProfile'
  | 'bankLoanSummary'
  | 'financeLoanSummary'
  | 'pawnshopLoanSummary'
  | 'privateLoanSummary'
  | 'creditCardSummary'
  | 'fundingNeed'
  | 'fundingUse'
  | 'recentBankFinanceLoanApplication'
  | 'repaymentHistorySummary'
  | 'totalLoanTermSummary'
  | 'hasDrivingLicense'
  | 'existingLoans'
  | 'phone'
  | 'lineId'

export type LeadAnswerValue = string | number | boolean | Record<string, unknown> | unknown[]

export type LeadAnswerInput = {
  key: LeadAnswerKey
  value: LeadAnswerValue
}

export type AssistantReplySection = {
  title: string
  content: string[]
}

export type AssistantReplySnapshot = {
  provider: 'ollama' | 'fallback'
  model: string
  content: string
  sections: AssistantReplySection[]
}

export type LeadIntakeInput = {
  fullName: string
  birthDate: string
  nationalId: string
  householdRegistrationAddress: string
  currentResidenceAddress: string
  currentJobTitle: string
  laborInsuranceYears: number
  monthlySalary: number
  hasPayroll: boolean
  hasLaborInsurance: boolean
  incomeProofProfile: IncomeProofProfile
  hasVehicleTaxArrears: boolean
  vehicleTaxArrearsAmount: number
  vehicleTaxArrearsSummary: string
  hasCriminalRecord: boolean
  criminalRecordCharge: string
  hasCourtDeduction: boolean
  hasBankWarningAccount: boolean
  hasCar: boolean
  hasMotorcycle: boolean
  hasHouseLand: boolean
  vehicleProfile: VehicleProfile
  bankFinanceIssueProfile: BankFinanceIssueProfile
  assetProfile: AssetProfile
  debtProfile: DebtProfile
  creditRiskProfile: CreditRiskProfile
  hasNegotiationOrBankruptcy: boolean
  bankLoanSummary: string
  financeLoanSummary: string
  pawnshopLoanSummary: string
  privateLoanSummary: string
  creditCardSummary: string
  fundingNeed: number
  fundingUse: string
  recentBankFinanceLoanApplication: string
  repaymentHistorySummary: string
  totalLoanTermSummary: string
  hasDrivingLicense: boolean
  existingLoans: ExistingLoanRecord[]
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
  analysisSummary: string
  recommendedActions: string[]
}

export type DashboardStats = {
  newLeads: number
  pendingContacts: number
  highIntent: number
  converted: number
}
