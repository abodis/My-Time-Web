import { useMe } from "@/hooks/use-me"
import { useOnboardingStore, type WizardStep } from "@/stores/onboarding-store"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { WizardStepper } from "@/components/onboarding/wizard-stepper"
import { ProfileStep } from "@/components/onboarding/profile-step"
import { WorkspacePathStep } from "@/components/onboarding/workspace-path-step"
import { FastPathSeeder } from "@/components/onboarding/fast-path-seeder"
import { GuidedChain } from "@/components/onboarding/guided-chain"
import { InviteStep } from "@/components/onboarding/invite-step"
import { SummaryStep } from "@/components/onboarding/summary-step"

// Wizard position order. The single `guided` store value holds the branch
// position: fast → FastPathSeeder, guided → GuidedChain (design.md OwnerWizard).
const STEP_ORDER: WizardStep[] = ["profile", "path", "guided", "invite", "summary"]

// Owner onboarding step-machine container. Drives step order via the onboarding
// store (`step`, `chosenPath`) and renders the concrete step for the current
// position plus the WizardStepper. Advance callbacks write the next step through
// the store (imperative getState, per Zustand-in-effects rules).
export function OwnerWizard() {
  const step = useOnboardingStore((s) => s.step)
  const chosenPath = useOnboardingStore((s) => s.chosenPath)
  const { data: me, isLoading } = useMe()

  // The middle label reflects the chosen branch (design.md: stepper count/labels
  // are constant; only the middle wording differs between fast and guided).
  const middleLabel = chosenPath === "guided" ? "Create" : "Seed"
  const stepperLabels = ["Profile", "Path", middleLabel, "Invite", "Summary"]
  const currentIndex = STEP_ORDER.indexOf(step)

  const goTo = (next: WizardStep) => {
    useOnboardingStore.getState().goTo(next)
  }

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case "profile":
        return <ProfileStep me={me} onCompleted={() => goTo("path")} />
      case "path":
        return <WorkspacePathStep onNext={() => goTo("guided")} />
      case "guided":
        return chosenPath === "guided" ? <GuidedChain /> : <FastPathSeeder />
      case "invite":
        return <InviteStep />
      case "summary":
        return <SummaryStep />
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <WizardStepper steps={stepperLabels} currentIndex={currentIndex} />
        <div className="mt-6">{renderStep()}</div>
      </div>
    </div>
  )
}
