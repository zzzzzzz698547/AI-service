import { NextResponse } from 'next/server'
import { createLead, listLeads } from '@/lib/store'
import { leadIntakeSchema } from '@/lib/validation'
import { generateAssistantSummary } from '@/lib/ollama'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const leads = listLeads({
    query: searchParams.get('q') ?? undefined,
    recommendation: searchParams.get('recommendation') ?? undefined,
    status: (searchParams.get('status') as never) ?? undefined,
    riskLevel: (searchParams.get('riskLevel') as never) ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined
  })

  return NextResponse.json({ data: leads })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = leadIntakeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const lead = await createLead(parsed.data)
  const assistant = await generateAssistantSummary({
    applicant: parsed.data,
    recommendation: {
      primaryRecommendation: lead.primaryRecommendation,
      secondaryRecommendation: lead.secondaryRecommendation,
      riskLevel: lead.riskLevel,
      score: lead.score,
      reasons: lead.reasons,
      requiredDocuments: lead.requiredDocuments,
      needManualReview: lead.needManualReview
    }
  })

  return NextResponse.json({
    leadId: lead.id,
    recommendation: lead.primaryRecommendation,
    score: lead.score,
    assistantReply: assistant
  })
}
