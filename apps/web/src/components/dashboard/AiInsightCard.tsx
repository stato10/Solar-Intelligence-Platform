/**
 * Canonical AI Insight Card.
 *
 * Spec: docs/redesign/11-ai-insight-card.md.
 * Rules (summary — see spec for the full contract):
 *   - Structure is fixed: Issue → Impact → Money → Recommended Action → CTA.
 *   - `confidence` drives shape: high/medium render as a full card;
 *     low collapses to a muted row with a text link (no solid CTA).
 *   - `priority` drives CTA strength: high = solid, medium = outline,
 *     low = text link.
 *
 * This component is intentionally presentational. Domain-specific wiring
 * (marketplace lead intents, custom CTA payloads, etc.) belongs in an
 * adapter (see EnergyDecisionInsightCard.tsx).
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type {
  ActionPriority,
  InsightConfidence,
  InsightSeverity,
} from "@/lib/view-models/energy-decisions";

// ---------------------------------------------------------------------------
// Props contract — matches docs/redesign/11-ai-insight-card.md §5.
// ---------------------------------------------------------------------------
export interface AiInsightCardProps {
  /** One-line human-readable label. Required, drives the accessible name. */
  issue: string;
  /** One-line effect. Omitted → no row. */
  impact?: string;
  /**
   * Pre-formatted money string (e.g. "₪30–₪45 / month"). The caller owns
   * formatting so the card never guesses a locale.
   */
  money?: string;
  /** Imperative recommended action sentence. */
  recommendedAction?: string;

  confidence: InsightConfidence;
  priority: ActionPriority;
  /** Optional severity chip — surfaces only when present. */
  severity?: InsightSeverity;

  /** 1–3 short "why we recommend this" chips. */
  whyTags?: string[];

  /**
   * Primary CTA. For `low` confidence the button is swapped for a text link
   * per the spec; when omitted entirely, no CTA renders.
   */
  cta?: {
    label: string;
    /** Slot injected by the caller (click handler, lead-intent button, etc.). */
    element: ReactNode;
  };

  /**
   * Collapsed-by-default deep-dive accordion. Renders nothing when absent.
   * Accepts a string or any node so callers can embed structured markdown.
   */
  deepDive?: ReactNode;

  /** Optional decorative icon (lucide). Defaults to Lightbulb. */
  icon?: LucideIcon;
  className?: string;
}

// ---------------------------------------------------------------------------
// Chip styling — routes through the `--success` / `--warning` / `--danger`
// state tokens (docs/redesign/00-design-tokens.md) via the shared
// `state-*` utilities; never raw hex or ad-hoc palette classes.
// ---------------------------------------------------------------------------
const CONFIDENCE_CHIP: Record<
  InsightConfidence,
  { label: string; className: string }
> = {
  high: {
    label: "High confidence",
    className: "state-good text-[color:var(--success)]",
  },
  medium: {
    label: "Medium confidence",
    className: "state-warning text-[color:var(--warning)]",
  },
  low: {
    label: "Low confidence",
    className: "bg-muted/40 border-border/60 text-muted-foreground",
  },
};

const SEVERITY_CHIP: Record<InsightSeverity, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "state-danger text-[color:var(--danger)]",
  },
  warning: {
    label: "Warning",
    className: "state-warning text-[color:var(--warning)]",
  },
  info: {
    label: "Info",
    className: "bg-muted/40 border-border/60 text-muted-foreground",
  },
};

// ---------------------------------------------------------------------------
// Low-confidence muted row — spec §4.
// ---------------------------------------------------------------------------
function MutedInsightRow({
  issue,
  impact,
  deepDive,
  icon: Icon = Lightbulb,
  className,
}: Pick<AiInsightCardProps, "issue" | "impact" | "deepDive" | "icon" | "className">) {
  const summary = (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{issue}</p>
        {impact ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{impact}</p>
        ) : null}
      </div>
    </div>
  );

  if (!deepDive) {
    return (
      <section
        aria-label={issue}
        className={cn(
          "rounded-xl border border-border/60 bg-card/40 px-4 py-3",
          className,
        )}
      >
        {summary}
      </section>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "rounded-xl border border-border/60 bg-card/40",
        className,
      )}
    >
      <AccordionItem value="deep-dive" className="border-0">
        <AccordionTrigger
          className="px-4 py-3 text-left hover:no-underline data-[state=open]:pb-2"
          aria-label={`Learn more about ${issue}`}
        >
          {summary}
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3 text-xs text-muted-foreground">
          {deepDive}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// ---------------------------------------------------------------------------
// Full card — spec §3.
// ---------------------------------------------------------------------------
export function AiInsightCard({
  issue,
  impact,
  money,
  recommendedAction,
  confidence,
  priority,
  severity,
  whyTags,
  cta,
  deepDive,
  icon: Icon = Lightbulb,
  className,
}: AiInsightCardProps) {
  // Low-confidence items never render the full card shape (spec 01 §3).
  if (confidence === "low") {
    return (
      <MutedInsightRow
        issue={issue}
        impact={impact}
        deepDive={deepDive}
        icon={Icon}
        className={className}
      />
    );
  }

  // Priority governs typography weight: spec 01 §2 — "high → text-2xl;
  // medium → text-lg". Low never reaches this branch.
  const issueSize = priority === "high" ? "text-2xl" : "text-lg";

  const confidenceChip = CONFIDENCE_CHIP[confidence];
  const severityChip = severity ? SEVERITY_CHIP[severity] : undefined;

  return (
    <section
      aria-label={issue}
      data-action-priority={priority}
      data-confidence={confidence}
      className={cn(
        "glass-card rounded-2xl p-5",
        priority === "high" && "ring-1 ring-rose-500/15",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            priority === "high"
              ? "bg-rose-500/10 text-rose-400"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className={cn("font-semibold leading-snug tracking-tight", issueSize)}>
              {issue}
            </h3>
            {severityChip ? (
              <Badge
                variant="outline"
                className={cn("border px-2 py-0.5 text-[10px] uppercase tracking-wider", severityChip.className)}
                aria-label={`Severity: ${severityChip.label}`}
              >
                {severityChip.label}
              </Badge>
            ) : null}
          </div>

          {impact ? (
            <p className="text-sm text-muted-foreground">{impact}</p>
          ) : null}

          {money ? (
            <p className="font-mono text-base tabular-nums text-emerald-600 dark:text-emerald-400">
              {money}
            </p>
          ) : null}

          {recommendedAction ? (
            <p className="text-sm text-foreground/90">
              <span className="font-medium text-muted-foreground">Recommended:</span>{" "}
              {recommendedAction}
            </p>
          ) : null}

          {whyTags && whyTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {whyTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* CTA row. `cta.element` is owned by the caller so the card stays
              presentational. */}
          {cta ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="min-w-0">{cta.element}</div>
              <Badge
                variant="outline"
                className={cn("border px-2 py-0.5 text-[10px] uppercase tracking-wider", confidenceChip.className)}
                aria-label={confidenceChip.label}
              >
                {confidenceChip.label.replace(" confidence", "")}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-end pt-1">
              <Badge
                variant="outline"
                className={cn("border px-2 py-0.5 text-[10px] uppercase tracking-wider", confidenceChip.className)}
                aria-label={confidenceChip.label}
              >
                {confidenceChip.label.replace(" confidence", "")}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {deepDive ? (
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="deep-dive" className="border-t border-border/40">
            <AccordionTrigger
              className="py-2 text-xs font-medium text-muted-foreground hover:no-underline"
              aria-label={`Deep dive for ${issue}`}
            >
              <span className="flex items-center gap-1.5">
                Deep dive <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-1 text-xs text-muted-foreground">
              {deepDive}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </section>
  );
}
