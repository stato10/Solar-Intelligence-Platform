import { formatCurrency, formatScore, formatTimeRange, formatDate, type CurrencyCode } from "@/lib/utils/formatters";
import type { DashboardAggregateData } from "@/lib/contracts";

// ---------------------------------------------------------------------------
// Device target taxonomy — matches the conversion-flow `deviceTarget`
// set in `use-conversion-flow.tsx`.
// ---------------------------------------------------------------------------
export type AutomationDeviceTarget =
  | "boiler"
  | "dishwasher"
  | "ev-charger"
  | "smart-switch";

export type AutomationDeviceIcon = "pool" | "ev" | "heater" | "general";

export interface SmartDeviceRecommendationVm {
  id: string;
  deviceName: string;
  recommendedAction: string;
  /** Pre-formatted for backwards-compat with the legacy Automation page. */
  financialImpactMonth: string;
  financialImpactYear: string;
  iconType: AutomationDeviceIcon;
  // ---- doc 06 §7 — schema extension --------------------------------
  /** Canonical target used by the conversion flow. */
  deviceTarget: AutomationDeviceTarget;
  /** Recommended window, e.g. 12:00 / 14:00. */
  windowStart: string;
  windowEnd: string;
  /** Combined "12:00–14:00" label. */
  windowLabel: string;
  /** Raw numeric gains in the catalog's source currency (ILS by default).
   *  Client components re-format through `useCurrency()`. */
  monthlyGainNis: number;
  yearlyGainNis: number;
  confidence: "high" | "medium" | "low";
  /** "Run heating on surplus solar" — one-sentence rationale. */
  why: string;
}

export interface EnergyShiftVm {
  windowStart: string;
  windowEnd: string;
  windowLabel: string;
  totalShiftValueMonth: string;
  totalShiftValueMonthRaw: number;
}

export interface AutomationPageViewModel {
  header: {
    title: string;
    subtitle: string;
    /** Doc 06 §5 directive line, rendered below the main headline. */
    directive: string;
  };
  context: {
    siteId: string;
    generatedAt: string;
  };
  selfConsumption: {
    score: number;
    scoreText: string;
    description: string;
  };
  energyShift: EnergyShiftVm;
  deviceRecommendations: SmartDeviceRecommendationVm[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface DeviceHeuristic {
  name: string;
  target: AutomationDeviceTarget;
  icon: AutomationDeviceIcon;
  why: string;
}

function classifyDeviceAction(action: string): DeviceHeuristic {
  const txt = action.toLowerCase();
  if (txt.includes("ev") || txt.includes("vehicle") || txt.includes("car")) {
    return {
      name: "EV Charger",
      target: "ev-charger",
      icon: "ev",
      why: "Charge your EV directly off peak solar production",
    };
  }
  if (
    txt.includes("water") ||
    txt.includes("heater") ||
    txt.includes("boiler")
  ) {
    return {
      name: "Water Heater",
      target: "boiler",
      icon: "heater",
      why: "Run heating on surplus solar instead of grid import",
    };
  }
  if (txt.includes("dishwasher")) {
    return {
      name: "Dishwasher",
      target: "dishwasher",
      icon: "general",
      why: "Shift dishwasher cycles into the peak-solar window",
    };
  }
  if (txt.includes("pool")) {
    return {
      name: "Pool Pump",
      target: "smart-switch",
      icon: "pool",
      why: "Run the pool pump when your solar output is highest",
    };
  }
  return {
    name: "Smart Appliance",
    target: "smart-switch",
    icon: "general",
    why: "Shift this load into the peak-solar window",
  };
}

function offsetTime(base: string, hoursOffset: number): string {
  const [hStr, mStr = "00"] = base.split(":");
  const h = Math.max(0, Math.min(23, parseInt(hStr, 10) + hoursOffset));
  return `${String(h).padStart(2, "0")}:${mStr.padStart(2, "0")}`;
}

function deviceWindow(
  idx: number,
  total: number,
  solarStart: string,
  solarEnd: string,
): { start: string; end: string } {
  // If only one device, use the full solar window. Otherwise tile
  // devices across the peak window so the timeline stays readable
  // (doc 06 §6 — one device per lane).
  if (total <= 1) {
    return { start: solarStart, end: solarEnd };
  }
  const [sH] = solarStart.split(":").map((v) => parseInt(v, 10));
  const [eH] = solarEnd.split(":").map((v) => parseInt(v, 10));
  const span = Math.max(1, eH - sH);
  const chunk = Math.max(1, Math.round(span / total));
  const h0 = sH + idx * chunk;
  const h1 = Math.min(eH, h0 + chunk);
  const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return { start: pad(h0), end: pad(h1) };
}

function confidenceFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------
export interface AutomationViewModelOptions {
  currency?: CurrencyCode;
  locale?: string;
}

export function toAutomationPageViewModel(
  data: DashboardAggregateData,
  options: AutomationViewModelOptions = {},
): AutomationPageViewModel {
  const currency: CurrencyCode = options.currency ?? "ILS";
  const locale = options.locale ?? (currency === "ILS" ? "en-IL" : "en-US");
  const fmt = { currency, locale } as const;

  const sc = data.selfConsumption;
  const score = sc.selfConsumptionScore;
  const monthlySavings = sc.estimatedSavingsIls * 30; // approx monthly
  const yearlySavings = sc.estimatedSavingsIls * 365;
  const confidence = confidenceFromScore(score);

  const devices: SmartDeviceRecommendationVm[] = [];
  const actions =
    sc.actions && sc.actions.length > 0
      ? sc.actions
      : [
          "Run water heater during peak solar hours",
          "Shift dishwasher cycles into the 12:00–14:00 window",
        ];

  // Distribute savings across devices; first device gets the biggest
  // weight since the engine lists actions by priority.
  const weights = actions.length === 1 ? [1] : actions.length === 2 ? [0.6, 0.4] : actions.map((_, i, arr) => (i === 0 ? 0.5 : 0.5 / (arr.length - 1)));

  actions.forEach((action, idx) => {
    const heuristic = classifyDeviceAction(action);
    const weight = weights[idx] ?? 1 / actions.length;
    const window = deviceWindow(
      idx,
      actions.length,
      sc.recommendedUsageWindow.start,
      sc.recommendedUsageWindow.end,
    );
    const monthly = monthlySavings * weight;
    const yearly = yearlySavings * weight;
    devices.push({
      id: `dev-${heuristic.target}-${idx}`,
      deviceName: heuristic.name,
      recommendedAction: action,
      financialImpactMonth: formatCurrency(monthly, { ...fmt, decimals: 0 }),
      financialImpactYear: formatCurrency(yearly, { ...fmt, decimals: 0 }),
      iconType: heuristic.icon,
      deviceTarget: heuristic.target,
      windowStart: window.start,
      windowEnd: window.end,
      windowLabel: formatTimeRange(window.start, window.end),
      monthlyGainNis: monthly,
      yearlyGainNis: yearly,
      confidence,
      why: heuristic.why,
    });
  });

  const subtitle = score >= 80
    ? "Your home is highly optimized for solar self-consumption."
    : `Increase your self-consumption to save an additional ${formatCurrency(monthlySavings, { ...fmt, decimals: 0 })} per month.`;

  return {
    header: {
      title: "Smart Home Automation",
      subtitle,
      directive: "Shift more of your home usage into solar production hours.",
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
    },
    selfConsumption: {
      score,
      scoreText: formatScore(score),
      description: "How much of your solar energy is used locally versus exported to the grid.",
    },
    energyShift: {
      windowStart: sc.recommendedUsageWindow.start,
      windowEnd: sc.recommendedUsageWindow.end,
      windowLabel: formatTimeRange(sc.recommendedUsageWindow.start, sc.recommendedUsageWindow.end),
      totalShiftValueMonth: formatCurrency(monthlySavings, { ...fmt, decimals: 0 }),
      totalShiftValueMonthRaw: monthlySavings,
    },
    deviceRecommendations: devices,
  };
}

// Exported for tests — kept internal-grade but reachable.
export const __internal = { offsetTime, deviceWindow, classifyDeviceAction };
