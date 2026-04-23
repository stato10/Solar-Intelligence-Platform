"use client";

/**
 * MarketplaceActionCard — dashboard-surface CTA card (Hero, Usage Window).
 *
 * Sprint 2 migration: this card no longer submits leads directly. Instead it
 * delegates to the shared `useConversionFlow()` hook (see
 * docs/redesign/15-conversion-flow.md), which opens the 5-step modal and
 * emits the canonical analytics events from docs/redesign/17-monetization.md
 * §3.1. The card keeps its props signature (incl. legacy `payload` /
 * `accessToken`) so existing call-sites continue to compile without changes.
 */

import { Check, Sparkles, Droplets, Battery, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateLeadIntentPayload } from "@/lib/contracts/marketplace";
import {
  useConversionFlow,
  type ConversionContext,
  type ConversionSourceSurface,
} from "@/hooks/use-conversion-flow";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency, formatMoneyPerPeriod } from "@/lib/utils/formatters";
import type { RecommendationType } from "@/data/marketplace/types";

type MarketplaceActionKind = "cleaning" | "battery" | "automation";

interface MarketplaceActionCardProps {
  title: string;
  cause: string;
  monthlyLossIls: number;
  type: MarketplaceActionKind;
  actionLabel: string;
  payload: CreateLeadIntentPayload;
  accessToken?: string;
  /** Which dashboard surface is rendering this card. Defaults to hero. */
  sourceSurface?: ConversionSourceSurface;
}

const KIND_TO_RECOMMENDATION: Record<MarketplaceActionKind, RecommendationType> = {
  cleaning: "soiling",
  battery: "battery_opportunity",
  automation: "automation_opportunity",
};

function styleForKind(kind: MarketplaceActionKind): {
  border: string;
  icon: ReactNode;
  accent: string;
} {
  switch (kind) {
    case "cleaning":
      return {
        border: "border-amber-500/20",
        icon: <Droplets className="w-5 h-5 text-amber-500" />,
        accent: "text-amber-500",
      };
    case "battery":
      return {
        border: "border-blue-500/20",
        icon: <Battery className="w-5 h-5 text-blue-500" />,
        accent: "text-blue-500",
      };
    case "automation":
      return {
        border: "border-emerald-500/20",
        icon: <Zap className="w-5 h-5 text-emerald-500" />,
        accent: "text-emerald-500",
      };
    default:
      return {
        border: "border-slate-800",
        icon: <Sparkles className="w-5 h-5 text-primary" />,
        accent: "text-primary",
      };
  }
}

function optionsForKind(kind: MarketplaceActionKind): string[] {
  switch (kind) {
    case "cleaning":
      return [
        "Book local cleaning technician",
        "Install automatic robotic cleaning system",
      ];
    case "battery":
      return [
        "Install SolarEdge Home Battery",
        "Retrofit existing SMA inverter with storage",
      ];
    case "automation":
      return [
        "Smart switch for high-load boiler",
        "EV Charger scheduling integration",
      ];
    default:
      return [];
  }
}

export function MarketplaceActionCard({
  title,
  cause,
  monthlyLossIls,
  type,
  actionLabel,
  payload,
  accessToken,
  sourceSurface = "dashboard_hero",
}: MarketplaceActionCardProps) {
  const { start } = useConversionFlow();
  const { currency, locale } = useCurrency();
  const style = styleForKind(type);
  const yearlyGain = monthlyLossIls * 12;
  const options = optionsForKind(type);
  const monthlyLossDisplay = formatMoneyPerPeriod(
    Math.round(monthlyLossIls),
    "month",
    { currency, locale, decimals: 0 },
  );
  const yearlyGainDisplay = formatCurrency(Math.round(yearlyGain), {
    currency,
    locale,
    decimals: 0,
  });

  const handleActionClick = () => {
    const context: ConversionContext = {
      sourceSurface,
      recommendationType: KIND_TO_RECOMMENDATION[type],
      catalogItemTitle: title,
      monthlyGainNis: Math.round(monthlyLossIls),
      yearlyGainNis: Math.round(yearlyGain),
      confidence: "medium",
      priority: "high",
      ctaKind: "quote",
      siteId: payload.siteId || undefined,
      accessToken,
    };
    start(context);
  };

  return (
    <Card
      className={`overflow-hidden border bg-slate-950 mt-4 transition-all duration-200 hover:shadow-lg ${style.border}`}
    >
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 rounded-lg">{style.icon}</div>
            <h4 className="text-lg font-bold text-white">{title}</h4>
          </div>

          <p className="text-slate-300 mb-4 px-1">
            You are losing{" "}
            <strong className="text-white">{monthlyLossDisplay}</strong> due
            to {cause}.
          </p>

          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Check className={`w-4 h-4 ${style.accent}`} />
              <span>
                Fix:{" "}
                <strong>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>
                Estimated yearly gain: <strong>{yearlyGainDisplay}</strong>
              </span>
            </div>
          </div>

          <div className="px-1 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Options available:
            </p>
            <ul className="space-y-1">
              {options.map((opt, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-400 flex items-start gap-2"
                >
                  <span className="text-slate-600 mt-1">•</span>
                  {opt}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleActionClick}
            className="w-full font-bold shadow-lg text-white transition-all bg-indigo-600 hover:bg-indigo-500"
          >
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
