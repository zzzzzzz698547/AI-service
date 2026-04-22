import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateChatReply, generateStepAssistantReply } from '@/lib/ollama'
import type { LeadIntakeInput } from '@/lib/types'

const assistantRequestSchema = z.object({
  mode: z.enum(['step', 'chat']).default('chat'),
  intent: z.enum(['general', 'loan']).default('loan'),
  stepKey: z.string().optional().default(''),
  stepLabel: z.string().optional().default(''),
  stepDescription: z.string().optional().default(''),
  currentAnswer: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional().default(null),
  message: z.string().optional().default(''),
  transcript: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1)
      })
    )
    .optional()
    .default([]),
  suggestedNextQuestion: z.string().nullable().optional().default(null),
  applicant: z.record(z.unknown()).default({})
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = assistantRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (
    parsed.data.mode === 'step' &&
    (!parsed.data.stepKey || !parsed.data.stepLabel || !parsed.data.stepDescription)
  ) {
    return NextResponse.json({ error: 'Missing step metadata' }, { status: 400 })
  }

  const reply =
    parsed.data.mode === 'step'
      ? await generateStepAssistantReply({
          stepKey: parsed.data.stepKey,
          stepLabel: parsed.data.stepLabel,
          stepDescription: parsed.data.stepDescription,
          currentAnswer: parsed.data.currentAnswer,
          applicant: parsed.data.applicant as Partial<LeadIntakeInput>
        })
      : await generateChatReply({
          message: parsed.data.message,
          transcript: parsed.data.transcript,
          suggestedNextQuestion: parsed.data.suggestedNextQuestion || null,
          applicant: parsed.data.applicant as Partial<LeadIntakeInput>,
          intent: parsed.data.intent
        })

  return NextResponse.json({ reply })
}
