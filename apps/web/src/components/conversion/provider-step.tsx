"use client";

/**
 * Step 3 of the conversion flow — provider / product selection.
 * Spec: docs/redesign/15-conversion-flow.md §4.
 *
 * Renders either:
 *   - a list of providers filtered by `appliesTo` (and, when a
 *     service area is known, by `serviceArea`), or
 *   - the no-matches fallback block with "Notify me" and
 *     "Continue anyway" options.
 */

import { BadgeCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConversionFlowState } from "@/hooks/use-conversion-flow";
import type { ProviderItem } from "@/data/marketplace/types";

export function ProviderStep() {
  const { providers, selectProvider, close } = useConversionFlowState();

  if (providers.length === 0) {
    return <NoMatchesFallback />;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3" aria-label="Available providers">
        {providers.map((provider) => (
          <li key={provider.providerId}>
            <ProviderRow provider={provider} onSelect={selectProvider} />
          </li>
        ))}
      </ul>

      <div className="flex justify-between gap-2 pt-2 text-sm">
        <button
          type="button"
          onClick={() => close("cancel")}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => selectProvider(null)}
          className="font-medium text-primary hover:text-primary/80"
        >
          Continue without selecting →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider row
// ---------------------------------------------------------------------------
function ProviderRow({
  provider,
  onSelect,
}: {
  provider: ProviderItem;
  onSelect: (provider: ProviderItem) => void;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4",
        "sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">{provider.title}</h4>
          {provider.verified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              Verified
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{provider.brand}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />
          {provider.serviceArea}
        </p>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          {provider.priceRange}
        </p>
      </div>
      <Button size="sm" onClick={() => onSelect(provider)}>
        Select
      </Button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// No-matches fallback (doc 15 §4)
// ---------------------------------------------------------------------------
function NoMatchesFallback() {
  const { selectProvider, close } = useConversionFlowState();

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/90">
        No verified providers match your area yet. We can notify you as
        soon as one becomes available, or continue by listing your details
        and we'll route the request manually.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => close("cancel")}>
          Notify me later
        </Button>
        <Button onClick={() => selectProvider(null)}>Continue anyway</Button>
      </div>
    </div>
  );
}
