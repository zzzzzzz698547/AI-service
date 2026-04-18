import type { LeadAnswerKey, LeadIntakeInput } from '@/lib/types'

export type StepKind = 'money' | 'text' | 'boolean' | 'select' | 'phone'

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
  { key: 'fundingNeed', label: '資金需求', description: '請輸入希望申請的金額。', kind: 'money', placeholder: '例如 300000' },
  { key: 'fundingUse', label: '資金用途', description: '簡述這筆資金主要用途。', kind: 'text', placeholder: '例如：營運周轉、裝修、整合卡費' },
  {
    key: 'jobType',
    label: '職業類型',
    description: '選擇最接近你的工作型態。',
    kind: 'select',
    options: [
      { label: '上班族', value: '上班族' },
      { label: '自由工作者', value: '自由工作者' },
      { label: '餐飲業', value: '餐飲業' },
      { label: '服務業', value: '服務業' },
      { label: '製造業', value: '製造業' },
      { label: '其他', value: '其他' }
    ]
  },
  { key: 'monthlyIncome', label: '月收入', description: '請填寫平均月收入。', kind: 'money', placeholder: '例如 50000' },
  { key: 'hasPayroll', label: '是否有薪轉', description: '是否有銀行薪資轉帳紀錄。', kind: 'boolean' },
  { key: 'hasLaborInsurance', label: '是否有勞保', description: '是否有可查詢的勞保資料。', kind: 'boolean' },
  { key: 'hasTaxRecords', label: '是否有報稅資料', description: '是否能提供最近年度報稅資料。', kind: 'boolean' },
  { key: 'hasCreditCard', label: '是否有信用卡', description: '目前是否持有信用卡。', kind: 'boolean' },
  { key: 'hasRevolving', label: '是否有卡循', description: '目前是否有循環利息或卡循使用。', kind: 'boolean' },
  { key: 'hasOtherLoans', label: '是否有其他貸款', description: '目前是否還有其他借款。', kind: 'boolean' },
  { key: 'monthlyDebtPayment', label: '每月負債月付', description: '目前每月固定還款金額。', kind: 'money', placeholder: '例如 12000' },
  { key: 'recentLatePayment', label: '近期是否有遲繳', description: '近半年內是否有逾期。', kind: 'boolean' },
  { key: 'hasNegotiationOrBankruptcy', label: '是否有協商 / 更生 / 警示帳戶', description: '若有，系統會提高風險等級。', kind: 'boolean' },
  { key: 'hasCar', label: '是否名下有汽車', description: '是否可作為車貸或增貸評估。', kind: 'boolean' },
  { key: 'hasHouse', label: '是否名下有房屋', description: '是否可作為房屋二胎評估。', kind: 'boolean' },
  { key: 'hasGuarantor', label: '是否可提供保人', description: '若可提供保人，會提升補強條件。', kind: 'boolean' },
  { key: 'fullName', label: '姓名', description: '請填寫真實姓名。', kind: 'text', placeholder: '王小明' },
  { key: 'phone', label: '電話', description: '請填寫 09 開頭手機號碼。', kind: 'phone', placeholder: '0912345678' },
  { key: 'lineId', label: 'LINE ID', description: '方便後續聯繫的 LINE ID。', kind: 'text', placeholder: 'mylineid' }
]

export const intakeDefaults: LeadIntakeInput = {
  fundingNeed: 300000,
  fundingUse: '',
  jobType: '上班族',
  monthlyIncome: 50000,
  hasPayroll: true,
  hasLaborInsurance: true,
  hasTaxRecords: true,
  hasCreditCard: true,
  hasRevolving: false,
  hasOtherLoans: false,
  monthlyDebtPayment: 0,
  recentLatePayment: false,
  hasNegotiationOrBankruptcy: false,
  hasCar: false,
  hasHouse: false,
  hasGuarantor: false,
  fullName: '',
  phone: '',
  lineId: ''
}
