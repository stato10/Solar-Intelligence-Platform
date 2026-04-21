import type { DashboardAggregateData, DashboardIntelligence } from "@/lib/contracts";
import {
  formatCurrency,
  formatPercent,
  formatKwh,
  formatScore,
  formatTimeRange,
  formatDate,
  deviationToStatus,
  statusLabel,
  type SemanticStatus,
} from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Section 1 — Hero Insight
// ---------------------------------------------------------------------------
export interface HeroInsightVm {
  /** Short headline: what is happening */
  headline: string;
  /** Human-readable explanation */
  explanation: string;
  /** Formatted money impact (e.g. "₪87.60") */
  moneyImpact: string;
  /** Period label for the money figure */
  moneyPeriod: string;
  /** Semantic status for visual color coding */
  status: SemanticStatus;
  /** Status label for badge */
  statusLabel: string;
  /** Primary CTA text */
  ctaLabel: string;
  /** Type of CTA for future lead routing */
  ctaType: "cleaning" | "optimization" | "monitoring" | "battery" | "ev" | "automation" | "general";
}

// ---------------------------------------------------------------------------
// Section 2 — Performance Summary
// ---------------------------------------------------------------------------
export interface PerformanceCardVm {
  label: string;
  value: string;
  status: SemanticStatus;
}

export interface PerformanceVm {
  expected: PerformanceCardVm;
  actual: PerformanceCardVm;
  deviation: PerformanceCardVm;
  performanceStatus: "good" | "underperforming" | "overexporting";
  insight: string;
}

// ---------------------------------------------------------------------------
// Section 3 — Maintenance Summary
// ---------------------------------------------------------------------------
export interface MaintenanceSummaryVm {
  soilingScore: string;
  soilingLoss: string;
  cleaningRecommended: boolean;
  cleaningDate: string;
  soilingExplanation: string;
  heatScore: string;
  heatLoss: string;
  heatWindow: string;
  alertCount: number;
  alerts: Array<{
    id: string;
    type: string;
    severity: "low" | "moderate" | "high";
    message: string;
    actionHint?: string;
    moneyImpact?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Section 4 — Savings Summary
// ---------------------------------------------------------------------------
export interface SavingsSummaryVm {
  dailySavings: string;
  monthlySavings: string;
  yearlySavings: string;
  opportunityScore: string;
  opportunityValue: string;
  /** New: maintenance leakage from intelligence */
  maintenanceLeakage?: string;
  /** New: current vs optimal gap */
  headroom?: string;
}

// ---------------------------------------------------------------------------
// Section 5 — Usage Window
// ---------------------------------------------------------------------------
export interface UsageWindowVm {
  windowText: string;
  windowStart: string;
  windowEnd: string;
  selfConsumptionScore: string;
  estimatedSavings: string;
  actions: string[];
}

// ---------------------------------------------------------------------------
// Section 6 — Recommendations (kept for backward compat)
// ---------------------------------------------------------------------------
export interface DashboardRecommendationVm {
  id: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
}

// ---------------------------------------------------------------------------
// Full Dashboard ViewModel
// ---------------------------------------------------------------------------
export interface DashboardPageViewModel {
  hero: HeroInsightVm;
  performance: PerformanceVm;
  maintenance: MaintenanceSummaryVm;
  savings: SavingsSummaryVm;
  usageWindow: UsageWindowVm;
  recommendations: DashboardRecommendationVm[];
  providers: { weather: string; solar: string; engine: string };
  generatedAt: string;
  siteId: string;
  siteName?: string;
}

// ---------------------------------------------------------------------------
// Intelligence-first Hero derivation
// ---------------------------------------------------------------------------
function deriveHeroFromIntelligence(intel: DashboardIntelligence): HeroInsightVm {
  const status = intel.status;
  const PERIOD_LABELS: Record<string, string> = {
    daily: "daily impact",
    weekly: "weekly impact",
    monthly: "monthly impact",
    yearly: "yearly impact",
    recoverable: "recoverable value",
  };

  return {
    headline: status.headline,
    explanation: status.primaryCause,
    moneyImpact: formatCurrency(status.moneyImpactIls),
    moneyPeriod: PERIOD_LABELS[status.moneyPeriod] ?? status.moneyPeriod,
    status: status.level as SemanticStatus,
    statusLabel: status.statusLabel,
    ctaLabel: status.cta.label,
    ctaType: status.cta.type as HeroInsightVm["ctaType"],
  };
}

// ---------------------------------------------------------------------------
// Fallback: client-side Hero derivation (for old cached snapshots)
// ---------------------------------------------------------------------------
function deriveHeroFallback(data: DashboardAggregateData): HeroInsightVm {
  const devPercent = data.benchmark.productionDeviationPercent;
  const cleaningRec = data.soiling.cleaningRecommended;

  if (cleaningRec && Math.abs(devPercent) > 5) {
    return {
      headline: "Cleaning recommended — production is below expected",
      explanation: `Your system is underperforming by ${formatPercent(Math.abs(devPercent))}. Dust accumulation is the likely cause based on soiling analysis.`,
      moneyImpact: formatCurrency(data.optimization.estimatedValue),
      moneyPeriod: "recoverable value",
      status: "warning",
      statusLabel: "Attention Needed",
      ctaLabel: "Schedule Cleaning",
      ctaType: "cleaning",
    };
  }

  if (Math.abs(devPercent) > 10) {
    return {
      headline: "Significant production deviation detected",
      explanation: `Production is ${devPercent < 0 ? "below" : "above"} expected by ${formatPercent(Math.abs(devPercent))}. ${data.benchmark.insight}`,
      moneyImpact: formatCurrency(data.financial.monthlyEstimatedSavings),
      moneyPeriod: "monthly savings at risk",
      status: "critical",
      statusLabel: "Action Required",
      ctaLabel: "Review Optimization",
      ctaType: "optimization",
    };
  }

  if (cleaningRec) {
    return {
      headline: "Panel cleaning is recommended",
      explanation: data.soiling.explanation,
      moneyImpact: formatCurrency(data.optimization.estimatedValue),
      moneyPeriod: "optimization potential",
      status: "warning",
      statusLabel: "Maintenance Suggested",
      ctaLabel: "Schedule Cleaning",
      ctaType: "cleaning",
    };
  }

  return {
    headline: "Your system is performing well",
    explanation: `Production is within expected range. ${data.benchmark.insight}`,
    moneyImpact: formatCurrency(data.financial.monthlyEstimatedSavings),
    moneyPeriod: "monthly estimated savings",
    status: "good",
    statusLabel: "On Track",
    ctaLabel: "View Details",
    ctaType: "general",
  };
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------
export function toDashboardPageViewModel(data: DashboardAggregateData): DashboardPageViewModel {
  const devPercent = data.benchmark.productionDeviationPercent;
  const devStatus = deviationToStatus(devPercent);
  const intel = data.intelligence;

  // Prefer backend intelligence for hero; fall back to client-side derivation
  const hero = intel
    ? deriveHeroFromIntelligence(intel)
    : deriveHeroFallback(data);

  // Build intelligence-enriched alerts for the maintenance summary
  const intelligenceAlerts = intel?.alerts ?? [];
  const maintenanceAlerts = intelligenceAlerts.filter(
    (a) => a.category === "maintenance" || a.category === "production"
  );

  // Merge raw risk alerts with intelligence alerts for richer display
  const mergedAlerts = maintenanceAlerts.length > 0
    ? maintenanceAlerts.map((a) => ({
        id: a.id,
        type: a.category,
        severity: a.severity,
        message: a.message,
        actionHint: a.actionHint,
        moneyImpact: a.moneyImpactIls ? formatCurrency(a.moneyImpactIls) : undefined,
      }))
    : data.risks.alerts.map((a, i) => ({
        id: `alert-${i}`,
        type: a.riskType,
        severity: a.severity,
        message: a.message,
      }));

  // Build savings with intelligence profit data when available
  const savings: SavingsSummaryVm = {
    dailySavings: formatCurrency(intel?.profit.dailySavingsIls ?? data.financial.dailyEstimatedSavings),
    monthlySavings: formatCurrency(intel?.profit.monthlySavingsIls ?? data.financial.monthlyEstimatedSavings),
    yearlySavings: formatCurrency(intel?.profit.yearlySavingsIls ?? data.financial.yearlyOptimizationPotential),
    opportunityScore: formatScore(data.optimization.opportunityScore),
    opportunityValue: formatCurrency(data.optimization.estimatedValue),
    maintenanceLeakage: intel ? formatCurrency(intel.profit.maintenanceLeakageMonthlyIls) : undefined,
    headroom: intel ? formatCurrency(intel.profit.headroomMonthlyIls) : undefined,
  };

  return {
    hero,

    performance: {
      expected: {
        label: "Expected Production",
        value: formatKwh(data.benchmark.expectedProductionKwh),
        status: "good",
      },
      actual: {
        label: "Actual Production",
        value: formatKwh(data.benchmark.actualProductionKwh),
        status: devStatus,
      },
      deviation: {
        label: "Deviation",
        value: formatPercent(devPercent),
        status: devStatus,
      },
      performanceStatus: data.benchmark.performanceStatus,
      insight: data.benchmark.insight,
    },

    maintenance: {
      soilingScore: formatScore(data.soiling.score),
      soilingLoss: formatPercent(data.soiling.estimatedLossPercent),
      cleaningRecommended: data.soiling.cleaningRecommended,
      cleaningDate: formatDate(data.soiling.recommendedCleaningDate),
      soilingExplanation: data.soiling.explanation,
      heatScore: formatScore(data.heat.score),
      heatLoss: formatPercent(data.heat.estimatedLossPercent),
      heatWindow: formatTimeRange(data.heat.peakHeatWindowStart, data.heat.peakHeatWindowEnd),
      alertCount: mergedAlerts.length,
      alerts: mergedAlerts,
    },

    savings,

    usageWindow: {
      windowText: formatTimeRange(
        data.selfConsumption.recommendedUsageWindow.start,
        data.selfConsumption.recommendedUsageWindow.end
      ),
      windowStart: data.selfConsumption.recommendedUsageWindow.start,
      windowEnd: data.selfConsumption.recommendedUsageWindow.end,
      selfConsumptionScore: formatScore(data.selfConsumption.selfConsumptionScore),
      estimatedSavings: formatCurrency(data.selfConsumption.estimatedSavingsIls),
      actions: data.selfConsumption.actions,
    },

    recommendations: data.optimization.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      severity: item.severity,
    })),

    providers: {
      weather: data.providers.weather,
      solar: data.providers.solar,
      engine: data.providers.engine,
    },

    generatedAt: formatDate(data.generatedAt),
    siteId: data.siteId,
    siteName: data.siteName,
  };
}
