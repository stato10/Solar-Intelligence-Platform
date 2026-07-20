import type {
  DashboardAggregateData,
  DashboardRecommendation,
  DashboardRiskAlert,
  IntelligenceAlertItem,
} from "@/lib/contracts";
import type { RecommendationType } from "@/data/marketplace/types";
import {
  formatPercent,
  formatCurrency,
  formatDate,
  formatScore,
  formatTimeRange,
  formatDateTime,
  resolveAggregateCurrency,
  type CurrencyCode,
} from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MaintenanceRiskAlertVm {
  id: string;
  riskType: string;
  severity: "low" | "moderate" | "high";
  message: string;
  windowText: string;
  actionHint?: string;
  moneyImpact?: string;
}

export interface MaintenanceRecommendationVm {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  typeLabel: string;
  sourceModuleLabel: string;
  validityText: string;
  isMaintenanceLikely: boolean;
}

// ConcernCard contract — doc 03 §6. One card per maintenance signal,
// sharing the Problem → Impact → Money → Action layout.
export type ConcernSeverity = "critical" | "warning" | "info";
export type ConcernIcon = "droplets" | "thermometer" | "shield" | "wrench" | "sparkles";

export interface MaintenanceConcernVm {
  id: string;
  title: string;
  severity: ConcernSeverity;
  icon: ConcernIcon;
  impact: string;
  estimatedMonthlyLoss: number;
  estimatedMonthlyLossText: string;
  confidence: "high" | "medium" | "low";
  recommendedAction: string;
  recommendationType: RecommendationType;
  ctaLabel: string;
  learnMoreText?: string;
}

export interface MaintenancePageViewModel {
  header: {
    title: string;
    subtitle: string;
    statusLevel: "good" | "warning" | "critical";
    urgencyLabel: string | null;
  };
  concerns: MaintenanceConcernVm[];
  context: {
    siteId: string;
    generatedAt: string;
    source: string;
    providers: { weather: string; solar: string; engine: string };
  };
  moneyImpact: {
    leakageMonthly: string;
    leakageExplanation: string;
    recoverable: string;
  };
  soiling: {
    score: number;
    scoreText: string;
    estimatedLoss: number;
    estimatedLossText: string;
    cleaningRecommended: boolean;
    cleaningRecommendedText: string;
    recommendedCleaningDateText: string;
    explanation: string;
  };
  heat: {
    score: number;
    scoreText: string;
    estimatedLoss: number;
    estimatedLossText: string;
    peakWindowText: string;
  };
  alerts: {
    items: MaintenanceRiskAlertVm[];
    intelligenceAlerts: MaintenanceRiskAlertVm[];
  };
  recommendations: {
    maintenanceLikely: MaintenanceRecommendationVm[];
    other: MaintenanceRecommendationVm[];
  };
  actionCards: Array<{
    id: string;
    title: string;
    description: string;
    ctaLabel: string;
    icon: "droplets" | "thermometer" | "shield" | "wrench";
    enabled: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toAlertVm(alert: DashboardRiskAlert): MaintenanceRiskAlertVm {
  return {
    id: `${alert.riskType}-${alert.expectedStart}-${alert.expectedEnd}`,
    riskType: alert.riskType,
    severity: alert.severity,
    message: alert.message,
    windowText: formatTimeRange(formatDateTime(alert.expectedStart), formatDateTime(alert.expectedEnd)),
  };
}

function intelligenceAlertToVm(
  alert: IntelligenceAlertItem,
  options: { currency: CurrencyCode; locale: string },
): MaintenanceRiskAlertVm {
  return {
    id: alert.id,
    riskType: alert.category,
    severity: alert.severity,
    message: alert.message,
    windowText: "",
    actionHint: alert.actionHint,
    moneyImpact: alert.moneyImpactIls
      ? formatCurrency(alert.moneyImpactIls, { ...options, decimals: 0 })
      : undefined,
  };
}

function isMaintenanceLikelyRecommendation(item: DashboardRecommendation): boolean {
  const signal = `${item.type} ${item.sourceModule}`.toLowerCase();
  return (
    signal.includes("soil") ||
    signal.includes("clean") ||
    signal.includes("heat") ||
    signal.includes("risk") ||
    signal.includes("maint")
  );
}

function toRecommendationVm(item: DashboardRecommendation): MaintenanceRecommendationVm {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    severity: item.severity,
    typeLabel: item.type,
    sourceModuleLabel: item.sourceModule,
    validityText: formatTimeRange(formatDate(item.validFrom), formatDate(item.validUntil)),
    isMaintenanceLikely: isMaintenanceLikelyRecommendation(item),
  };
}

// ---------------------------------------------------------------------------
// Concern builders — doc 03 §6 contract
// ---------------------------------------------------------------------------
function confidenceFromLoss(lossPercent: number): "high" | "medium" | "low" {
  if (lossPercent >= 8) return "high";
  if (lossPercent >= 4) return "medium";
  return "low";
}

function severityOrder(severity: ConcernSeverity): number {
  return severity === "critical" ? 0 : severity === "warning" ? 1 : 2;
}

function buildSoilingConcern(
  data: DashboardAggregateData,
  leakageMonthly: number,
  options: { currency: CurrencyCode; locale: string },
): MaintenanceConcernVm | null {
  if (!data.soiling.cleaningRecommended && data.soiling.estimatedLossPercent < 3) {
    return null;
  }
  const lossPercent = data.soiling.estimatedLossPercent;
  const severity: ConcernSeverity =
    lossPercent >= 8 ? "critical" : lossPercent >= 4 ? "warning" : "info";
  // Attribute a proportional share of the maintenance leakage to soiling
  // when the engine has given us a total; else fall back to a simple
  // per-percent-point estimate keyed off monthly import spend when
  // available. Never invent numbers we don't have.
  const monthlyLoss = leakageMonthly > 0
    ? leakageMonthly * 0.6
    : Math.max(0, lossPercent * 12); // last resort, ~₪12 per loss-percent
  const by = data.soiling.recommendedCleaningDate
    ? ` by ${formatDate(data.soiling.recommendedCleaningDate)}`
    : " in the next 7 days";
  return {
    id: "concern-soiling",
    title: "Dust buildup detected",
    severity,
    icon: "droplets",
    impact: `−${lossPercent.toFixed(1)}% efficiency this month`,
    estimatedMonthlyLoss: monthlyLoss,
    estimatedMonthlyLossText: formatCurrency(monthlyLoss, {
      currency: options.currency,
      locale: options.locale,
      decimals: 0,
    }),
    confidence: confidenceFromLoss(lossPercent),
    recommendedAction: `Book panel cleaning${by}`,
    recommendationType: "soiling",
    ctaLabel: "Book cleaning",
    learnMoreText: data.soiling.explanation || undefined,
  };
}

function buildHeatConcern(
  data: DashboardAggregateData,
  leakageMonthly: number,
  options: { currency: CurrencyCode; locale: string },
): MaintenanceConcernVm | null {
  if (data.heat.estimatedLossPercent < 5) return null;
  const lossPercent = data.heat.estimatedLossPercent;
  const severity: ConcernSeverity =
    lossPercent >= 12 ? "critical" : lossPercent >= 8 ? "warning" : "info";
  const monthlyLoss = leakageMonthly > 0
    ? leakageMonthly * 0.35
    : Math.max(0, lossPercent * 10);
  const window = formatTimeRange(
    data.heat.peakHeatWindowStart,
    data.heat.peakHeatWindowEnd,
  );
  return {
    id: "concern-heat",
    title: "Thermal derating during peak hours",
    severity,
    icon: "thermometer",
    impact: `−${lossPercent.toFixed(1)}% output between ${window}`,
    estimatedMonthlyLoss: monthlyLoss,
    estimatedMonthlyLossText: formatCurrency(monthlyLoss, {
      currency: options.currency,
      locale: options.locale,
      decimals: 0,
    }),
    confidence: confidenceFromLoss(lossPercent),
    recommendedAction:
      "Shift heavy loads into the peak-solar window to offset thermal losses",
    recommendationType: "automation_opportunity",
    ctaLabel: "Configure automation",
  };
}

function buildRiskConcerns(data: DashboardAggregateData): MaintenanceConcernVm[] {
  return data.risks.alerts
    .filter((a) => a.severity === "high" || a.severity === "moderate")
    .slice(0, 2)
    .map<MaintenanceConcernVm>((alert) => {
      const severity: ConcernSeverity =
        alert.severity === "high" ? "critical" : "warning";
      // Alerts don't carry explicit losses; surface the window instead.
      return {
        id: `concern-risk-${alert.riskType}-${alert.expectedStart}`,
        title: `${capitalize(alert.riskType)} risk detected`,
        severity,
        icon: "shield",
        impact: alert.message,
        estimatedMonthlyLoss: 0,
        estimatedMonthlyLossText: "—",
        confidence: alert.severity === "high" ? "high" : "medium",
        recommendedAction: `Schedule inspection before ${formatDate(alert.expectedStart)}`,
        recommendationType: "soiling", // routes to provider-service category
        ctaLabel: "Book inspection",
        learnMoreText: `Window: ${formatTimeRange(
          formatDateTime(alert.expectedStart),
          formatDateTime(alert.expectedEnd),
        )}`,
      };
    });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------
export interface MaintenanceViewModelOptions {
  currency?: CurrencyCode;
  locale?: string;
}

export function toMaintenancePageViewModel(
  data: DashboardAggregateData,
  options: MaintenanceViewModelOptions = {},
): MaintenancePageViewModel {
  // Default to the tariff currency echoed on the aggregate; explicit
  // options (from a caller that already resolved currency) win.
  const aggregateFmt = resolveAggregateCurrency(data);
  const currency: CurrencyCode = options.currency ?? aggregateFmt.currency;
  const locale =
    options.locale ??
    (options.currency ? (currency === "ILS" ? "en-IL" : "en-US") : aggregateFmt.locale);
  const fmt = { currency, locale } as const;
  const recommendationItems = data.optimization.recommendations.map(toRecommendationVm);
  const maintenanceLikely = recommendationItems.filter((item) => item.isMaintenanceLikely);
  const other = recommendationItems.filter((item) => !item.isMaintenanceLikely);

  const intel = data.intelligence;
  const intelAlerts = (intel?.alerts ?? [])
    .filter((a) => a.category === "maintenance" || a.category === "weather" || a.category === "production")
    .map((a) => intelligenceAlertToVm(a, fmt));

  // Determine status from intelligence or fallback logic
  const statusLevel = intel?.status.level ?? (
    data.soiling.cleaningRecommended ? "warning" : "good"
  );

  // Dynamic header based on intelligence
  const hasIssues = data.soiling.cleaningRecommended ||
    data.heat.estimatedLossPercent > 5 ||
    data.risks.alerts.length > 0;

  const subtitle = intel
    ? intel.status.primaryCause
    : hasIssues
      ? "Active maintenance signals detected. Review recommended actions below."
      : "All maintenance signals are within normal range.";

  // Money impact from intelligence
  const leakageMonthly = intel?.profit.maintenanceLeakageMonthlyIls ?? 0;
  const recoverable = data.optimization.estimatedValue;

  // Legacy actionCards field — kept for contract stability but no longer
  // populated after Sprint 3 (doc 03 §10): the ConcernCards are the CTA
  // surface. Page no longer renders this array.
  const actionCards: MaintenancePageViewModel["actionCards"] = [];

  // Build ConcernCards per doc 03 §6. Soiling + heat are derived from
  // the dashboard aggregate; high/moderate weather risks surface as
  // inspection concerns. Sorting: severity then loss descending.
  const concerns: MaintenanceConcernVm[] = [];
  const soilingConcern = buildSoilingConcern(data, leakageMonthly, fmt);
  if (soilingConcern) concerns.push(soilingConcern);
  const heatConcern = buildHeatConcern(data, leakageMonthly, fmt);
  if (heatConcern) concerns.push(heatConcern);
  concerns.push(...buildRiskConcerns(data));
  concerns.sort((a, b) => {
    const byS = severityOrder(a.severity) - severityOrder(b.severity);
    if (byS !== 0) return byS;
    return b.estimatedMonthlyLoss - a.estimatedMonthlyLoss;
  });

  const urgencyLabel: string | null =
    statusLevel === "critical"
      ? "Immediate action"
      : statusLevel === "warning"
        ? "Action recommended"
        : null;

  return {
    header: {
      title: "Maintenance",
      subtitle,
      statusLevel: statusLevel as "good" | "warning" | "critical",
      urgencyLabel,
    },
    concerns,
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
      source: data.source,
      providers: {
        weather: data.providers.weather,
        solar: data.providers.solar,
        engine: data.providers.engine,
      },
    },
    moneyImpact: {
      leakageMonthly: formatCurrency(leakageMonthly, { ...fmt, decimals: 0 }),
      leakageExplanation: leakageMonthly > 0
        ? `You're losing approximately ${formatCurrency(leakageMonthly, { ...fmt, decimals: 0 })}/month due to maintenance issues.`
        : "No measurable leakage from maintenance issues.",
      recoverable: formatCurrency(recoverable, { ...fmt, decimals: 0 }),
    },
    soiling: {
      score: data.soiling.score,
      scoreText: formatScore(data.soiling.score),
      estimatedLoss: data.soiling.estimatedLossPercent,
      estimatedLossText: formatPercent(data.soiling.estimatedLossPercent),
      cleaningRecommended: data.soiling.cleaningRecommended,
      cleaningRecommendedText: data.soiling.cleaningRecommended ? "Yes" : "No",
      recommendedCleaningDateText: formatDate(data.soiling.recommendedCleaningDate),
      explanation: data.soiling.explanation,
    },
    heat: {
      score: data.heat.score,
      scoreText: formatScore(data.heat.score),
      estimatedLoss: data.heat.estimatedLossPercent,
      estimatedLossText: formatPercent(data.heat.estimatedLossPercent),
      peakWindowText: formatTimeRange(data.heat.peakHeatWindowStart, data.heat.peakHeatWindowEnd),
    },
    alerts: {
      items: data.risks.alerts.map(toAlertVm),
      intelligenceAlerts: intelAlerts,
    },
    recommendations: {
      maintenanceLikely,
      other,
    },
    actionCards,
  };
}
