import { notFound, redirect } from 'next/navigation'
import { LeadDetailPanel } from '@/components/lead-detail-panel'
import { getFollowUpsByLeadId, getLeadById, getNotificationsByLeadId } from '@/lib/store'
import { getSession } from '@/lib/session'

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const lead = getLeadById(params.id)
  if (!lead) notFound()

  return <LeadDetailPanel lead={lead} followUps={getFollowUpsByLeadId(lead.id)} notifications={getNotificationsByLeadId(lead.id)} />
}
