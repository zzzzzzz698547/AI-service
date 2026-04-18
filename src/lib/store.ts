import { demoFollowUps, demoLeads, demoNotifications, demoUsers } from '@/lib/mock-data'
import { hashPassword } from '@/lib/auth'
import { evaluateLoanIntake } from '@/lib/loan-rules'
import type {
  DashboardStats,
  LeadIntakeInput,
  LeadStatus,
  NotificationChannel,
  Role,
  RiskLevel
} from '@/lib/types'
import { triggerNotifications } from '@/lib/notifications'

type LeadRecord = ReturnType<typeof createLeadRecord>

const store = {
  users: [...demoUsers],
  leads: [...demoLeads],
  followUps: [...demoFollowUps],
  notifications: [...demoNotifications]
}

function createLeadRecord(input: LeadIntakeInput, status: LeadStatus = 'NEW', assignedSalesId: string | null = null) {
  const evaluation = evaluateLoanIntake(input)
  return {
    id: `lead_${Math.random().toString(36).slice(2, 10)}`,
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status,
    assignedSalesId,
    score: evaluation.score,
    riskLevel: evaluation.riskLevel as RiskLevel,
    primaryRecommendation: evaluation.primaryRecommendation,
    secondaryRecommendation: evaluation.secondaryRecommendation ?? null,
    reasons: evaluation.reasons,
    requiredDocuments: evaluation.requiredDocuments,
    needManualReview: evaluation.needManualReview
  }
}

export function getUsers() {
  return store.users
}

export function createSalesUser(input: { name: string; email: string; password: string }) {
  if (store.users.some((user) => user.email === input.email)) {
    throw new Error('USER_EXISTS')
  }

  const user = {
    id: `user_${Math.random().toString(36).slice(2, 10)}`,
    name: input.name,
    email: input.email,
    role: 'SALES' as const,
    passwordHash: hashPassword(input.password)
  }

  store.users.unshift(user)
  return user
}

export function findUserByEmail(email: string) {
  return store.users.find((user) => user.email === email) ?? null
}

export function listLeads(filters?: {
  query?: string
  recommendation?: string
  status?: LeadStatus
  assignedSalesId?: string
  riskLevel?: RiskLevel
  from?: string
  to?: string
}) {
  const results = store.leads.filter((lead) => {
    const matchesQuery =
      !filters?.query ||
      [lead.fullName, lead.phone, lead.lineId, lead.fundingUse].some((value) =>
        value.toLowerCase().includes(filters.query!.toLowerCase())
      )

    const matchesRecommendation = !filters?.recommendation || lead.primaryRecommendation === filters.recommendation
    const matchesStatus = !filters?.status || lead.status === filters.status
    const matchesAssigned = !filters?.assignedSalesId || lead.assignedSalesId === filters.assignedSalesId
    const matchesRisk = !filters?.riskLevel || lead.riskLevel === filters.riskLevel
    const matchesFrom = !filters?.from || new Date(lead.createdAt) >= new Date(filters.from)
    const matchesTo = !filters?.to || new Date(lead.createdAt) <= new Date(`${filters.to}T23:59:59`)

    return matchesQuery && matchesRecommendation && matchesStatus && matchesAssigned && matchesRisk && matchesFrom && matchesTo
  })

  return results.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

export function getLeadById(id: string) {
  return store.leads.find((lead) => lead.id === id) ?? null
}

export function getFollowUpsByLeadId(leadId: string) {
  return store.followUps.filter((item) => item.leadId === leadId)
}

export function getNotificationsByLeadId(leadId: string) {
  return store.notifications.filter((item) => item.leadId === leadId)
}

export function getDashboardStats(): DashboardStats {
  const today = new Date().toDateString()
  return {
    newLeads: store.leads.filter((lead) => new Date(lead.createdAt).toDateString() === today).length,
    pendingContacts: store.leads.filter((lead) => lead.status === 'NEW' || lead.status === 'CONTACT_PENDING').length,
    highIntent: store.leads.filter((lead) => lead.status === 'HIGH_INTENT').length,
    converted: store.leads.filter((lead) => lead.status === 'CONVERTED').length
  }
}

export async function createLead(input: LeadIntakeInput) {
  const lead = createLeadRecord(input)
  store.leads.unshift(lead)
  const notificationResults = await triggerNotifications({
    leadId: lead.id,
    leadName: lead.fullName,
    phone: lead.phone,
    recommendation: lead.primaryRecommendation,
    score: lead.score
  })

  for (const item of notificationResults) {
    store.notifications.unshift({
      id: `noti_${Math.random().toString(36).slice(2, 10)}`,
      leadId: lead.id,
      channel: item.channel,
      target: item.target,
      status: item.status,
      createdAt: new Date().toISOString()
    })
  }

  store.followUps.unshift({
    id: `log_${Math.random().toString(36).slice(2, 10)}`,
    leadId: lead.id,
    note: '系統已建立新案件並觸發通知流程。',
    status: 'NEW',
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  })

  return lead
}

export function updateLeadStatus(leadId: string, status: LeadStatus) {
  const lead = getLeadById(leadId)
  if (!lead) return null
  lead.status = status
  lead.updatedAt = new Date().toISOString()
  store.followUps.unshift({
    id: `log_${Math.random().toString(36).slice(2, 10)}`,
    leadId,
    note: `案件狀態更新為 ${status}。`,
    status,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  })
  return lead
}

export function assignLead(leadId: string, userId: string) {
  const lead = getLeadById(leadId)
  if (!lead) return null
  lead.assignedSalesId = userId
  lead.updatedAt = new Date().toISOString()
  store.followUps.unshift({
    id: `log_${Math.random().toString(36).slice(2, 10)}`,
    leadId,
    note: `案件已指派給 ${userId}。`,
    status: lead.status,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  })
  return lead
}

export function addFollowUp(leadId: string, note: string, createdBy: string) {
  const lead = getLeadById(leadId)
  if (!lead) return null
  const log = {
    id: `log_${Math.random().toString(36).slice(2, 10)}`,
    leadId,
    note,
    status: lead.status,
    createdAt: new Date().toISOString(),
    createdBy
  }
  store.followUps.unshift(log)
  return log
}
