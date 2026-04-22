import type { LeadIntakeInput, RecommendationResult } from '@/lib/types'
import { buildAssistantReplyContent } from '@/lib/assistant-reply'
import { getBusinessReplyTemplate, getSchemeLibraryJson } from '@/lib/scheme-library'

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

export type AssistantChatInput = {
  message: string
  transcript: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  applicant: Partial<LeadIntakeInput>
  suggestedNextQuestion?: string | null
  intent?: 'general' | 'loan'
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
  if (Array.isArray(value)) return value.length ? `已填寫 ${value.length} 筆明細` : '未填寫'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function hasNonTraditionalChineseCharacters(text: string) {
  return /[A-Za-z]/.test(text) || /[\u{1F300}-\u{1FAFF}]/u.test(text) || !/[\u4E00-\u9FFF]/.test(text)
}

async function rewriteToTraditionalChinese(content: string, context: string) {
  const { baseUrl, model } = getOllamaSettings()
  if (!baseUrl) {
    return content
  }

  try {
    const response = await callOllamaChat([
      {
        role: 'system',
        content: [
          '你是繁體中文潤稿助手。',
          '請把內容改寫成純繁體中文。',
          '不要保留英文、拼音、表情符號或其他語言。',
          '保留原意，語氣自然、簡短、像客服對話。'
        ].join(' ')
      },
      {
        role: 'user',
        content: [
          `請依照以下情境改寫：${context}`,
          '',
          '原始內容：',
          content
        ].join('\n')
      }
    ])

    return response?.trim() || content
  } catch {
    return content
  }
}

function buildSummarySystemPrompt() {
  return [
    '你是貸款官網的客服助理。',
    '你的任務是用繁體中文，用簡短、專業、可信任、像資深業務的語氣，解釋初步條件評估結果。',
    '你要先講結論，再講原因，再講下一步，不要像制式報表。',
    '這是一份 10 重點初審結果，請直接告訴客戶可走哪條方案或為何暫不建議承作。',
    '你不能承諾核貸，也不能更改規則引擎結果。',
    '你只能根據提供的資料與方案庫，輸出業務可直接轉述的內容。',
    '請優先參考方案庫中的適合案例與不適合案例，不要只看方案名稱。',
    '如果客戶詢問月付或期數，一律回答「請詢問專員」。',
    getBusinessReplyTemplate(),
    '回覆時要保留成交感，但不能誇大或保證結果。',
    '避免提及任何你不確定的法規或銀行承諾。',
    '全程只使用繁體中文，不要輸出英文、拼音、表情符號或其他語言。'
  ].join(' ')
}

function buildStepSystemPrompt() {
  return [
    '你是貸款官網右下角的高級顧問式初審助手。',
    '你的任務是陪客戶完成初步評估，語氣專業、穩定、簡短，像在做條件盤點與方案建議。',
    '你只能根據目前已知資料回覆，不要自作主張判斷核貸。',
    '每次回覆只能 1 句繁體中文，15 到 30 個字以內，只聚焦目前這一題。',
    '不要同時講太多分析、補件或方案，只要提示目前問題或簡短確認答案。',
    '回覆要讓客戶感覺是在做單題問答，不要像長篇說明。',
    '全程只使用繁體中文，不要輸出英文、拼音、表情符號或其他語言。'
  ].join(' ')
}

function buildChatSystemPrompt(intent: 'general' | 'loan') {
  if (intent === 'general') {
    return [
      '你是貸款官網的 LINE 文字客服，現在這一輪是一般聊天模式。',
      '你要先直接回覆客戶剛剛說的內容，不要先回到貸款表單。',
      '如果客戶是問問題，就直接回答問題；如果客戶是陳述情緒或狀況，就自然接住。',
      '如果客戶是打招呼，請先友善招呼並引導他直接問問題。',
      '如果客戶問你是誰，就直接說你是貸款智能初審客服。',
      '不要主動提及貸款方案、表單或補件，除非客戶自己提到貸款或申辦。',
      '語氣要像真人 LINE 訊息，簡短、自然、親切。',
      '每次回覆盡量 1 到 2 句。',
      '只用繁體中文，不要夾雜英文、拼音、表情符號或奇怪的自我介紹。'
    ].join(' ')
  }

  return [
    '你是貸款官網的 LINE 文字客服，語氣要像真人訊息，親切、簡短、自然。',
    '客戶可以隨時換話題，也可以先問任何問題，不要強迫一定要照固定順序回答。',
    '請先直接回應客戶剛剛的問題；如果客戶順便提供了條件，簡短幫他記下即可，不要打斷對話。',
    '如果客戶這句是在提問，優先回答問題，不要先反問或拉回表單。',
    '若條件還不夠，不要硬催填表，最多自然地補上一個最重要的追問，且只在合適時才問。',
    '如果客戶詢問方案或月付/期數，一律回答「請詢問專員」。',
    '不要承諾核貸，不要保證一定過件，也不要自創規則。',
    '每次回覆盡量 1 到 2 句，像 LINE 客服一樣簡潔，必要時可自然換行。',
    '避免過度制式、過度長篇，重點是讓客戶感覺像在聊天。',
    '只用繁體中文，不要夾雜英文、拼音、表情符號或奇怪的自我介紹。'
  ].join(' ')
}

function buildChatAssistantInstructions(intent: 'general' | 'loan') {
  if (intent === 'general') {
    return [
      '只回覆客戶這一則訊息的意思，不要主動提貸款。',
      '如果客戶問你是誰，就直接說你是貸款智能初審客服。',
      '如果客戶問你能做什麼，就簡短說明可協助回答貸款與初審相關問題。',
      '如果客戶提到與貸款無關的內容，先回應對方內容，再視情況自然接話。',
      '不要重複同一句話，也不要每次都回「可以，您直接問我就行」這種空泛內容。'
    ].join(' ')
  }

  return [
    '只回覆客戶這一則訊息的意思，不要把對話拉去其他題目。',
    '如果客戶是在問貸款，先直接回答貸款問題。',
    '如果客戶有順帶提供條件，再簡短記下即可，不要一直追問。',
    '不要重複同一句話，也不要每次都回空泛的確認語。'
  ].join(' ')
}

function buildSummaryUserPrompt(input: AssistantSummaryInput) {
  const { applicant, recommendation } = input

  return [
    '方案庫參考：',
    getSchemeLibraryJson(),
    '',
    `姓名：${applicant.fullName}`,
    `出生年月日：${applicant.birthDate}`,
    `身分證字號：${applicant.nationalId}`,
    `現職工作職稱：${applicant.currentJobTitle}`,
    `任職年資：${applicant.laborInsuranceYears} 年`,
    `月薪：${applicant.monthlySalary}`,
    `有薪轉：${applicant.hasPayroll}`,
    `有勞健保或工會：${applicant.hasLaborInsurance}`,
    `勞保 / 薪轉輪廓：${applicant.incomeProofProfile}`,
    `銀行 / 融資呆帳協商：${applicant.bankFinanceIssueProfile}`,
    `車輛輪廓：${applicant.vehicleProfile}`,
    `資產輪廓：${applicant.assetProfile}`,
    `負債輪廓：${applicant.debtProfile}`,
    `信用風險輪廓：${applicant.creditRiskProfile}`,
    `協商 / 更生：${applicant.hasNegotiationOrBankruptcy}`,
    `罰單摘要：${applicant.vehicleTaxArrearsSummary}`,
    `有車：${applicant.hasCar}`,
    `有房屋土地：${applicant.hasHouseLand}`,
    `資金需求：${applicant.fundingNeed}`,
    `資金用途：${applicant.fundingUse}`,
    `主推方案：${recommendation.primaryRecommendation}`,
    `次推方案：${recommendation.secondaryRecommendation ?? '無'}`,
    `風險等級：${recommendation.riskLevel}`,
    `分數：${recommendation.score}`,
    `原因：${recommendation.reasons.join('；')}`,
    `補件：${recommendation.requiredDocuments.join('、')}`,
    `全方位分析：${recommendation.analysisSummary}`,
    `建議動作：${recommendation.recommendedActions.join('；')}`,
    '',
    '請以固定格式回覆，並讓內容能直接傳給客戶。'
  ].join('\n')
}

function buildStepUserPrompt(input: AssistantStepInput) {
  const { applicant, stepKey, stepLabel, stepDescription, currentAnswer } = input

  return [
    '方案庫參考：',
    getSchemeLibraryJson(),
    '',
    getBusinessReplyTemplate(),
    '',
    '請優先用方案庫中的適合案例與不適合案例來判斷可走方向。',
    '請只用一句話回覆目前這一題，不要同時展開其他分析。',
    `目前題目：${stepLabel}`,
    `題目說明：${stepDescription}`,
    `欄位名稱：${stepKey}`,
    `目前答案：${formatValue(currentAnswer)}`,
    '已知客戶資料：',
    `- 資金需求：${formatValue(applicant.fundingNeed)}`,
    `- 資金用途：${formatValue(applicant.fundingUse)}`,
    `- 姓名：${formatValue(applicant.fullName)}`,
    `- 出生年月日：${formatValue(applicant.birthDate)}`,
    `- 身分證字號：${formatValue(applicant.nationalId)}`,
    `- 現職工作職稱：${formatValue(applicant.currentJobTitle)}`,
    `- 任職年資：${formatValue(applicant.laborInsuranceYears)}`,
    `- 月薪：${formatValue(applicant.monthlySalary)}`,
    `- 薪轉：${formatValue(applicant.hasPayroll)}`,
    `- 勞保：${formatValue(applicant.hasLaborInsurance)}`,
    `- 勞保 / 薪轉輪廓：${formatValue(applicant.incomeProofProfile)}`,
    `- 銀行 / 融資呆帳協商：${formatValue(applicant.bankFinanceIssueProfile)}`,
    `- 車輛輪廓：${formatValue(applicant.vehicleProfile)}`,
    `- 資產輪廓：${formatValue(applicant.assetProfile)}`,
    `- 負債輪廓：${formatValue(applicant.debtProfile)}`,
    `- 信用風險輪廓：${formatValue(applicant.creditRiskProfile)}`,
    `- 協商 / 更生：${formatValue(applicant.hasNegotiationOrBankruptcy)}`,
    `- 罰單摘要：${formatValue(applicant.vehicleTaxArrearsSummary)}`,
    `- 監理站欠費：${formatValue(applicant.hasVehicleTaxArrears)}`,
    `- 監理站欠費金額：${formatValue(applicant.vehicleTaxArrearsAmount)}`,
    `- 前科：${formatValue(applicant.hasCriminalRecord)}`,
    `- 前科罪名：${formatValue(applicant.criminalRecordCharge)}`,
    `- 法院扣款：${formatValue(applicant.hasCourtDeduction)}`,
    `- 警示戶：${formatValue(applicant.hasBankWarningAccount)}`,
    `- 汽車：${formatValue(applicant.hasCar)}`,
    `- 機車：${formatValue(applicant.hasMotorcycle)}`,
    `- 房屋土地：${formatValue(applicant.hasHouseLand)}`,
    `- 銀行貸款摘要：${formatValue(applicant.bankLoanSummary)}`,
    `- 融資貸款摘要：${formatValue(applicant.financeLoanSummary)}`,
    `- 當鋪借款摘要：${formatValue(applicant.pawnshopLoanSummary)}`,
    `- 民間借款摘要：${formatValue(applicant.privateLoanSummary)}`,
    `- 信用卡摘要：${formatValue(applicant.creditCardSummary)}`,
    `- 照會送件：${formatValue(applicant.recentBankFinanceLoanApplication)}`,
    `- 繳款摘要：${formatValue(applicant.repaymentHistorySummary)}`,
    `- 期數摘要：${formatValue(applicant.totalLoanTermSummary)}`,
    `- 駕照：${formatValue(applicant.hasDrivingLicense)}`,
    `- 既有貸款筆數：${formatValue(applicant.existingLoans?.length ?? 0)}`,
    `- 電話：${formatValue(applicant.phone)}`,
    `- LINE ID：${formatValue(applicant.lineId)}`
  ].join('\n')
}

function buildChatUserPrompt(input: AssistantChatInput) {
  const { applicant, message, transcript, suggestedNextQuestion, intent = 'loan' } = input
  const recentTranscript = transcript.slice(-12).map((entry, index) => {
    const speaker = entry.role === 'user' ? '客戶' : '客服'
    return `${index + 1}. ${speaker}：${entry.content}`
  })

  if (intent === 'general') {
    return [
      '請把這次對話當成一般 LINE 聊天，不要急著拉回貸款表單。',
      buildChatAssistantInstructions('general'),
      '',
      '目前客戶剛剛說：',
      message,
      '',
      '最近對話紀錄：',
      ...recentTranscript,
      '',
      '請輸出 1 到 2 句繁體中文，先回應客戶內容，再自然接話。'
    ].join('\n')
  }

  return [
    '方案庫參考：',
    getSchemeLibraryJson(),
    '',
    getBusinessReplyTemplate(),
    '',
    buildChatAssistantInstructions('loan'),
    '請把這次對話當成 LINE 文字客服，不要要求客戶一定要先答完固定題目。',
    '如果客戶是來問問題，就先回答問題，不要先改問別的；如果客戶是在描述條件，就簡短整理並接住話題。',
    '若這句話本身是提問，請優先回答，別急著追問。',
    suggestedNextQuestion ? `目前若要補資料，建議可自然追問：${suggestedNextQuestion}` : '目前沒有特別要追問的缺漏。',
    '',
    '目前客戶剛剛說：',
    message,
    '',
    '目前已知客戶資料：',
    `- 姓名：${formatValue(applicant.fullName)}`,
    `- 出生年月日：${formatValue(applicant.birthDate)}`,
    `- 身分證字號：${formatValue(applicant.nationalId)}`,
    `- 現職工作職稱：${formatValue(applicant.currentJobTitle)}`,
    `- 任職年資：${formatValue(applicant.laborInsuranceYears)}`,
    `- 月薪：${formatValue(applicant.monthlySalary)}`,
    `- 薪轉 / 勞保輪廓：${formatValue(applicant.incomeProofProfile)}`,
    `- 銀行 / 融資呆帳協商：${formatValue(applicant.bankFinanceIssueProfile)}`,
    `- 車輛輪廓：${formatValue(applicant.vehicleProfile)}`,
    `- 資產輪廓：${formatValue(applicant.assetProfile)}`,
    `- 負債輪廓：${formatValue(applicant.debtProfile)}`,
    `- 信用風險輪廓：${formatValue(applicant.creditRiskProfile)}`,
    `- 罰單摘要：${formatValue(applicant.vehicleTaxArrearsSummary)}`,
    `- 汽車：${formatValue(applicant.hasCar)}`,
    `- 機車：${formatValue(applicant.hasMotorcycle)}`,
    `- 房屋土地：${formatValue(applicant.hasHouseLand)}`,
    `- 貸款摘要：${formatValue(applicant.bankLoanSummary)}`,
    `- 信用卡摘要：${formatValue(applicant.creditCardSummary)}`,
    `- 資金需求：${formatValue(applicant.fundingNeed)}`,
    `- 資金用途：${formatValue(applicant.fundingUse)}`,
    `- 電話：${formatValue(applicant.phone)}`,
    `- LINE ID：${formatValue(applicant.lineId)}`,
    '',
    '最近對話紀錄：',
    ...recentTranscript,
    '',
    '請輸出 1 到 2 句繁體中文，先回覆問題，再視情況自然承接下一步。',
    '語氣要像 LINE 客服訊息，不要像正式公文。'
  ].join('\n')
}

function buildFallbackReply(input: AssistantSummaryInput) {
  return buildAssistantReplyContent({
    applicantName: input.applicant.fullName,
    recommendation: input.recommendation
  })
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
        options: {
          temperature: 0.2,
          top_p: 0.9
        },
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
    const rawContent = await callOllamaChat([
      { role: 'system', content: buildSummarySystemPrompt() },
      { role: 'user', content: buildSummaryUserPrompt(input) }
    ])
    const content = hasNonTraditionalChineseCharacters(rawContent)
      ? await rewriteToTraditionalChinese(rawContent, '這是貸款初審摘要，請保持專業且適合直接給客戶')
      : rawContent

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
  const fallback = [`目前先確認「${input.stepLabel}」這一題。`].join(' ')

  try {
    const rawContent = await callOllamaChat([
      { role: 'system', content: buildStepSystemPrompt() },
      { role: 'user', content: buildStepUserPrompt(input) }
    ])
    const content = hasNonTraditionalChineseCharacters(rawContent)
      ? await rewriteToTraditionalChinese(rawContent, `這是一題貸款初審流程，目前題目是：${input.stepLabel}`)
      : rawContent

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

export async function generateChatReply(input: AssistantChatInput): Promise<AssistantReply> {
  const { model } = getOllamaSettings()
  const intent = input.intent ?? 'loan'
  const fallback = input.suggestedNextQuestion
    ? `可以，您先直接問我想了解的部分，也可以隨時換話題。我這邊會邊聊邊幫您整理條件。若方便，接著也可以補充：${input.suggestedNextQuestion}`
    : '可以，您先直接問我想了解的部分，也可以隨時換話題。我這邊會邊聊邊幫您整理條件。'

  try {
    const rawContent = await callOllamaChat([
      { role: 'system', content: buildChatSystemPrompt(intent) },
      { role: 'user', content: buildChatUserPrompt({ ...input, intent }) }
    ])
    const content = hasNonTraditionalChineseCharacters(rawContent)
      ? await rewriteToTraditionalChinese(rawContent, intent === 'general' ? '一般客服聊天回覆' : '貸款客服聊天回覆')
      : rawContent

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
