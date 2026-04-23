"use client";

/**
 * OpportunityActionCard — compact CTA surfaced inside the energy decision
 * lane cards on the dashboard.
 *
 * Sprint 2: delegates to the shared 5-step conversion flow (doc 15) via
 * `useConversionFlow()` instead of calling `/leads/intents` directly. Props
 * stay backwards compatible so the decision-lane cards keep rendering.
 */

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreateLeadIntentPayload } from "@/lib/contracts/marketplace";
import {
  useConversionFlow,
  type ConversionContext,
} from "@/hooks/use-conversion-flow";
import type { RecommendationType } from "@/data/marketplace/types";

type OpportunityKind = "service" | "product" | "automation";

interface OpportunityActionCardProps {
  title: string;
  message: string;
  type: OpportunityKind;
  topic: string;
  estimatedValue?: string;
  actionLabel: string;
  payload: CreateLeadIntentPayload;
  accessToken?: string;
}

function topicToRecommendation(topic: string): RecommendationType {
  switch (topic) {
    case "battery":
      return "battery_opportunity";
    case "ev":
    case "ev-charger":
      return "ev_opportunity";
    case "cleaning":
    case "soiling":
      return "soiling";
    case "automation":
    case "switcher":
      return "automation_opportunity";
    default:
      return "low_self_consumption";
  }
}

function parseEstimatedValue(estimatedValue?: string): number | undefined {
  if (!estimatedValue) return undefined;
  const n = parseFloat(estimatedValue.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function getStyleForType(type: OpportunityKind): string {
  switch (type) {
    case "service":
      return "text-amber-600 bg-amber-500/10 border-amber-500/20";
    case "product":
      return "text-blue-600 bg-blue-500/10 border-blue-500/20";
    case "automation":
      return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
    default:
      return "text-primary bg-primary/10 border-primary/20";
  }
}

export function OpportunityActionCard({
  title,
  message,
  type,
  topic,
  estimatedValue,
  actionLabel,
  payload,
  accessToken,
}: OpportunityActionCardProps) {
  const isEnabled =
    process.env.NEXT_PUBLIC_FEATURE_MARKETPLACE_OPPORTUNITIES === "true";
  const { start } = useConversionFlow();

  if (!isEnabled) {
    return null;
  }

  const handleActionClick = () => {
    const monthlyGain = parseEstimatedValue(estimatedValue);
    const context: ConversionContext = {
      sourceSurface: "dashboard_recommended",
      recommendationType: topicToRecommendation(topic),
      catalogItemTitle: title,
      monthlyGainNis: monthlyGain,
      confidence: "medium",
      priority: "medium",
      ctaKind: type === "automation" ? "configure" : "quote",
      siteId: payload.siteId || undefined,
      accessToken,
    };
    start(context);
  };

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm",
        getStyleForType(type),
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" />
            {title}
          </h4>
          <p className="mt-1 text-sm opacity-90">{message}</p>
          {estimatedValue && (
            <p className="mt-2 text-xs font-medium uppercase tracking-wider opacity-80">
              Est. Value: {estimatedValue}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          <Button
            onClick={handleActionClick}
            className="shadow-sm w-full sm:w-auto transition-all"
            size="sm"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
