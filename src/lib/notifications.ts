import type { LeadIntakeInput, NotificationChannel } from '@/lib/types'

type NotificationPayload = {
  leadId: string
  leadName: string
  phone: string
  recommendation: string
  score: number
}

export type NotificationResult = {
  channel: NotificationChannel
  target: string
  status: 'QUEUED' | 'SENT' | 'SKIPPED'
  message: string
}

function buildMessage(payload: NotificationPayload) {
  return [
    `新案件通知`,
    `姓名：${payload.leadName}`,
    `電話：${payload.phone}`,
    `推薦：${payload.recommendation}`,
    `分數：${payload.score}`,
    `案件編號：${payload.leadId}`
  ].join('\n')
}

export async function sendEmailNotification(payload: NotificationPayload): Promise<NotificationResult> {
  return {
    channel: 'EMAIL',
    target: 'crm@loanflow.tw',
    status: 'SKIPPED',
    message: buildMessage(payload)
  }
}

export async function sendLineNotification(payload: NotificationPayload): Promise<NotificationResult> {
  return {
    channel: 'LINE',
    target: 'line-webhook',
    status: 'SKIPPED',
    message: buildMessage(payload)
  }
}

export async function sendTelegramNotification(payload: NotificationPayload): Promise<NotificationResult> {
  return {
    channel: 'TELEGRAM',
    target: 'telegram-webhook',
    status: 'SKIPPED',
    message: buildMessage(payload)
  }
}

export async function triggerNotifications(payload: NotificationPayload) {
  const results = await Promise.all([
    sendEmailNotification(payload),
    sendLineNotification(payload),
    sendTelegramNotification(payload)
  ])

  return results
}

export function extractLeadNotificationPayload(lead: Pick<LeadIntakeInput, 'fullName' | 'phone'> & { id: string; score: number; recommendation: string }) {
  return {
    leadId: lead.id,
    leadName: lead.fullName,
    phone: lead.phone,
    recommendation: lead.recommendation,
    score: lead.score
  }
}
