import type { AssistantReplySnapshot, AssistantReplySection, RecommendationResult } from '@/lib/types'

type AssistantReplyLike = {
  provider: 'ollama' | 'fallback'
  model: string
  content: string
}

type AssistantReplyContext = {
  applicantName: string
  recommendation: RecommendationResult
}

const SECTION_TITLE_MAP: Record<string, string> = {
  '可走方案': '可走方案',
  '方案建議': '可走方案',
  '主推方案': '可走方案',
  '不可走原因': '不可走原因',
  '風險提醒': '不可走原因',
  '補件清單': '補件清單',
  '補件建議': '補件清單',
  '建議話術': '建議話術',
  '後續動作': '建議話術'
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, ' ').trim()
}

function normalizeTitle(title: string) {
  return normalizeLine(title).replace(/^\d+\.\s*/, '')
}

function section(title: string, content: string[]): AssistantReplySection {
  return {
    title,
    content: content.map(normalizeLine).filter(Boolean)
  }
}

function formatRecommendationLine(recommendation: RecommendationResult) {
  const secondary = recommendation.secondaryRecommendation ? `，次選「${recommendation.secondaryRecommendation}」` : ''
  return `目前主推「${recommendation.primaryRecommendation}」${secondary}。`
}

function getRiskComment(recommendation: RecommendationResult) {
  if (recommendation.needManualReview || recommendation.riskLevel === 'CRITICAL') {
    return '目前條件偏複雜，建議先由人工覆核確認補件與送件方向。'
  }
  if (recommendation.riskLevel === 'HIGH') {
    return '目前風險偏高，建議先補強文件再推送件。'
  }
  if (recommendation.riskLevel === 'MEDIUM') {
    return '條件屬中等，若補齊文件，送件空間會更穩。'
  }
  return '條件整體穩定，建議把資料補齊後直接規劃送件。'
}

function buildDefaultSections(context: AssistantReplyContext): AssistantReplySection[] {
  const { recommendation, applicantName } = context
  const riskComment = getRiskComment(recommendation)
  const documentHints = recommendation.requiredDocuments.length
    ? recommendation.requiredDocuments.slice(0, 5)
    : ['身分證正反面', '收入或薪轉證明', '聯絡資料']

  const riskReasons = recommendation.reasons.filter((reason) =>
    /遲繳|逾期|警示|法院|欠費|前科|負債|低薪|薪轉不足|勞保不足|風險|人工覆核/i.test(reason)
  )

  return [
    section('可走方案', [
      formatRecommendationLine(recommendation),
      `風險等級 ${recommendation.riskLevel}，分數 ${recommendation.score} 分。`,
      recommendation.analysisSummary,
      riskComment
    ]),
    section('不可走原因', [
      riskReasons.length ? `目前主要要留意：${riskReasons.join('；')}` : '目前沒有明顯排除條件。',
      recommendation.primaryRecommendation === '暫不建議承作'
        ? '現階段建議先改善信用或債務結構，再重新評估。'
        : '若要改走其他方案，需先補強收入、資產或負債資料。'
    ]),
    section('補件清單', [
      `先補齊以下文件：${documentHints.join('、')}。`,
      recommendation.requiredDocuments.length > 5
        ? `其餘補件可於確認主方案後再逐項整理。`
        : '若已有其他貸款，請一併提供最新明細。'
    ]),
    section('建議話術', [
      `${applicantName} 目前我們會先以「${recommendation.primaryRecommendation}」為主軸幫您整理。`,
      recommendation.secondaryRecommendation
        ? `若您想保留第二方案，我們也可以同步參考「${recommendation.secondaryRecommendation}」的條件。`
        : '目前先把主方案的文件整理齊，會比較容易往下推進。',
      recommendation.recommendedActions.length
        ? `下一步建議先做：${recommendation.recommendedActions.join('；')}。`
        : '建議先補件後再安排進一步評估。'
    ])
  ]
}

function splitSectionLines(lines: string[]) {
  return lines.map((line) => normalizeLine(line)).filter(Boolean)
}

function parseSectionsFromContent(content: string) {
  const normalized = content.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const parsed: AssistantReplySection[] = []
  let current: AssistantReplySection | null = null

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const headingMatch = line.match(/^(?:\d+\.\s*)?([^：:]+)[：:]\s*(.*)$/)
    if (headingMatch) {
      const alias = normalizeTitle(headingMatch[1])
      const mapped = SECTION_TITLE_MAP[alias]
      if (mapped) {
        if (current) parsed.push(current)
        current = section(mapped, [headingMatch[2] || ''])
        continue
      }
    }

    if (current) {
      current.content.push(line)
    }
  }

  if (current) parsed.push(current)
  return parsed.filter((item) => item.content.length > 0)
}

export function buildAssistantReplyText(sections: AssistantReplySection[]) {
  return sections
    .map((entry, index) => {
      const body = splitSectionLines(entry.content)
        .map((line) => `- ${line}`)
        .join('\n')

      return `${index + 1}. ${entry.title}：\n${body}`
    })
    .join('\n\n')
}

export function buildAssistantReplySections(context: AssistantReplyContext) {
  return buildDefaultSections(context)
}

export function buildAssistantReplySnapshot(
  reply: AssistantReplyLike,
  context: AssistantReplyContext
): AssistantReplySnapshot {
  const parsed = parseSectionsFromContent(reply.content)
  const sections = parsed.length >= 4 ? parsed.slice(0, 4) : buildDefaultSections(context)

  return {
    provider: reply.provider,
    model: reply.model,
    content: reply.content,
    sections
  }
}

export function buildAssistantReplyContent(context: AssistantReplyContext) {
  return buildAssistantReplyText(buildDefaultSections(context))
}
