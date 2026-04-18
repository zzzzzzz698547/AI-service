import { formatCurrency } from '@/lib/utils'
import type { LeadIntakeInput, RecommendationResult } from '@/lib/types'

type RuleContext = {
  score: number
  reasons: string[]
  documents: Set<string>
  flags: {
    assetHeavy: boolean
    hasIncomeProof: boolean
    highDebt: boolean
    negativeCreditEvent: boolean
    carAvailable: boolean
    houseAvailable: boolean
    likelyManualReview: boolean
  }
}

type Rule = {
  id: string
  apply: (input: LeadIntakeInput, ctx: RuleContext) => void
}

const baseRules: Rule[] = [
  {
    id: 'income',
    apply: (input, ctx) => {
      if (input.monthlyIncome >= 70000) {
        ctx.score += 24
        ctx.reasons.push(`月收入 ${formatCurrency(input.monthlyIncome)}，具備較佳授信基礎。`)
      } else if (input.monthlyIncome >= 40000) {
        ctx.score += 14
        ctx.reasons.push(`月收入落在中段區間，適合先評估信用與薪轉條件。`)
      } else {
        ctx.score += 4
        ctx.reasons.push(`月收入偏低，需搭配資產或擔保條件評估。`)
      }
    }
  },
  {
    id: 'salary-proof',
    apply: (input, ctx) => {
      if (input.hasPayroll) {
        ctx.score += 14
        ctx.flags.hasIncomeProof = true
        ctx.documents.add('薪轉證明')
      } else {
        ctx.score -= 4
        ctx.reasons.push('無薪轉資料，建議補充收入證明或近三個月帳戶往來。')
      }
    }
  },
  {
    id: 'labor-insurance',
    apply: (input, ctx) => {
      if (input.hasLaborInsurance) {
        ctx.score += 8
        ctx.documents.add('勞保資料')
      } else {
        ctx.score -= 3
        ctx.reasons.push('未提供勞保資料，審核將更重視工作穩定性。')
      }
    }
  },
  {
    id: 'tax-records',
    apply: (input, ctx) => {
      if (input.hasTaxRecords) {
        ctx.score += 10
        ctx.documents.add('報稅資料')
      } else {
        ctx.score -= 2
        ctx.reasons.push('無報稅資料時，可能需要人工覆核。')
      }
    }
  },
  {
    id: 'credit-card',
    apply: (input, ctx) => {
      if (input.hasCreditCard) {
        ctx.score += 6
        ctx.documents.add('信用卡帳單或額度使用紀錄')
      }
      if (input.hasRevolving) {
        ctx.score -= 18
        ctx.flags.highDebt = true
        ctx.reasons.push('有卡循使用紀錄，需留意循環利息與負債比。')
      }
    }
  },
  {
    id: 'existing-loans',
    apply: (input, ctx) => {
      if (input.hasOtherLoans) {
        ctx.score -= 12
        ctx.flags.highDebt = true
        ctx.documents.add('現有貸款清單')
        ctx.reasons.push('已有其他貸款，需先評估負債整合或月付能力。')
      }
      if (input.monthlyDebtPayment >= input.monthlyIncome * 0.45) {
        ctx.score -= 16
        ctx.flags.highDebt = true
        ctx.reasons.push('每月負債月付偏高，整體負債比接近風險區。')
      } else if (input.monthlyDebtPayment >= input.monthlyIncome * 0.25) {
        ctx.score -= 8
        ctx.reasons.push('負債月付已占收入相當比例，需保守評估。')
      }
    }
  },
  {
    id: 'late-payment',
    apply: (input, ctx) => {
      if (input.recentLatePayment) {
        ctx.score -= 20
        ctx.flags.negativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push('近期有遲繳紀錄，建議先人工覆核。')
      }
      if (input.hasNegotiationOrBankruptcy) {
        ctx.score -= 40
        ctx.flags.negativeCreditEvent = true
        ctx.flags.likelyManualReview = true
        ctx.reasons.push('曾有協商、更生或警示帳戶，風險顯著升高。')
      }
    }
  },
  {
    id: 'assets',
    apply: (input, ctx) => {
      if (input.hasCar) {
        ctx.score += 18
        ctx.flags.carAvailable = true
        ctx.documents.add('車籍資料')
      }
      if (input.hasHouse) {
        ctx.score += 22
        ctx.flags.houseAvailable = true
        ctx.documents.add('房屋權狀或土地登記謄本')
      }
      if (input.hasGuarantor) {
        ctx.score += 8
        ctx.documents.add('保人資料')
      }
    }
  },
  {
    id: 'purpose',
    apply: (input, ctx) => {
      if (/整合|周轉|卡費|債務/i.test(input.fundingUse)) {
        ctx.reasons.push('資金用途偏向整合負債或周轉型需求。')
      }
      if (input.fundingNeed >= 500000) {
        ctx.score -= 6
        ctx.reasons.push('需求金額較高，通常需要更完整的資產或財力文件。')
      } else if (input.fundingNeed <= 200000) {
        ctx.score += 4
      }
    }
  }
]

function getPrimaryRecommendation(input: LeadIntakeInput, ctx: RuleContext) {
  if (ctx.flags.negativeCreditEvent && input.monthlyIncome < 35000 && !input.hasCar && !input.hasHouse && !input.hasGuarantor) {
    return '暫不建議承作'
  }
  if (ctx.flags.negativeCreditEvent) return '人工覆核'
  if (input.hasHouse && input.fundingNeed >= 300000) return '房屋二胎'
  if (input.hasCar && input.fundingNeed >= 120000) {
    return input.hasOtherLoans ? '汽車增貸' : '汽車貸款'
  }
  if (ctx.flags.highDebt && input.hasCreditCard) return '整合負債'
  if (input.jobType.includes('自由') && !ctx.flags.hasIncomeProof) return '代書貸款'
  if (input.monthlyIncome < 30000 && !input.hasCar && !input.hasHouse) return '商品貸'
  if (input.jobType.includes('機車') || input.fundingNeed <= 120000) return '機車貸款'
  return '信用貸款'
}

function getSecondaryRecommendation(primary: string, input: LeadIntakeInput, ctx: RuleContext): RecommendationResult['secondaryRecommendation'] {
  const candidates: RecommendationResult['secondaryRecommendation'][] = []
  if (primary !== '信用貸款' && input.monthlyIncome >= 35000) candidates.push('信用貸款')
  if (primary !== '整合負債' && ctx.flags.highDebt) candidates.push('整合負債')
  if (primary !== '人工覆核' && ctx.flags.likelyManualReview) candidates.push('人工覆核')
  if (primary !== '汽車貸款' && primary !== '汽車增貸' && input.hasCar) candidates.push('汽車貸款')
  if (primary !== '房屋二胎' && input.hasHouse) candidates.push('房屋二胎')
  return candidates[0] ?? null
}

function deriveRiskLevel(score: number, ctx: RuleContext) {
  if (ctx.flags.negativeCreditEvent || score < 25) return 'CRITICAL'
  if (score < 45) return 'HIGH'
  if (score < 70) return 'MEDIUM'
  return 'LOW'
}

function deriveDocuments(ctx: RuleContext, input: LeadIntakeInput) {
  if (!ctx.flags.hasIncomeProof) {
    ctx.documents.add('收入證明')
  }
  if (input.fullName) {
    ctx.documents.add('身分證正反面')
  }
  return [...ctx.documents]
}

export function evaluateLoanIntake(input: LeadIntakeInput): RecommendationResult {
  const context: RuleContext = {
    score: 52,
    reasons: [],
    documents: new Set<string>(),
    flags: {
      assetHeavy: false,
      hasIncomeProof: false,
      highDebt: false,
      negativeCreditEvent: false,
      carAvailable: false,
      houseAvailable: false,
      likelyManualReview: false
    }
  }

  for (const rule of baseRules) {
    rule.apply(input, context)
  }

  const primaryRecommendation = getPrimaryRecommendation(input, context)
  const secondaryRecommendation = getSecondaryRecommendation(primaryRecommendation, input, context)
  const riskLevel = deriveRiskLevel(context.score, context)

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
    requiredDocuments: deriveDocuments(context, input),
    needManualReview
  }
}

export const loanRuleCatalog = baseRules.map((rule) => rule.id)
