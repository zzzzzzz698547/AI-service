import { formatCurrency } from '@/lib/utils'
import type { ExistingLoanRecord, LeadIntakeInput, RecommendationResult } from '@/lib/types'

type RuleContext = {
  score: number
  reasons: string[]
  documents: Set<string>
  flags: {
    hasStableIncome: boolean
    hasPayroll: boolean
    hasLaborInsurance: boolean
    hasAsset: boolean
    hasDebtPressure: boolean
    hasNegativeCreditEvent: boolean
    hasLoanRecord: boolean
    likelyManualReview: boolean
    urgentCaution: boolean
  }
}

type Rule = {
  id: string
  apply: (input: LeadIntakeInput, ctx: RuleContext) => void
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, '')
}

function hasText(value: string) {
  const normalized = normalizeText(value)
  if (!normalized) return false
  return !/^無+$/.test(normalized) && !/^(沒有|无|沒填|未填)/.test(normalized)
}

function parseMoneyFromText(text: string) {
  const matches = [...text.matchAll(/(\d[\d,]*)/g)].map((match) => Number(match[1].replace(/,/g, '')))
  return matches.length ? Math.max(...matches) : 0
}

function parseLateDaysFromText(text: string) {
  const match = text.replace(/,/g, '').match(/遲繳[^0-9]*(\d{1,3})\s*天/)
  return match ? Number(match[1]) : 0
}

function hasSevereLateSignal(text: string) {
  if (!hasText(text)) return false
  const normalized = text.replace(/\s+/g, '')
  const lateDays = parseLateDaysFromText(normalized)
  return (
    /嚴重|多次|頻繁/.test(normalized) ||
    ((/遲繳|逾期|未繳/.test(normalized) || lateDays > 0) && lateDays > 15) ||
    /遲繳超過15天|逾期超過15天/.test(normalized)
  )
}

function parseCreditCardSummary(summary: string) {
  const normalized = summary.trim().replace(/\s+/g, '')
  const hasCard = normalized && !/^(無信用卡|沒有信用卡|無卡|沒有卡|none)$/i.test(normalized)
  const noCard = !hasCard || /^(無|沒有)$/i.test(normalized)

  let tenureMonths = 0
  const yearMatch = normalized.match(/(\d+(?:\.\d+)?)年/)
  const monthMatch = normalized.match(/(\d+(?:\.\d+)?)個?月/)
  if (yearMatch) {
    tenureMonths = Math.round(Number(yearMatch[1]) * 12)
  } else if (monthMatch) {
    tenureMonths = Math.round(Number(monthMatch[1]))
  }

  return {
    hasCard: Boolean(hasCard),
    noCard,
    underThreeMonths: Boolean(hasCard) && tenureMonths > 0 && tenureMonths < 3,
    tenureMonths,
    limitAmount: parseMoneyFromText(normalized),
    usedAmount: (() => {
      const usedMatch = normalized.match(/已使用(\d[\d,]*)/)
      return usedMatch ? Number(usedMatch[1].replace(/,/g, '')) : 0
    })(),
    paymentMode: /繳清/.test(normalized) ? '繳清' : /繳最低/.test(normalized) ? '繳最低' : '未明確'
  }
}

function summarizeLoanSignals(input: LeadIntakeInput) {
  const loanSummary = summarizeExistingLoans(input.existingLoans)
  const cardSummary = parseCreditCardSummary(input.creditCardSummary)
  const allTexts = [
    input.bankLoanSummary,
    input.financeLoanSummary,
    input.pawnshopLoanSummary,
    input.privateLoanSummary,
    input.creditCardSummary,
    input.repaymentHistorySummary,
    ...input.existingLoans.map((loan) => `${loan.name} ${loan.company} ${loan.hasLatePayment ? '遲繳' : '正常'} ${loan.latePaymentDays ?? ''}`)
  ].join(' ')

  const hasBankBlockers =
    input.hasBankWarningAccount ||
    cardSummary.noCard ||
    cardSummary.underThreeMonths ||
    input.bankFinanceIssueProfile.includes('bankDebt') ||
    input.bankFinanceIssueProfile.includes('negotiation') ||
    hasSevereLateSignal(allTexts)

  const hasSevereLatePayment = hasSevereLateSignal(allTexts)
  const hasRecentApprovalHint = /剛核准|剛核貸|近期核准|新核准|已核准|過件|核准/.test(allTexts)
  const paidHalfLoanCount = loanSummary.activeLoans.filter((loan) => loan.totalInstallments > 0 && loan.paidInstallments / loan.totalInstallments >= 0.5).length
  const productPhoneLoanCount = loanSummary.activeLoans.filter((loan) => /商品|手機/.test(`${loan.name}${loan.company}`)).length

  return {
    loanSummary,
    cardSummary,
    hasBankBlockers,
    hasSevereLatePayment,
    hasRecentApprovalHint,
    paidHalfLoanCount,
    productPhoneLoanCount
  }
}

function summarizeExistingLoans(loans: ExistingLoanRecord[]) {
  const activeLoans = loans.filter((loan) => hasText(loan.name) || hasText(loan.company) || loan.totalAmount > 0)
  const totalAmount = activeLoans.reduce((sum, loan) => sum + (loan.totalAmount || 0), 0)
  const totalPaid = activeLoans.reduce((sum, loan) => sum + (loan.paidInstallments || 0), 0)
  const lateCount = activeLoans.filter((loan) => loan.hasLatePayment).length

  return {
    activeLoans,
    totalAmount,
    totalPaid,
    lateCount
  }
}

function describeAssetProfile(profile: LeadIntakeInput['assetProfile']) {
  const labels: Record<LeadIntakeInput['assetProfile'], string> = {
    none: '沒有車房',
    motorcycle: '只有機車',
    car: '有汽車',
    houseLand: '有房屋土地',
    carAndMotorcycle: '汽車 + 機車',
    carAndHouse: '汽車 + 房屋土地',
    allAssets: '汽機車與房屋土地都有'
  }
  return labels[profile] ?? '未提供'
}

function describeDebtProfile(profile: LeadIntakeInput['debtProfile']) {
  const labels: Record<LeadIntakeInput['debtProfile'], string> = {
    none: '沒有其他貸款 / 卡循',
    cardRevolving: '主要為信用卡循環',
    otherLoans: '有其他貸款但可控',
    multipleLoans: '多筆貸款並存',
    heavyDebt: '負債壓力偏高'
  }
  return labels[profile] ?? '未提供'
}

function describeCreditRiskProfile(profile: LeadIntakeInput['creditRiskProfile']) {
  const labels: Record<LeadIntakeInput['creditRiskProfile'], string> = {
    none: '沒有明顯異常',
    recentLatePayment: '近期有遲繳 / 逾期',
    negotiationOrBankruptcy: '協商 / 更生',
    warningAccount: '警示戶',
    courtDeduction: '法院扣款 / 強制執行',
    criminalRecord: '有前科',
    vehicleTaxArrears: '監理站欠費 / 罰單',
    multipleRisks: '多項風險並存'
  }
  return labels[profile] ?? '未提供'
}

function buildRuleContext(): RuleContext {
  return {
    score: 50,
    reasons: [],
    documents: new Set<string>(),
    flags: {
      hasStableIncome: false,
      hasPayroll: false,
      hasLaborInsurance: false,
      hasAsset: false,
      hasDebtPressure: false,
      hasNegativeCreditEvent: false,
      hasLoanRecord: false,
      likelyManualReview: false,
      urgentCaution: false
    }
  }
}

const baseRules: Rule[] = [
  {
    id: 'identity',
    apply: (input, ctx) => {
      if (input.fullName) ctx.documents.add('身分證正反面')
      if (input.nationalId) ctx.documents.add('身分證字號核對')
      if (input.birthDate) ctx.documents.add('出生年月日核對')
      if (input.currentResidenceAddress) ctx.documents.add('現居地地址證明')
      if (input.householdRegistrationAddress) ctx.documents.add('戶籍地地址證明')
    }
  },
  {
    id: 'income',
    apply: (input, ctx) => {
      const salary = input.monthlySalary
      if (salary >= 100000) {
        ctx.score += 24
        ctx.flags.hasStableIncome = true
        ctx.reasons.push(`月薪 ${formatCurrency(salary)}，具備較佳授信基礎。`)
      } else if (salary >= 60000) {
        ctx.score += 18
        ctx.flags.hasStableIncome = true
        ctx.reasons.push(`月薪 ${formatCurrency(salary)}，屬於中高收入區間。`)
      } else if (salary >= 35000) {
        ctx.score += 10
        ctx.reasons.push(`月薪 ${formatCurrency(salary)}，可先搭配其他條件評估。`)
      } else {
        ctx.score += 2
        ctx.reasons.push(`月薪偏低，需仰賴薪轉、年資或資產補強。`)
      }

      if (input.laborInsuranceYears >= 5) {
        ctx.score += 10
        ctx.reasons.push(`任職年資 ${input.laborInsuranceYears} 年，工作穩定性較佳。`)
      } else if (input.laborInsuranceYears >= 2) {
        ctx.score += 6
        ctx.reasons.push(`任職年資 ${input.laborInsuranceYears} 年，可作為基本穩定度參考。`)
      } else if (input.laborInsuranceYears > 0) {
        ctx.score += 2
        ctx.reasons.push(`任職年資較短，建議搭配薪轉或保人補強。`)
      }
    }
  },
  {
    id: 'proofs',
    apply: (input, ctx) => {
      if (input.hasPayroll) {
        ctx.score += 14
        ctx.flags.hasPayroll = true
        ctx.documents.add('薪轉證明')
      } else {
        ctx.score -= 4
        ctx.reasons.push('未提供薪轉紀錄，需補收入佐證文件。')
      }

      if (input.hasLaborInsurance) {
        ctx.score += 8
        ctx.flags.hasLaborInsurance = true
        ctx.documents.add('勞保或工會資料')
      } else {
        ctx.score -= 3
        ctx.reasons.push('未提供勞健保或工會資料，審核將更看重其他佐證。')
      }
    }
  },
  {
    id: 'vehicle-tax',
    apply: (input, ctx) => {
      if (input.hasVehicleTaxArrears) {
        ctx.score -= 14
        ctx.flags.urgentCaution = true
        ctx.reasons.push(`監理站欠費 ${formatCurrency(input.vehicleTaxArrearsAmount)}，建議先補繳或說明原因。`)
        ctx.documents.add('監理站欠費繳清證明')
      }
    }
  },
  {
    id: 'legal',
    apply: (input, ctx) => {
      if (input.hasCriminalRecord) {
        ctx.score -= 18
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.urgentCaution = true
        ctx.reasons.push(`有前科紀錄：${input.criminalRecordCharge || '未詳述'}，需人工覆核。`)
      }
      if (input.hasNegotiationOrBankruptcy) {
        ctx.score -= 30
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.flags.urgentCaution = true
        ctx.reasons.push('有協商 / 更生 / 重大信用異常，建議先人工覆核。')
      }
      if (input.hasCourtDeduction) {
        ctx.score -= 24
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push('存在法院強制扣款，建議先人工覆核。')
        ctx.documents.add('扣薪或強制執行明細')
      }
      if (input.hasBankWarningAccount) {
        ctx.score -= 40
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push('銀行帳戶為警示戶，風險顯著提高。')
      }
    }
  },
  {
    id: 'assets',
    apply: (input, ctx) => {
      if (input.hasCar) {
        ctx.score += 18
        ctx.flags.hasAsset = true
        ctx.documents.add('車籍資料')
      }
      if (input.hasMotorcycle) {
        ctx.score += 8
        ctx.flags.hasAsset = true
        ctx.documents.add('機車行照或車籍資料')
      }
      if (input.hasHouseLand) {
        ctx.score += 24
        ctx.flags.hasAsset = true
        ctx.documents.add('房屋權狀或土地登記謄本')
      }
    }
  },
  {
    id: 'debt-profile',
    apply: (input, ctx) => {
      const cardSummary = parseCreditCardSummary(input.creditCardSummary)
      const summaries = [
        input.bankLoanSummary,
        input.financeLoanSummary,
        input.pawnshopLoanSummary,
        input.privateLoanSummary,
        input.creditCardSummary
      ]

      const hasAnyLoanSummary = summaries.some(hasText) || input.existingLoans.length > 0

      if (hasAnyLoanSummary) {
        ctx.flags.hasLoanRecord = true
        ctx.documents.add('現有貸款清單')
      }

      if (hasText(input.creditCardSummary) && /(卡循|循環|循環利息|最低)/i.test(input.creditCardSummary)) {
        ctx.score -= 12
        ctx.flags.hasDebtPressure = true
        ctx.reasons.push('信用卡使用存在循環或繳最低情況，需留意負債壓力。')
      }

      if (cardSummary.noCard) {
        ctx.score -= 4
        ctx.reasons.push('目前無信用卡，銀行方案通常不列入優先考量。')
      } else if (cardSummary.underThreeMonths) {
        ctx.score -= 4
        ctx.reasons.push('信用卡持卡未滿 3 個月，銀行方案通常不列入考量。')
      }

      if (input.bankFinanceIssueProfile.includes('bankDebt')) {
        ctx.score -= 18
        ctx.flags.hasNegativeCreditEvent = true
        ctx.reasons.push('銀行端有呆帳紀錄，銀行方案不列入優先考量。')
      }

      if (input.bankFinanceIssueProfile.includes('negotiation')) {
        ctx.score -= 20
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push('銀行端有協商 / 更生紀錄，建議先人工覆核。')
      }

      if (input.bankFinanceIssueProfile.includes('financeDebt')) {
        ctx.score -= 10
        ctx.reasons.push('融資端有呆帳紀錄，需先評估專案型方案或人工覆核。')
      }

      if (hasText(input.bankLoanSummary)) {
        const penalty = /遲繳|逾期|未繳/.test(input.bankLoanSummary) ? 8 : 0
        ctx.score += 4 - penalty
        if (penalty > 0) {
          ctx.flags.likelyManualReview = true
          ctx.reasons.push('銀行貸款摘要中出現遲繳或逾期紀錄。')
        }
      }

      if (hasText(input.financeLoanSummary)) {
        ctx.score -= /遲繳|逾期|未繳/.test(input.financeLoanSummary) ? 12 : 2
        if (/遲繳|逾期|未繳/.test(input.financeLoanSummary)) {
          ctx.flags.hasNegativeCreditEvent = true
          ctx.reasons.push('融資貸款摘要含遲繳或逾期內容。')
        }
      }

      if (hasText(input.pawnshopLoanSummary)) {
        ctx.score -= 4
      }

      if (hasText(input.privateLoanSummary)) {
        ctx.score -= /高利|遲繳|逾期|未繳/.test(input.privateLoanSummary) ? 14 : 6
        if (/高利|遲繳|逾期|未繳/.test(input.privateLoanSummary)) {
          ctx.flags.hasNegativeCreditEvent = true
          ctx.reasons.push('民間借款摘要含高利或遲繳訊號。')
        }
      }

      const loanSummary = summarizeExistingLoans(input.existingLoans)
      if (loanSummary.activeLoans.length) {
        ctx.score -= Math.min(18, loanSummary.activeLoans.length * 4)
        ctx.flags.hasDebtPressure = true
        ctx.reasons.push(`已有 ${loanSummary.activeLoans.length} 筆既有貸款明細，需計算整體月付與還款壓力。`)
      }
      if (loanSummary.lateCount > 0) {
        ctx.score -= 12
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push(`既有貸款明細中有 ${loanSummary.lateCount} 筆遲繳紀錄。`)
      }
      if (loanSummary.totalAmount > 0) {
        ctx.reasons.push(`既有貸款總額約 ${formatCurrency(loanSummary.totalAmount)}。`)
      }
    }
  },
  {
    id: 'usage-and-requests',
    apply: (input, ctx) => {
      if (/整合|周轉|卡費|債務/i.test(input.fundingUse)) {
        ctx.reasons.push('本次用途偏向周轉或整合負債，將優先評估月付與清償結構。')
      }

      if (/未過件|婉拒|失敗|駁回/.test(input.recentBankFinanceLoanApplication)) {
        ctx.score -= 8
        ctx.flags.urgentCaution = true
        ctx.reasons.push('近三個月內有送件未過件紀錄，需保守評估。')
      }

      if (/遲繳|逾期|未準時|頻繁/.test(input.repaymentHistorySummary)) {
        ctx.score -= 14
        ctx.flags.hasNegativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push('貸款繳款摘要出現遲繳或逾期訊號。')
      }

      const totalTerms = parseMoneyFromText(input.totalLoanTermSummary)
      if (totalTerms > 0) {
        ctx.reasons.push(`貸款期數摘要中可辨識到數值 ${totalTerms}，可作為後續核對依據。`)
      }

      if (input.fundingNeed >= 1000000) {
        ctx.score -= 14
        ctx.reasons.push('本次預貸金額超過百萬，通常需要更完整的財力或抵押補強。')
      } else if (input.fundingNeed >= 500000) {
        ctx.score -= 8
        ctx.reasons.push('本次預貸金額偏高，建議補強收入或資產證明。')
      } else if (input.fundingNeed <= 150000) {
        ctx.score += 4
      }

      if (input.hasDrivingLicense) {
        ctx.score += 3
        ctx.reasons.push('有汽車駕照，車貸或汽機車方案的可操作性較高。')
      } else if (input.hasCar) {
        ctx.score -= 2
        ctx.reasons.push('名下有車但未提供汽車駕照，車貸方案需再確認實際使用與承作方式。')
      }
    }
  }
]

function getPrimaryRecommendation(input: LeadIntakeInput, ctx: RuleContext) {
  const loanSignals = summarizeLoanSignals(input)
  const loanSummary = loanSignals.loanSummary
  const severeRiskProfile =
    input.creditRiskProfile === 'warningAccount' ||
    input.creditRiskProfile === 'courtDeduction' ||
    input.creditRiskProfile === 'negotiationOrBankruptcy' ||
    input.creditRiskProfile === 'multipleRisks' ||
    input.hasBankWarningAccount ||
    input.hasCourtDeduction ||
    input.hasNegotiationOrBankruptcy

  const negativeConditions =
    ctx.flags.hasNegativeCreditEvent ||
    severeRiskProfile ||
    (input.hasCriminalRecord && input.monthlySalary < 40000)

  if (negativeConditions && !ctx.flags.hasAsset && input.monthlySalary < 35000) {
    return '暫不建議承作'
  }
  if (severeRiskProfile) {
    return '人工覆核'
  }
  if (input.hasHouseLand && !loanSignals.hasBankBlockers) return '房貸'
  if (input.bankFinanceIssueProfile !== 'none' && (input.hasCar || input.hasMotorcycle)) return '呆帳專案'
  if (input.hasCar && loanSummary.activeLoans.length > 0) {
    const carLoan = loanSummary.activeLoans.find((loan) => /車|汽車/.test(`${loan.name}${loan.company}`))
    if (carLoan && carLoan.totalInstallments > 0 && carLoan.paidInstallments / carLoan.totalInstallments >= 0.5 && !loanSignals.hasSevereLatePayment) {
      return '原車融資'
    }
  }
  if (input.hasCar && (loanSignals.hasRecentApprovalHint || loanSignals.hasSevereLatePayment === false)) {
    const lateDays = Math.max(
      ...input.existingLoans
        .map((loan) => loan.latePaymentDays ?? 0)
        .filter((value) => Number.isFinite(value)),
      0
    )
    if (lateDays > 0 && lateDays <= 15) {
      return '汽車改裝分期'
    }
    if (loanSignals.hasRecentApprovalHint) {
      return '汽車改裝分期'
    }
  }
  if (input.hasMotorcycle) {
    const lateDays = Math.max(
      ...input.existingLoans
        .map((loan) => loan.latePaymentDays ?? 0)
        .filter((value) => Number.isFinite(value)),
      0
    )
    if (lateDays > 0 && lateDays <= 15) {
      return '機車改裝分期'
    }
    return '機車貸款'
  }
  if (!input.hasCar && (input.hasDrivingLicense || input.laborInsuranceYears >= 0.25 || ctx.flags.hasPayroll || ctx.flags.hasLaborInsurance)) {
    const overHalfLoan = loanSummary.activeLoans.some((loan) => loan.totalInstallments > 0 && loan.paidInstallments / loan.totalInstallments >= 0.5)
    if (overHalfLoan && !loanSignals.hasSevereLatePayment) {
      return '買車找錢'
    }
  }
  if (loanSignals.productPhoneLoanCount <= 5 && input.fundingNeed <= 120000) {
    return '手機貸款'
  }
  if (loanSignals.productPhoneLoanCount <= 5 && input.fundingNeed <= 200000) {
    return '商品貸款'
  }
  if (ctx.flags.hasDebtPressure && hasText(input.creditCardSummary)) return '整合負債'
  if (!loanSignals.hasBankBlockers && ctx.flags.hasStableIncome && input.monthlySalary >= 35000) return '信用貸款'
  if (!ctx.flags.hasPayroll && !ctx.flags.hasLaborInsurance && !ctx.flags.hasAsset) {
    if (input.monthlySalary < 30000) return '商品貸'
    return '代書貸款'
  }
  if (loanSignals.hasBankBlockers) return input.bankFinanceIssueProfile !== 'none' && (input.hasCar || input.hasMotorcycle) ? '呆帳專案' : '人工覆核'
  return '信用貸款'
}

function getSecondaryRecommendation(primary: string, input: LeadIntakeInput, ctx: RuleContext): RecommendationResult['secondaryRecommendation'] {
  const candidates: RecommendationResult['secondaryRecommendation'][] = []
  const loanSignals = summarizeLoanSignals(input)
  const loanSummary = loanSignals.loanSummary

  if (primary !== '信用貸款' && ctx.flags.hasStableIncome && !loanSignals.hasBankBlockers) candidates.push('信用貸款')
  if (primary !== '房貸' && input.hasHouseLand && !loanSignals.hasBankBlockers) candidates.push('房貸')
  if (primary !== '買車找錢' && !input.hasCar && (input.hasDrivingLicense || input.laborInsuranceYears >= 0.25 || ctx.flags.hasPayroll || ctx.flags.hasLaborInsurance)) candidates.push('買車找錢')
  if (primary !== '原車融資' && input.hasCar && loanSummary.activeLoans.some((loan) => /車|汽車/.test(`${loan.name}${loan.company}`))) candidates.push('原車融資')
  if (primary !== '汽車改裝分期' && input.hasCar && loanSignals.hasRecentApprovalHint) candidates.push('汽車改裝分期')
  if (primary !== '機車改裝分期' && input.hasMotorcycle && loanSignals.hasRecentApprovalHint) candidates.push('機車改裝分期')
  if (primary !== '汽車貸款' && primary !== '汽車增貸' && input.hasCar) candidates.push('汽車貸款')
  if (primary !== '機車貸款' && input.hasMotorcycle) candidates.push('機車貸款')
  if (primary !== '呆帳專案' && input.bankFinanceIssueProfile !== 'none' && (input.hasCar || input.hasMotorcycle)) candidates.push('呆帳專案')
  if (primary !== '整合負債' && ctx.flags.hasDebtPressure) candidates.push('整合負債')
  if (primary !== '人工覆核' && ctx.flags.likelyManualReview) candidates.push('人工覆核')
  if (primary !== '代書貸款' && !ctx.flags.hasPayroll && !ctx.flags.hasLaborInsurance && loanSummary.activeLoans.length > 0) {
    candidates.push('代書貸款')
  }
  if (primary !== '手機貸款' && loanSignals.productPhoneLoanCount <= 5 && input.fundingNeed <= 120000) candidates.push('手機貸款')
  if (primary !== '商品貸款' && loanSignals.productPhoneLoanCount <= 5 && input.fundingNeed <= 200000) candidates.push('商品貸款')
  if (primary !== '商品貸' && input.monthlySalary < 35000) candidates.push('商品貸')

  return candidates[0] ?? null
}

function deriveRiskLevel(score: number, ctx: RuleContext) {
  if (ctx.flags.hasNegativeCreditEvent || score < 25) return 'CRITICAL'
  if (score < 45) return 'HIGH'
  if (score < 70) return 'MEDIUM'
  return 'LOW'
}

function deriveDocuments(ctx: RuleContext, input: LeadIntakeInput) {
  if (input.fullName) ctx.documents.add('身分證正反面')
  if (input.hasPayroll) ctx.documents.add('薪轉明細')
  if (input.hasLaborInsurance) ctx.documents.add('勞保或工會資料')
  if (!ctx.flags.hasStableIncome) ctx.documents.add('收入證明')
  if (input.hasHouseLand) ctx.documents.add('房屋權狀或土地登記謄本')
  if (input.hasCar) ctx.documents.add('車籍資料')
  if (input.hasMotorcycle) ctx.documents.add('機車行照')
  if (input.hasDrivingLicense) ctx.documents.add('汽車駕照')
  if (input.hasVehicleTaxArrears) ctx.documents.add('監理站欠費繳清證明')
  if (input.hasCourtDeduction) ctx.documents.add('扣薪或法院強制執行明細')
  if (input.hasNegotiationOrBankruptcy) ctx.documents.add('協商 / 更生相關文件')
  if (input.bankFinanceIssueProfile !== 'none') ctx.documents.add('銀行 / 融資呆帳協商明細')
  if (input.creditCardSummary) ctx.documents.add('信用卡帳單或卡循明細')
  if (input.existingLoans.some((loan) => hasText(loan.name) || hasText(loan.company))) {
    ctx.documents.add('既有貸款明細')
  }
  return [...ctx.documents]
}

function buildAnalysisSummary(input: LeadIntakeInput, ctx: RuleContext, primaryRecommendation: string, riskLevel: string) {
  const strengths: string[] = []
  const risks: string[] = []
  const nextSteps: string[] = []
  const creditCardState = parseCreditCardSummary(input.creditCardSummary)

  if (ctx.flags.hasPayroll) strengths.push('有薪轉')
  if (ctx.flags.hasLaborInsurance) strengths.push('有勞健保或工會')
  if (ctx.flags.hasAsset) strengths.push('有可評估資產')
  if (input.laborInsuranceYears >= 2) strengths.push(`年資 ${input.laborInsuranceYears} 年以上`)
  if (input.monthlySalary >= 60000) strengths.push(`月薪 ${formatCurrency(input.monthlySalary)} 以上`)

  if (input.hasBankWarningAccount) risks.push('警示戶')
  if (input.hasCourtDeduction) risks.push('法院扣款')
  if (input.hasNegotiationOrBankruptcy) risks.push('協商 / 更生')
  if (input.hasCriminalRecord) risks.push('前科')
  if (input.hasVehicleTaxArrears) risks.push('監理站欠費')
  if (creditCardState.noCard) risks.push('無信用卡，銀行方案不列入優先考量')
  if (creditCardState.underThreeMonths) risks.push('信用卡持卡未滿 3 個月')
  if (input.bankFinanceIssueProfile.includes('bankDebt')) risks.push('銀行呆帳')
  if (input.bankFinanceIssueProfile.includes('negotiation')) risks.push('銀行協商 / 更生')
  if (input.bankFinanceIssueProfile.includes('financeDebt')) risks.push('融資呆帳')
  if (ctx.flags.hasDebtPressure) risks.push('負債壓力偏高')
  if (ctx.flags.hasNegativeCreditEvent) risks.push('信用異常紀錄')

  if (input.assetProfile !== 'none') strengths.push(`資產輪廓：${describeAssetProfile(input.assetProfile)}`)
  if (input.debtProfile !== 'none') strengths.push(`負債輪廓：${describeDebtProfile(input.debtProfile)}`)
  if (input.creditRiskProfile !== 'none') risks.push(`信用風險輪廓：${describeCreditRiskProfile(input.creditRiskProfile)}`)

  if (primaryRecommendation === '暫不建議承作') {
    nextSteps.push('先處理負面紀錄與債務結構，再重新評估')
  } else if (primaryRecommendation === '人工覆核') {
    nextSteps.push('交由資深審核人員確認補件與風險')
  } else if (primaryRecommendation === '房貸' || primaryRecommendation === '買車找錢' || primaryRecommendation === '呆帳專案') {
    nextSteps.push('先由專員確認估值、條件與可承作額度')
  } else {
    nextSteps.push('先補足收入與資產文件，提升送件成功率')
  }

  if (input.existingLoans.some((loan) => loan.hasLatePayment)) {
    nextSteps.push('既有貸款如有遲繳，務必先整理最新還款狀況')
  }

  const strengthsText = strengths.length ? strengths.join('、') : '目前尚無明顯加分條件'
  const risksText = risks.length ? risks.join('、') : '暫無明顯重大風險'
  const nextStepsText = nextSteps.join('，')
  const backupText = ctx.flags.hasLoanRecord || input.existingLoans.length > 0 ? '可同步保留備案方案與人工覆核空間。' : '目前可先聚焦主推方案。'

  return `整體來看，這位客戶目前屬於 ${riskLevel} 風險，主推方案為「${primaryRecommendation}」。優勢包含：${strengthsText}；需要留意的部分則是：${risksText}。建議下一步先完成補件與負債整理，再依最終條件決定送件方向。${backupText}${nextStepsText ? ` ${nextStepsText}` : ''}`
}

function buildRecommendedActions(input: LeadIntakeInput, ctx: RuleContext, primaryRecommendation: string) {
  const actions = new Set<string>()

  if (primaryRecommendation === '房貸') {
    actions.add('先準備房屋市值、房貸餘額與產權資料，交由專員估值')
  }
  if (primaryRecommendation === '買車找錢') {
    actions.add('補勞保年資、汽車駕照與既有貸款明細，由專員看配車與額度')
  }
  if (primaryRecommendation === '原車融資') {
    actions.add('補車貸明細、結清金額與車況資料，先看可拉額度')
  }
  if (primaryRecommendation === '汽車改裝分期' || primaryRecommendation === '機車改裝分期') {
    actions.add('補車籍或行照資料，並確認是否有 15 天內遲繳紀錄')
  }
  if (primaryRecommendation === '機車貸款') {
    actions.add('補行照、勞保年資與工作穩定資料，先看 10 萬或 25 萬方向')
  }
  if (primaryRecommendation === '商品貸款' || primaryRecommendation === '手機貸款') {
    actions.add('整理商品貸與手機貸合計筆數，確認是否不超過 5 筆')
  }
  if (primaryRecommendation === '呆帳專案') {
    actions.add('補呆帳或協商文件、車籍資料，讓專員先評估可承作額度')
  }
  if (primaryRecommendation === '房屋二胎') {
    actions.add('優先補房屋權狀、土地謄本與近三個月收入資料')
  }
  if (primaryRecommendation === '汽車貸款' || primaryRecommendation === '汽車增貸') {
    actions.add('補車籍資料、行照與目前車貸明細')
  }
  if (primaryRecommendation === '整合負債') {
    actions.add('整理所有既有貸款與信用卡帳單，先算出整體月付')
  }
  if (primaryRecommendation === '代書貸款' || primaryRecommendation === '商品貸') {
    actions.add('補強收入證明、工作年資與聯絡資訊')
  }
  if (ctx.flags.hasNegativeCreditEvent || ctx.flags.likelyManualReview) {
    actions.add('先由人工覆核，確認是否需要補件或緩送')
  }
  if (input.creditRiskProfile !== 'none') {
    actions.add('先整理信用風險與法務狀況，再決定送件方向')
  }
  if (input.creditCardSummary) {
    actions.add('提供最新信用卡帳單與卡循明細')
  }
  if (!input.hasPayroll || !input.hasLaborInsurance) {
    actions.add('補近三個月帳戶往來或其他收入證明')
  }

  return [...actions]
}

export function evaluateLoanIntake(input: LeadIntakeInput): RecommendationResult {
  const context = buildAnalysisContext(input)
  const primaryRecommendation = getPrimaryRecommendation(input, context)
  const secondaryRecommendation = getSecondaryRecommendation(primaryRecommendation, input, context)
  const riskLevel = deriveRiskLevel(context.score, context)
  const requiredDocuments = deriveDocuments(context, input)
  const analysisSummary = buildAnalysisSummary(input, context, primaryRecommendation, riskLevel)
  const recommendedActions = buildRecommendedActions(input, context, primaryRecommendation)

  const needManualReview =
    context.flags.likelyManualReview ||
    riskLevel === 'HIGH' ||
    riskLevel === 'CRITICAL' ||
    primaryRecommendation === '人工覆核' ||
    primaryRecommendation === '暫不建議承作'

  if (riskLevel === 'CRITICAL' && primaryRecommendation !== '人工覆核') {
    context.reasons.push('風險等級已進入高風險區，需先人工覆核。')
  }

  return {
    primaryRecommendation,
    secondaryRecommendation,
    riskLevel,
    score: Math.max(0, Math.min(100, Math.round(context.score))),
    reasons: Array.from(new Set(context.reasons)),
    requiredDocuments,
    needManualReview,
    analysisSummary,
    recommendedActions
  }
}

function buildAnalysisContext(input: LeadIntakeInput) {
  const context = buildRuleContext()

  for (const rule of baseRules) {
    rule.apply(input, context)
  }

  if (input.monthlySalary >= 35000 && (input.hasPayroll || input.hasLaborInsurance)) {
    context.score += 4
  }

  return context
}

export const loanRuleCatalog = baseRules.map((rule) => rule.id)
