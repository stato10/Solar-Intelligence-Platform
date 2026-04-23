"use client";

/**
 * Step 5 of the conversion flow — confirmation.
 * Spec: docs/redesign/15-conversion-flow.md §6.
 */

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversionFlowState } from "@/hooks/use-conversion-flow";

export function ConfirmationStep() {
  const { context, finish } = useConversionFlowState();
  if (!context) return null;

  const isBooking = context.ctaKind === "book";
  const timelineText =
    context.ctaKind === "quote" || context.ctaKind === "book"
      ? "A provider will contact you within 48 hours."
      : "We'll email you the next steps within a day.";

  return (
    <div className="space-y-5 text-center sm:text-left">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 sm:mx-0">
        <CheckCircle2 className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {isBooking ? "Booking request sent" : "Request sent"}
        </h3>
        <p className="text-sm text-muted-foreground">{timelineText}</p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild>
          <a href="/opportunities">See what else you can improve</a>
        </Button>
        <Button onClick={finish}>Done</Button>
      </div>
    </div>
  );
}
