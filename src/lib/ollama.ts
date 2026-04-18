import type { LeadIntakeInput, RecommendationResult } from '@/lib/types'

export type AssistantSummaryInput = {
  applicant: LeadIntakeInput
  recommendation: RecommendationResult
}

export type AssistantStepInput = {
  stepKey: string
  stepLabel: string
  stepDescription: string
  currentAnswer: unknown
  applicant: Partial<LeadIntakeInput>
}

export type AssistantReply = {
  provider: 'ollama' | 'fallback'
  model: string
  content: string
}

const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL?.trim() || null
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b'

function formatValue(value: unknown) {
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') return `${value}`
  if (typeof value === 'string') return value.trim() || '未填寫'
  if (value == null) return '未填寫'
  return String(value)
}

function buildSummarySystemPrompt() {
  return [
    '你是貸款官網的客服助理。',
    '你的任務是用繁體中文，用簡短、專業、可信任的語氣，解釋初步條件評估結果。',
    '你不能承諾核貸，也不能更改規則引擎結果。',
    '你只能根據提供的資料，輸出 3 到 5 點精簡摘要，並提示需要補件。',
    '避免提及任何你不確定的法規或銀行承諾。'
  ].join(' ')
}

function buildStepSystemPrompt() {
  return [
    '你是貸款官網右下角的互動客服。',
    '你的任務是陪客戶完成初步評估，語氣親切、專業、簡短。',
    '你只能根據目前已知資料回覆，不要自作主張判斷核貸。',
    '每次回覆請用 1 到 3 句繁體中文，並自然帶到下一步或目前題目的重點。'
  ].join(' ')
}

function buildSummaryUserPrompt(input: AssistantSummaryInput) {
  const { applicant, recommendation } = input

  return [
    `姓名：${applicant.fullName}`,
    `資金需求：${applicant.fundingNeed}`,
    `資金用途：${applicant.fundingUse}`,
    `職業類型：${applicant.jobType}`,
    `月收入：${applicant.monthlyIncome}`,
    `主推方案：${recommendation.primaryRecommendation}`,
    `次推方案：${recommendation.secondaryRecommendation ?? '無'}`,
    `風險等級：${recommendation.riskLevel}`,
    `分數：${recommendation.score}`,
    `原因：${recommendation.reasons.join('；')}`,
    `補件：${recommendation.requiredDocuments.join('、')}`
  ].join('\n')
}

function buildStepUserPrompt(input: AssistantStepInput) {
  const { applicant, stepKey, stepLabel, stepDescription, currentAnswer } = input

  return [
    `目前題目：${stepLabel}`,
    `題目說明：${stepDescription}`,
    `欄位名稱：${stepKey}`,
    `目前答案：${formatValue(currentAnswer)}`,
    '已知客戶資料：',
    `- 資金需求：${formatValue(applicant.fundingNeed)}`,
    `- 資金用途：${formatValue(applicant.fundingUse)}`,
    `- 職業類型：${formatValue(applicant.jobType)}`,
    `- 月收入：${formatValue(applicant.monthlyIncome)}`,
    `- 薪轉：${formatValue(applicant.hasPayroll)}`,
    `- 勞保：${formatValue(applicant.hasLaborInsurance)}`,
    `- 報稅資料：${formatValue(applicant.hasTaxRecords)}`,
    `- 信用卡：${formatValue(applicant.hasCreditCard)}`,
    `- 卡循：${formatValue(applicant.hasRevolving)}`,
    `- 其他貸款：${formatValue(applicant.hasOtherLoans)}`,
    `- 月負債：${formatValue(applicant.monthlyDebtPayment)}`,
    `- 遲繳：${formatValue(applicant.recentLatePayment)}`,
    `- 協商 / 更生 / 警示帳戶：${formatValue(applicant.hasNegotiationOrBankruptcy)}`,
    `- 汽車：${formatValue(applicant.hasCar)}`,
    `- 房屋：${formatValue(applicant.hasHouse)}`,
    `- 保人：${formatValue(applicant.hasGuarantor)}`,
    `- 姓名：${formatValue(applicant.fullName)}`,
    `- 電話：${formatValue(applicant.phone)}`,
    `- LINE ID：${formatValue(applicant.lineId)}`
  ].join('\n')
}

function buildFallbackReply(input: AssistantSummaryInput) {
  const { applicant, recommendation } = input
  return [
    `已完成初步條件評估，${applicant.fullName} 目前較適合參考「${recommendation.primaryRecommendation}」。`,
    recommendation.secondaryRecommendation ? `次選方案可先看「${recommendation.secondaryRecommendation}」。` : '目前暫無第二方案。',
    `風險等級為 ${recommendation.riskLevel}，分數 ${recommendation.score} 分。`,
    `建議先補齊：${recommendation.requiredDocuments.join('、')}。`
  ].join('\n')
}

export function getOllamaSettings() {
  return {
    baseUrl: DEFAULT_OLLAMA_BASE_URL,
    model: DEFAULT_OLLAMA_MODEL
  }
}

async function callOllamaChat(messages: Array<{ role: 'system' | 'user'; content: string }>): Promise<string> {
  const { baseUrl, model } = getOllamaSettings()
  if (!baseUrl) {
    throw new Error('Ollama is disabled')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`)
    }

    const data = (await response.json()) as {
      message?: { content?: string }
    }

    const content = data.message?.content?.trim()
    if (!content) {
      throw new Error('Empty Ollama response')
    }

    return content
  } catch {
    throw new Error('Ollama unavailable')
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateAssistantSummary(input: AssistantSummaryInput): Promise<AssistantReply> {
  const { model } = getOllamaSettings()

  try {
    const content = await callOllamaChat([
      { role: 'system', content: buildSummarySystemPrompt() },
      { role: 'user', content: buildSummaryUserPrompt(input) }
    ])

    return {
      provider: 'ollama',
      model,
      content
    }
  } catch {
    return {
      provider: 'fallback',
      model,
      content: buildFallbackReply(input)
    }
  }
}

export async function generateStepAssistantReply(input: AssistantStepInput): Promise<AssistantReply> {
  const { model } = getOllamaSettings()
  const fallback = [
    `目前先確認「${input.stepLabel}」這一題。`,
    `這會影響最後推薦方向，但不會單一決定核貸。`,
    `如果你已填寫完成，就可以繼續下一步。`
  ].join(' ')

  try {
    const content = await callOllamaChat([
      { role: 'system', content: buildStepSystemPrompt() },
      { role: 'user', content: buildStepUserPrompt(input) }
    ])

    return {
      provider: 'ollama',
      model,
      content
    }
  } catch {
    return {
      provider: 'fallback',
      model,
      content: fallback
    }
  }
}
