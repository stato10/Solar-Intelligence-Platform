"use client";

/**
 * AutomationDeviceCard — doc 06 §7.
 *
 * Every device card carries:
 *   - device icon + name
 *   - why (one-sentence rationale)
 *   - schedule (recommended window)
 *   - monthly + yearly gain (raw numbers, formatted via `useCurrency()`)
 *   - confidence chip
 *   - primary CTA "Configure Automation" that routes through the
 *     shared conversion flow.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Car, CheckCircle2, Cpu, Thermometer, Waves } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils/formatters";
import { track } from "@/lib/analytics/client";
import {
  useConversionFlow,
  useConversionFlowState,
  type ConversionContext,
} from "@/hooks/use-conversion-flow";
import type { SmartDeviceRecommendationVm } from "@/lib/view-models/automation";

const ICON_BY_TYPE = {
  pool: Waves,
  ev: Car,
  heater: Thermometer,
  general: Cpu,
} as const;

const CONFIDENCE_STYLE: Record<SmartDeviceRecommendationVm["confidence"], string> = {
  high: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  low: "bg-muted text-muted-foreground border-border/60",
};

const CONFIDENCE_LABEL: Record<SmartDeviceRecommendationVm["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export interface AutomationDeviceCardProps {
  device: SmartDeviceRecommendationVm;
  siteId: string;
  accessToken?: string;
}

export function AutomationDeviceCard({ device, siteId, accessToken }: AutomationDeviceCardProps) {
  const { start } = useConversionFlow();
  const flowState = useConversionFlowState();
  const { currency, locale } = useCurrency();
  const [requestSent, setRequestSent] = useState(false);
  const Icon = ICON_BY_TYPE[device.iconType] ?? Cpu;
  const fmt = { currency, locale, decimals: 0 } as const;

  useEffect(() => {
    if (
      flowState.step === "confirmation" &&
      flowState.context?.sourceSurface === "automation_device" &&
      flowState.context.catalogItemId === device.id
    ) {
      setRequestSent(true);
    }
  }, [flowState.step, flowState.context, device.id]);

  useEffect(() => {
    if (!requestSent) return;
    const t = window.setTimeout(() => setRequestSent(false), 4000);
    return () => window.clearTimeout(t);
  }, [requestSent]);

  const handleConfigure = useCallback(() => {
    track(
      "automation_device_cta_click",
      {
        deviceTarget: device.deviceTarget,
        monthlyGainNis: Math.round(device.monthlyGainNis),
        confidence: device.confidence,
      },
      { surface: "automation_device", siteId },
    );
    const context: ConversionContext = {
      sourceSurface: "automation_device",
      recommendationType: "automation_opportunity",
      catalogItemId: device.id,
      catalogItemTitle: device.deviceName,
      deviceTarget: device.deviceTarget,
      monthlyGainNis: device.monthlyGainNis,
      yearlyGainNis: device.yearlyGainNis,
      confidence: device.confidence,
      priority: device.confidence === "high" ? "high" : "medium",
      ctaKind: "configure",
      siteId,
      accessToken,
    };
    start(context);
  }, [accessToken, device, siteId, start]);

  return (
    <article className="relative glass-card rounded-2xl p-5 md:p-6 overflow-hidden transition-shadow hover:shadow-md">
      {/* Decorative corner */}
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[100px] bg-primary/5" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{device.deviceName}</h3>
            <p className="text-xs text-muted-foreground truncate">{device.why}</p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CONFIDENCE_STYLE[device.confidence]}`}
        >
          {CONFIDENCE_LABEL[device.confidence]}
        </span>
      </div>

      <dl className="relative mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Recommended window</dt>
        <dd className="font-mono font-semibold tabular-nums text-right">{device.windowLabel}</dd>

        <dt className="text-muted-foreground">Estimated gain</dt>
        <dd className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
          {formatCurrency(device.monthlyGainNis, fmt)} <span className="text-xs font-normal text-muted-foreground">/ month</span>
        </dd>

        <dt className="text-muted-foreground">Yearly projection</dt>
        <dd className="text-right text-muted-foreground">
          {formatCurrency(device.yearlyGainNis, fmt)} <span className="text-xs">/ year</span>
        </dd>
      </dl>

      <div className="relative mt-5 pt-4 border-t border-border/50">
        <button
          type="button"
          onClick={handleConfigure}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Configure Automation <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {requestSent ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 backdrop-blur"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Request sent — we'll reach out to set this up
        </div>
      ) : null}
    </article>
  );
}
