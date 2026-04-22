'use client'

import { create } from 'zustand'
import { intakeDefaults, intakeSteps } from '@/lib/loan-intake-steps'
import type { LeadIntakeInput } from '@/lib/types'

type LoanWizardState = {
  isOpen: boolean
  currentStep: number
  isSubmitting: boolean
  submittedLeadId: string | null
  formData: Partial<LeadIntakeInput>
  open: () => void
  close: () => void
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  setField: <K extends keyof LeadIntakeInput>(key: K, value: LeadIntakeInput[K]) => void
  setSubmitting: (value: boolean) => void
  setSubmittedLeadId: (value: string | null) => void
  reset: () => void
}

const initialState = {
  isOpen: false,
  currentStep: 0,
  isSubmitting: false,
  submittedLeadId: null,
  formData: { ...intakeDefaults } as Partial<LeadIntakeInput>
}

export const useLoanWizard = create<LoanWizardState>((set) => ({
  ...initialState,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, intakeSteps.length) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  setStep: (step) => set({ currentStep: Math.max(0, Math.min(step, intakeSteps.length)) }),
  setField: (key, value) => set((state) => ({ formData: { ...state.formData, [key]: value } })),
  setSubmitting: (value) => set({ isSubmitting: value }),
  setSubmittedLeadId: (value) => set({ submittedLeadId: value }),
  reset: () => set(initialState)
}))
