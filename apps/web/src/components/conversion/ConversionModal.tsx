"use client";

/**
 * ConversionModal — the single modal shell for the 5-step flow
 * defined in docs/redesign/15-conversion-flow.md.
 *
 * The modal never owns state. It reads the active step from
 * `useConversionFlowState` and routes to the right step component.
 * Opening / closing is entirely driven by the provider.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConversionFlowState } from "@/hooks/use-conversion-flow";
import { ContextStep } from "./context-step";
import { ProviderStep } from "./provider-step";
import { LeadFormStep } from "./lead-form-step";
import { ConfirmationStep } from "./confirmation-step";

export function ConversionModal() {
  const state = useConversionFlowState();
  const isOpen = state.step !== "idle" && state.context !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) state.close("close");
      }}
    >
      <DialogContent className="sm:max-w-xl">
        {state.step === "context" && state.context ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {state.context.catalogItemTitle
                  ? state.context.catalogItemTitle
                  : "Continue with this recommendation"}
              </DialogTitle>
              <DialogDescription>
                {state.context.catalogItemBrand
                  ? state.context.catalogItemBrand
                  : null}
              </DialogDescription>
            </DialogHeader>
            <ContextStep />
          </>
        ) : null}

        {state.step === "provider" && state.context ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a provider</DialogTitle>
              <DialogDescription>
                We share your system summary only with the provider you pick.
              </DialogDescription>
            </DialogHeader>
            <ProviderStep />
          </>
        ) : null}

        {state.step === "form" && state.context ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {state.context.ctaKind === "book"
                  ? "Send booking request"
                  : state.context.ctaKind === "configure"
                  ? "Request setup help"
                  : "Request a quote"}
              </DialogTitle>
              <DialogDescription>
                We'll get back to you within 48 hours.
              </DialogDescription>
            </DialogHeader>
            <LeadFormStep />
          </>
        ) : null}

        {state.step === "confirmation" && state.context ? (
          <ConfirmationStep />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
