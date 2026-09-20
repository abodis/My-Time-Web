import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMe } from "@/hooks/use-me"
import { resolveEntryTarget } from "@/lib/onboarding-gate"
import { useAccountStore } from "@/stores/account-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { NonOwnerWelcome } from "@/components/onboarding/non-owner-welcome"
import { OwnerWizard } from "@/components/onboarding/owner-wizard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { paths } from "@/routes"

// Full-screen onboarding entry, rendered outside AppShell (no nav chrome).
// Re-reads GET /me and branches on the resolved account: completed users are
// bounced to the tracker, owners get the wizard, non-owners the welcome, and a
// malformed/absent status falls back to account selection.
export default function OnboardingPage() {
  const navigate = useNavigate()
  const activeAccountId = useAccountStore((s) => s.activeAccountId)
  const { data: me, isLoading } = useMe()
  // Wizard progress. Once an owner advances past the Profile step, the Profile's
  // POST /onboarding has stamped onboarding.completed, which would otherwise make
  // resolveEntryTarget return "tracker" and bounce mid-wizard. Per design.md, the
  // post-Profile steps (path/invite/summary) are post-completion convenience the
  // wizard still owns — SummaryStep performs the final tracker navigation. So the
  // completion-driven redirect only applies before the wizard has started.
  const wizardStep = useOnboardingStore((s) => s.step)
  const wizardInProgress = wizardStep !== "profile"

  const target = isLoading ? null : resolveEntryTarget(me, activeAccountId)

  useEffect(() => {
    if (target === "tracker" && !wizardInProgress) {
      navigate(paths.tracker, { replace: true })
    } else if (target === "stay") {
      navigate(paths.selectAccount, { replace: true })
    }
  }, [target, wizardInProgress, navigate])

  // Keep the wizard mounted once it has advanced past Profile, even though
  // resolveEntryTarget now reports "tracker" (completed). SummaryStep owns the
  // final hand-off to the tracker.
  if (target === "wizard" || (target === "tracker" && wizardInProgress)) {
    return <OwnerWizard />
  }

  if (target === "welcome") {
    return <NonOwnerWelcome />
  }

  // Loading, or a redirect (tracker/stay) is in flight — show the spinner
  // full-screen while useMe resolves or navigation completes.
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
