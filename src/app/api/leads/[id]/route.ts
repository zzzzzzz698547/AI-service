import { NextResponse } from 'next/server'
import { addFollowUp, assignLead, getLeadById, updateLeadStatus } from '@/lib/store'
import { noteSchema, statusSchema } from '@/lib/validation'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const lead = getLeadById(params.id)
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: lead })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  if (body.status) {
    const parsed = statusSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    const updated = updateLeadStatus(params.id, parsed.data.status)
    return NextResponse.json({ data: updated })
  }

  if (body.assignedSalesId) {
    const updated = assignLead(params.id, String(body.assignedSalesId))
    return NextResponse.json({ data: updated })
  }

  if (body.content) {
    const parsed = noteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
    const note = addFollowUp(params.id, parsed.data.content, 'system')
    return NextResponse.json({ data: note })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
