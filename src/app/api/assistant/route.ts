import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateStepAssistantReply } from '@/lib/ollama'
import type { LeadIntakeInput } from '@/lib/types'

const assistantRequestSchema = z.object({
  stepKey: z.string().min(1),
  stepLabel: z.string().min(1),
  stepDescription: z.string().min(1),
  currentAnswer: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional().default(null),
  applicant: z.record(z.unknown()).default({})
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = assistantRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const reply = await generateStepAssistantReply({
    stepKey: parsed.data.stepKey,
    stepLabel: parsed.data.stepLabel,
    stepDescription: parsed.data.stepDescription,
    currentAnswer: parsed.data.currentAnswer,
    applicant: parsed.data.applicant as Partial<LeadIntakeInput>
  })

  return NextResponse.json({ reply })
}
