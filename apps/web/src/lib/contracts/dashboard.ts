import type { ApiSuccessEnvelope } from "./common";

export interface DashboardAggregateRequest {
  siteId: string;
  latitude: number;
  longitude: number;
  systemSizeKw: number;
  lossPercent?: number;
  timezone?: string;
  generatedAt?: string;
  tariff?: {
    currency?: string;
    importRate?: number;
    exportRate?: number;
  };
}

export interface DashboardRiskAlert {
  riskType: string;
  severity: "low" | "moderate" | "high";
  message: string;
  expectedStart: string;
  expectedEnd: string;
}

export interface DashboardRecommendation {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  priority: number;
  estimatedValue: number;
  validFrom: string;
  validUntil: string;
  sourceModule: string;
}

// ---------------------------------------------------------------------------
// Intelligence Layer — backend-derived, additively attached to the aggregate
// response. Frontend view-models prefer this when present; otherwise fall
// back to local derivation for backward compatibility.
// ---------------------------------------------------------------------------
export type IntelligenceStatusLevel = "good" | "warning" | "critical";

export type IntelligenceMoneyPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "recoverable";

export type IntelligenceCtaType =
  | "cleaning"
  | "optimization"
  | "monitoring"
  | "battery"
  | "ev"
  | "automation"
  | "general";

export type IntelligenceAlertCategory =
  | "maintenance"
  | "weather"
  | "production"
  | "financial";

export type IntelligenceOpportunityType =
  | "cleaning"
  | "battery"
  | "ev"
  | "automation";

export type IntelligenceConfidence = "low" | "medium" | "high";

export interface IntelligenceStatusBlock {
  level: IntelligenceStatusLevel;
  statusLabel: string;
  headline: string;
  primaryCause: string;
  moneyImpactIls: number;
  moneyPeriod: IntelligenceMoneyPeriod;
  cta: {
    label: string;
    type: IntelligenceCtaType;
  };
}

export interface IntelligenceProfitBlock {
  dailySavingsIls: number;
  monthlySavingsIls: number;
  yearlySavingsIls: number;
  maintenanceLeakageMonthlyIls: number;
  exportValueDailyIls: number;
  selfConsumptionValueDailyIls: number;
  currentMonthlyIls: number;
  optimalMonthlyIls: number;
  headroomMonthlyIls: number;
}

export interface IntelligenceAlertItem {
  id: string;
  severity: "low" | "moderate" | "high";
  category: IntelligenceAlertCategory;
  title: string;
  message: string;
  actionHint?: string;
  moneyImpactIls?: number;
}

export interface IntelligenceOpportunityItem {
  id: string;
  type: IntelligenceOpportunityType;
  title: string;
  description: string;
  estimatedValueIls: number;
  confidence: IntelligenceConfidence;
  priority: number;
}

export interface DashboardIntelligence {
  status: IntelligenceStatusBlock;
  profit: IntelligenceProfitBlock;
  alerts: IntelligenceAlertItem[];
  opportunities: IntelligenceOpportunityItem[];
  generatedAt: string;
  lossBreakdown?: any;
  estimation?: any;
  engineRecommendations?: any[];
  simulations?: any;
  debug?: any;
}

export interface DashboardAggregateData {
  siteId: string;
  siteName?: string;
  generatedAt: string;
  source: "DASHBOARD_AGGREGATED_V1";
  forecast: {
    expectedDailyKwh: number;
    expectedWeeklyKwh: number;
    expectedMonthlyKwh: number;
  };
  soiling: {
    score: number;
    estimatedLossPercent: number;
    cleaningRecommended: boolean;
    recommendedCleaningDate: string | null;
    explanation: string;
  };
  heat: {
    score: number;
    estimatedLossPercent: number;
    peakHeatWindowStart: string;
    peakHeatWindowEnd: string;
  };
  risks: {
    alerts: DashboardRiskAlert[];
  };
  optimization: {
    opportunityScore: number;
    recommendations: DashboardRecommendation[];
    estimatedValue: number;
  };
  financial: {
    dailyEstimatedSavings: number;
    monthlyEstimatedSavings: number;
    yearlyOptimizationPotential: number;
  };
  benchmark: {
    expectedProductionKwh: number;
    actualProductionKwh: number;
    expectedExportKwh: number;
    actualExportKwh: number;
    productionDeviationPercent: number;
    exportDeviationPercent: number;
    performanceStatus: "good" | "underperforming" | "overexporting";
    insight: string;
  };
  selfConsumption: {
    recommendedUsageWindow: {
      start: string;
      end: string;
    };
    selfConsumptionScore: number;
    estimatedSavingsIls: number;
    actions: string[];
  };
  providers: {
    weather: string;
    solar: string;
    engine: string;
  };
  /**
   * Optional Intelligence Layer block. Added additively by the backend.
   * Older clients and older cached snapshots may omit this field, so
   * all consumers MUST treat it as optional.
   */
  intelligence?: DashboardIntelligence;
}

export type DashboardAggregateSuccessEnvelope = ApiSuccessEnvelope<DashboardAggregateData>;

export interface DashboardDemoSeedResponseData {
  dashboard: DashboardAggregateData;
  user?: unknown;
  site?: unknown;
  system?: unknown;
  tariff?: unknown;
  aggregatePayload?: unknown;
}

export type DashboardDemoSeedSuccessEnvelope = ApiSuccessEnvelope<DashboardDemoSeedResponseData>;
