"use client";

/**
 * Step 2 of the conversion flow — context modal.
 * Spec: docs/redesign/15-conversion-flow.md §3.
 *
 * Shows the issue / money line + 3 tailored "What happens next"
 * bullets selected by `ctaKind`. No personal data is collected here.
 */

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversionFlowState } from "@/hooks/use-conversion-flow";
import { useCurrency } from "@/hooks/use-currency";
import { formatMoneyPerPeriod } from "@/lib/utils/formatters";
import type { CatalogCtaKind } from "@/data/marketplace/types";

const NEXT_STEPS: Record<CatalogCtaKind, readonly string[]> = {
  quote: [
    "We'll share your system details with up to 3 verified providers.",
    "You'll receive quotes within 48 hours.",
    "No payment is taken until you accept a proposal.",
  ],
  book: [
    "We'll schedule a visit with a verified local provider.",
    "You pick a preferred time window on the next step.",
    "You can cancel free of charge up to 24 hours before the visit.",
  ],
  configure: [
    "We'll guide you through device setup.",
    "No purchase is needed if you already own the hardware.",
    "A specialist can dial in automation rules after the first week.",
  ],
  external: [
    "We'll redirect you to the manufacturer's site.",
    "You can return to complete setup anytime.",
    "Your system details stay on this platform.",
  ],
};

export function ContextStep() {
  const { context, advanceFromContext, close } = useConversionFlowState();
  const { currency, locale } = useCurrency();
  if (!context) return null;

  const bullets = NEXT_STEPS[context.ctaKind];
  const moneyLine =
    typeof context.monthlyGainNis === "number"
      ? `Estimated gain: ${formatMoneyPerPeriod(
          context.monthlyGainNis,
          "month",
          { currency, locale, decimals: 0 },
        )}`
      : typeof context.yearlyGainNis === "number"
      ? `Estimated gain: ${formatMoneyPerPeriod(
          context.yearlyGainNis,
          "year",
          { currency, locale, decimals: 0 },
        )}`
      : null;

  return (
    <div className="space-y-6">
      {/* Issue + money header */}
      <section
        aria-label="Recommendation summary"
        className="rounded-xl border border-border/60 bg-muted/20 p-4"
      >
        {context.priceRange ? (
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {context.priceRange}
          </p>
        ) : null}
        {moneyLine ? (
          <p className="mt-1 font-mono text-base tabular-nums text-emerald-500">
            {moneyLine}
          </p>
        ) : null}
      </section>

      {/* What happens next */}
      <section aria-label="What happens next" className="space-y-3">
        <h3 className="text-sm font-semibold">What happens next</h3>
        <ul className="space-y-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                aria-hidden
              />
              <span className="text-foreground/90">{bullet}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => close("cancel")}>
          Cancel
        </Button>
        <Button onClick={advanceFromContext}>Continue</Button>
      </div>
    </div>
  );
}
