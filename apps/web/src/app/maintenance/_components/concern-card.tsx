"use client";

/**
 * ConcernCard — doc 03 §6.
 *
 * One card per maintenance signal (soiling, heat, weather risk). Every
 * card renders the same Problem → Impact → Money → Action chain and
 * routes its CTA through the shared `useConversionFlow` so the
 * maintenance surface reuses the Sprint-2 conversion funnel.
 *
 * Tokens: `p-5 rounded-2xl` plus a state-tinted left border keyed off
 * severity (see docs/redesign/00-design-tokens.md §Colors).
 */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Droplets, ShieldAlert, Sparkles, Thermometer, Wrench } from "lucide-react";
import {
  useConversionFlow,
  useConversionFlowState,
  type ConversionContext,
} from "@/hooks/use-conversion-flow";
import { track } from "@/lib/analytics/client";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils/formatters";
import type { MaintenanceConcernVm } from "@/lib/view-models/maintenance";

const ICON_MAP = {
  droplets: Droplets,
  thermometer: Thermometer,
  shield: ShieldAlert,
  wrench: Wrench,
  sparkles: Sparkles,
} as const;

// Severity → border + accent mapping (doc 00 §Colors).
const SEVERITY_STYLE: Record<
  MaintenanceConcernVm["severity"],
  { border: string; accent: string; chipBg: string; chipText: string; chipLabel: string; ctaBg: string }
> = {
  critical: {
    border: "border-rose-500/50 bg-rose-500/[0.04]",
    accent: "text-rose-600 dark:text-rose-400",
    chipBg: "bg-rose-500/15 border-rose-500/30",
    chipText: "text-rose-600 dark:text-rose-400",
    chipLabel: "Critical",
    ctaBg: "bg-rose-500 hover:bg-rose-500/90 text-white",
  },
  warning: {
    border: "border-amber-500/40 bg-amber-500/[0.04]",
    accent: "text-amber-600 dark:text-amber-400",
    chipBg: "bg-amber-500/15 border-amber-500/30",
    chipText: "text-amber-700 dark:text-amber-400",
    chipLabel: "Warning",
    ctaBg: "bg-amber-500 hover:bg-amber-500/90 text-white",
  },
  info: {
    border: "border-border/70 bg-card/60",
    accent: "text-muted-foreground",
    chipBg: "bg-muted border-border/60",
    chipText: "text-foreground/80",
    chipLabel: "Info",
    ctaBg: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
};

const CONFIDENCE_LABEL: Record<MaintenanceConcernVm["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export interface ConcernCardProps {
  concern: MaintenanceConcernVm;
  siteId: string;
  accessToken?: string;
}

export function ConcernCard({ concern, siteId, accessToken }: ConcernCardProps) {
  const { start } = useConversionFlow();
  const flowState = useConversionFlowState();
  const { currency, locale } = useCurrency();
  const [requestSent, setRequestSent] = useState(false);
  const style = SEVERITY_STYLE[concern.severity];
  const Icon = ICON_MAP[concern.icon] ?? AlertTriangle;
  // The VM renders money in its source currency (ILS); reformat here so
  // every user sees their own currency per `useCurrency()`.
  const monthlyLossText =
    concern.estimatedMonthlyLoss > 0
      ? formatCurrency(concern.estimatedMonthlyLoss, { currency, locale, decimals: 0 })
      : concern.estimatedMonthlyLossText;

  // Impression event — doc 03 §9. Fires once per concern mount.
  useEffect(() => {
    track(
      "maintenance_concern_impression",
      {
        concernId: concern.id,
        severity: concern.severity,
        estimatedMonthlyLossNis: Math.round(concern.estimatedMonthlyLoss),
      },
      { surface: "maintenance_concern", siteId },
    );
  }, [concern.id, concern.severity, concern.estimatedMonthlyLoss, siteId]);

  // Reflect "request sent" chip whenever this concern's CTA completed.
  const flowConfirmedForConcern =
    flowState.step === "confirmation" &&
    flowState.context?.sourceSurface === "maintenance_concern" &&
    flowState.context.catalogItemId === concern.id;

  useEffect(() => {
    if (!flowConfirmedForConcern) return;
    // Deferred so the state write happens in a timer callback, not
    // synchronously in the effect body (react-hooks/set-state-in-effect).
    const t = window.setTimeout(() => setRequestSent(true), 0);
    return () => window.clearTimeout(t);
  }, [flowConfirmedForConcern]);

  useEffect(() => {
    if (!requestSent) return;
    const t = window.setTimeout(() => setRequestSent(false), 4000);
    return () => window.clearTimeout(t);
  }, [requestSent]);

  const handleCta = useCallback(() => {
    track(
      "maintenance_concern_cta_click",
      {
        concernId: concern.id,
        recommendationType: concern.recommendationType,
        confidence: concern.confidence,
      },
      { surface: "maintenance_concern", siteId },
    );
    const context: ConversionContext = {
      sourceSurface: "maintenance_concern",
      recommendationType: concern.recommendationType,
      catalogItemId: concern.id,
      catalogItemTitle: concern.title,
      monthlyGainNis: concern.estimatedMonthlyLoss || undefined,
      confidence: concern.confidence,
      priority: concern.severity === "critical" ? "high" : concern.severity === "warning" ? "medium" : "low",
      ctaKind: concern.recommendationType === "automation_opportunity" ? "configure" : "book",
      siteId,
      accessToken,
    };
    start(context);
  }, [accessToken, concern, siteId, start]);

  return (
    <article
      data-concern-id={concern.id}
      className={`relative rounded-2xl border p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md ${style.border}`}
    >
      {/* Header row: severity chip + title */}
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-xl p-2.5 ${style.chipBg} border`}>
          <Icon className={`h-5 w-5 ${style.chipText}`} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.chipBg} ${style.chipText}`}
            >
              {style.chipLabel}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {CONFIDENCE_LABEL[concern.confidence]}
            </span>
          </div>
          <h3 className="mt-1.5 text-base md:text-lg font-semibold tracking-tight">
            {concern.title}
          </h3>
        </div>
      </div>

      {/* Problem → Impact → Money */}
      <div className="mt-4 space-y-2.5 text-sm">
        <p className="text-muted-foreground">{concern.impact}</p>
        {/* Money row always renders (doc 03 DoD): preventive concerns
            without a measured loss state that explicitly instead of
            hiding the row. */}
        {concern.estimatedMonthlyLoss > 0 ? (
          <p className="font-mono text-sm">
            <span className="text-muted-foreground">Estimated loss: </span>
            <span className={`font-semibold ${style.accent}`}>
              {monthlyLossText}
            </span>
            <span className="text-muted-foreground"> / month</span>
          </p>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            Estimated loss: <span className="font-semibold text-foreground/80">none yet</span> — acting now prevents future losses
          </p>
        )}
      </div>

      {/* Recommended action */}
      <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended
        </p>
        <p className="mt-1 text-sm">{concern.recommendedAction}</p>
      </div>

      {/* Learn more hint (soiling explanation, weather window) */}
      {concern.learnMoreText ? (
        <p className="mt-3 border-l-2 border-border/60 pl-3 text-xs text-muted-foreground">
          {concern.learnMoreText}
        </p>
      ) : null}

      {/* Action row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCta}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${style.ctaBg}`}
        >
          {concern.ctaLabel}
        </button>
      </div>

      {requestSent ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 backdrop-blur"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Request sent — a provider will contact you within 48h
        </div>
      ) : null}
    </article>
  );
}
