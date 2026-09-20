import { create } from 'zustand'

export type WizardStep = 'profile' | 'path' | 'guided' | 'invite' | 'summary'
export type ChosenPath = 'fast' | 'guided' | null

interface CreatedSummary {
  tag?: string
  project?: string
  activity?: string
}

interface OnboardingState {
  step: WizardStep
  chosenPath: ChosenPath
  seededExample: boolean
  createdSummary: CreatedSummary
  showTrackerPointer: boolean
  goTo: (step: WizardStep) => void
  choosePath: (p: ChosenPath) => void
  markSeeded: () => void
  recordCreated: (partial: Partial<CreatedSummary>) => void
  armTrackerPointer: () => void
  dismissTrackerPointer: () => void
  reset: () => void
}

const initialState = {
  step: 'profile' as WizardStep,
  chosenPath: null as ChosenPath,
  seededExample: false,
  createdSummary: {} as CreatedSummary,
  showTrackerPointer: false,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  goTo: (step) => {
    set({ step })
  },

  choosePath: (p) => {
    set({ chosenPath: p })
  },

  markSeeded: () => {
    set({ seededExample: true })
  },

  recordCreated: (partial) => {
    set((state) => ({ createdSummary: { ...state.createdSummary, ...partial } }))
  },

  armTrackerPointer: () => {
    set({ showTrackerPointer: true })
  },

  dismissTrackerPointer: () => {
    set({ showTrackerPointer: false })
  },

  reset: () => {
    set({ ...initialState })
  },
}))
