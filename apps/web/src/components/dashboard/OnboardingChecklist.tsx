/**
 * OnboardingChecklist — progressive 4-step guide used inside ZeroDataHero.
 *
 * Spec-extension: docs/redesign/12-empty-states.md §3. Instead of showing a
 * first-time user an empty dashboard with a single "Connect your inverter"
 * button, we show them a linear checklist of what has to happen to reach
 * a useful state:
 *
 *   1. Create your account
 *   2. Add your system details
 *   3. Connect your inverter
 *   4. Wait for first reading
 *
 * Each step has a `state`:
 *   - "done"    — checkmark
 *   - "current" — filled dot, emphasized, paired with the hero CTA
 *   - "upcoming" — muted, smaller
 *
 * Substate mapping (driven by `activeStepIndex` from the copy library):
 *   anonymous    → current = step 0
 *   no-site      → current = step 1
 *   never-synced → current = step 2
 *   stale        → current = step 3
 */

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/lib/view-models/onboarding";

interface OnboardingChecklistProps {
  /** Zero-indexed current step. Steps below are "done", above are "upcoming". */
  activeStepIndex: number;
  className?: string;
}

export function OnboardingChecklist({
  activeStepIndex,
  className,
}: OnboardingChecklistProps) {
  return (
    <ol
      aria-label="Onboarding progress"
      className={cn("flex flex-col gap-2.5", className)}
    >
      {ONBOARDING_STEPS.map((step, index) => {
        const state =
          index < activeStepIndex
            ? "done"
            : index === activeStepIndex
              ? "current"
              : "upcoming";
        return (
          <li
            key={step.id}
            data-step-state={state}
            className={cn(
              "flex items-start gap-3 text-sm",
              state === "upcoming" && "opacity-50",
            )}
          >
            <StepIndicator state={state} index={index} />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-medium leading-tight",
                  state === "current"
                    ? "text-foreground"
                    : state === "done"
                      ? "text-muted-foreground line-through decoration-emerald-500/40"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {step.sublabel}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// --------------------------------------------------------------------------
// Step indicator — compact circle that changes icon by state.
// --------------------------------------------------------------------------
interface StepIndicatorProps {
  state: "done" | "current" | "upcoming";
  index: number;
}

function StepIndicator({ state, index }: StepIndicatorProps) {
  if (state === "done") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      >
        <Check className="h-3 w-3" />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-500/60 bg-indigo-500/15 text-indigo-400"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-transparent text-slate-500"
    >
      <span className="text-[10px] font-semibold">{index + 1}</span>
    </span>
  );
}
