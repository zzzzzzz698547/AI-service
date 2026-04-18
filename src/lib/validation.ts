import { z } from 'zod'

const moneySchema = z.coerce.number().int().min(0)

export const leadIntakeSchema = z.object({
  fundingNeed: moneySchema.min(10000).max(5000000),
  fundingUse: z.string().min(2).max(120),
  jobType: z.string().min(1).max(60),
  monthlyIncome: moneySchema.min(0).max(2000000),
  hasPayroll: z.coerce.boolean(),
  hasLaborInsurance: z.coerce.boolean(),
  hasTaxRecords: z.coerce.boolean(),
  hasCreditCard: z.coerce.boolean(),
  hasRevolving: z.coerce.boolean(),
  hasOtherLoans: z.coerce.boolean(),
  monthlyDebtPayment: moneySchema.min(0).max(2000000),
  recentLatePayment: z.coerce.boolean(),
  hasNegotiationOrBankruptcy: z.coerce.boolean(),
  hasCar: z.coerce.boolean(),
  hasHouse: z.coerce.boolean(),
  hasGuarantor: z.coerce.boolean(),
  fullName: z.string().min(2).max(50),
  phone: z.string().regex(/^09\d{8}$/),
  lineId: z.string().min(2).max(40)
})

export const leadAnswerItemSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()])
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
