import { z } from 'zod'

const moneySchema = z.coerce.number().int().min(0)
const incomeProofProfileSchema = z.enum(['none', 'payroll', 'laborInsurance', 'both'])
const bankFinanceIssueProfileSchema = z.enum([
  'none',
  'bankDebt',
  'financeDebt',
  'both',
  'negotiation',
  'bankDebtAndNegotiation',
  'financeDebtAndNegotiation',
  'bothAndNegotiation'
])
const vehicleProfileSchema = z.enum(['none', 'motorcycle', 'car', 'both'])
const assetProfileSchema = z.enum(['none', 'motorcycle', 'car', 'houseLand', 'carAndMotorcycle', 'carAndHouse', 'allAssets'])
const debtProfileSchema = z.enum(['none', 'cardRevolving', 'otherLoans', 'multipleLoans', 'heavyDebt'])
const creditRiskProfileSchema = z.enum([
  'none',
  'recentLatePayment',
  'negotiationOrBankruptcy',
  'warningAccount',
  'courtDeduction',
  'criminalRecord',
  'vehicleTaxArrears',
  'multipleRisks'
])
const existingLoanSchema = z.object({
  name: z.string().min(1).max(60),
  company: z.string().min(1).max(60),
  transactionType: z.enum(['購買', '增貸', '其他']),
  totalAmount: moneySchema.max(100000000),
  totalInstallments: z.coerce.number().int().min(0).max(600),
  paidInstallments: z.coerce.number().int().min(0).max(600),
  hasLatePayment: z.coerce.boolean(),
  latePaymentDays: z.coerce.number().int().min(0).max(365).optional()
})

export const leadIntakeSchema = z.object({
  fullName: z.string().min(2).max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nationalId: z.string().regex(/^[A-Z][12]\d{8}$/i),
  householdRegistrationAddress: z.string().min(2).max(120),
  currentResidenceAddress: z.string().min(2).max(120),
  currentJobTitle: z.string().min(1).max(60),
  laborInsuranceYears: z.coerce.number().int().min(0).max(80),
  monthlySalary: moneySchema.min(0).max(2000000),
  hasPayroll: z.coerce.boolean(),
  hasLaborInsurance: z.coerce.boolean(),
  incomeProofProfile: incomeProofProfileSchema.default('none'),
  bankFinanceIssueProfile: bankFinanceIssueProfileSchema.default('none'),
  vehicleProfile: vehicleProfileSchema.default('none'),
  assetProfile: assetProfileSchema.default('none'),
  debtProfile: debtProfileSchema.default('none'),
  creditRiskProfile: creditRiskProfileSchema.default('none'),
  hasNegotiationOrBankruptcy: z.coerce.boolean().default(false),
  hasVehicleTaxArrears: z.coerce.boolean(),
  vehicleTaxArrearsAmount: moneySchema.max(2000000),
  vehicleTaxArrearsSummary: z.string().max(500),
  hasCriminalRecord: z.coerce.boolean(),
  criminalRecordCharge: z.string().max(120),
  hasCourtDeduction: z.coerce.boolean(),
  hasBankWarningAccount: z.coerce.boolean(),
  hasCar: z.coerce.boolean(),
  hasMotorcycle: z.coerce.boolean(),
  hasHouseLand: z.coerce.boolean(),
  bankLoanSummary: z.string().max(1200),
  financeLoanSummary: z.string().max(500),
  pawnshopLoanSummary: z.string().max(500),
  privateLoanSummary: z.string().max(500),
  creditCardSummary: z.string().max(500),
  fundingNeed: moneySchema.min(10000).max(5000000),
  fundingUse: z.string().min(2).max(120),
  recentBankFinanceLoanApplication: z.string().max(500),
  repaymentHistorySummary: z.string().max(500),
  totalLoanTermSummary: z.string().max(500),
  hasDrivingLicense: z.coerce.boolean(),
  existingLoans: z.array(existingLoanSchema).max(3).default([]),
  phone: z.string().regex(/^09\d{8}$/),
  lineId: z.string().min(2).max(40)
})

export const leadAnswerItemSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.record(z.unknown())])
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'SALES'])
})

export const noteSchema = z.object({
  content: z.string().min(2).max(500)
})

export const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACT_PENDING', 'QUALIFIED', 'HIGH_INTENT', 'CONVERTED', 'REVIEWING', 'DECLINED'])
})

export { existingLoanSchema }
