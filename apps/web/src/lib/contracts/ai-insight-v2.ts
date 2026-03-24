import type { ApiSuccessEnvelope } from "./common";

export type Severity = "low" | "moderate" | "high";
export type Confidence = "low" | "moderate" | "high";
export type InsightType = "behavior" | "maintenance" | "product";
export type Actionability = "immediate" | "scheduled" | "informational";

export type AggregateSourceRef =
  | "soiling.score"
  | "soiling.estimatedLossPercent"
  | "soiling.cleaningRecommended"
  | "soiling.recommendedCleaningDate"
  | "soiling.explanation"
  | "heat.score"
  | "heat.estimatedLossPercent"
  | "heat.peakHeatWindowStart"
  | "heat.peakHeatWindowEnd"
  | "risks.alerts[].riskType"
  | "risks.alerts[].severity"
  | "risks.alerts[].message"
  | "risks.alerts[].expectedStart"
  | "risks.alerts[].expectedEnd"
  | "optimization.opportunityScore"
  | "optimization.estimatedValue"
  | "optimization.recommendations[].id"
  | "optimization.recommendations[].type"
  | "optimization.recommendations[].title"
  | "optimization.recommendations[].message"
  | "optimization.recommendations[].severity"
  | "optimization.recommendations[].priority"
  | "optimization.recommendations[].estimatedValue"
  | "optimization.recommendations[].validFrom"
  | "optimization.recommendations[].validUntil"
  | "optimization.recommendations[].sourceModule"
  | "financial.dailyEstimatedSavings"
  | "financial.monthlyEstimatedSavings"
  | "financial.yearlyOptimizationPotential"
  | "benchmark.expectedProductionKwh"
  | "benchmark.actualProductionKwh"
  | "benchmark.expectedExportKwh"
  | "benchmark.actualExportKwh"
  | "benchmark.productionDeviationPercent"
  | "benchmark.exportDeviationPercent"
  | "benchmark.performanceStatus"
  | "benchmark.insight"
  | "selfConsumption.recommendedUsageWindow.start"
  | "selfConsumption.recommendedUsageWindow.end"
  | "selfConsumption.selfConsumptionScore"
  | "selfConsumption.estimatedSavingsIls"
  | "selfConsumption.actions[]"
  | "siteId"
  | "generatedAt"
  | "source"
  | "providers.weather"
  | "providers.solar"
  | "providers.engine";

export interface TraceableReason {
  text: string;
  sourceRefs: AggregateSourceRef[];
}

export interface BenefitRange {
  min: number;
  max: number;
  basedOn: AggregateSourceRef[];
}

export interface InsightItem {
  id: string;
  insightType: InsightType;
  title: string;
  message: string;
  severity: Severity;
  confidence: Confidence;
  actionability: Actionability;
  reason: TraceableReason;
  requiresPurchase: boolean;
  expectedBenefitRangeIlsMonthly?: BenefitRange;
}

export interface SuitabilityRule {
  field: AggregateSourceRef;
  operator: ">" | "<" | "=";
  value: number | string;
}

export interface SmartProductCatalogItem {
  id: string;
  name: string;
  category: "boiler-control" | "ev-charging" | "hvac-control" | "load-shifting";
  useCase: string;
  suitableWhen: SuitabilityRule[];
  expectedBenefitType:
    | "self-consumption-improvement"
    | "export-to-self-consumption-shift"
    | "load-shifting";
  requiresPurchase: true;
}

export interface ProductRecommendationItem {
  id: string;
  insightType: "product";
  severity: Severity;
  confidence: Confidence;
  actionability: Actionability;
  productId: string;
  name: string;
  useCase: string;
  reason: TraceableReason;
  whyRelevant: TraceableReason;
  expectedBenefitRangeIlsMonthly: BenefitRange;
  requiresPurchase: true;
}

export interface SavingsLineItem {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  confidence: Confidence;
  actionability: Actionability;
  reason: TraceableReason;
  expectedBenefitRangeIlsMonthly?: BenefitRange;
}

export interface SavingsExplanationSection {
  summary: string;
  items: SavingsLineItem[];
}

export interface SavingsExplanation {
  withoutUpgrades: SavingsExplanationSection;
  withUpgrades: SavingsExplanationSection;
}

export interface AiInsightContractInput {
  contractVersion: "ai-insight-v2";
  context: {
    siteId: string;
    generatedAt: string;
    source: "DASHBOARD_AGGREGATED_V1";
    providers?: {
      weather?: string;
      solar?: string;
      engine?: string;
    };
  };
  aggregate: {
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
      alerts: Array<{
        riskType: string;
        severity: Severity;
        message: string;
        expectedStart: string;
        expectedEnd: string;
      }>;
    };
    optimization: {
      opportunityScore: number;
      estimatedValue: number;
      recommendations: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        severity: Severity;
        priority: number;
        estimatedValue: number;
        validFrom: string;
        validUntil: string;
        sourceModule: string;
      }>;
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
      recommendedUsageWindow: { start: string; end: string };
      selfConsumptionScore: number;
      estimatedSavingsIls: number;
      actions: string[];
    };
  };
  productCatalog: SmartProductCatalogItem[];
  guardrails: {
    allowOnlySourceRefs: AggregateSourceRef[];
    severityEnum: ["low", "moderate", "high"];
    confidenceEnum: ["low", "moderate", "high"];
    noMetricRecompute: true;
    noHallucinatedNumbers: true;
  };
}

export interface AiInsightContractOutput {
  contractVersion: "ai-insight-v2";
  currentStateInsights: InsightItem[];
  maintenanceInsights: InsightItem[];
  optimizationInsights: InsightItem[];
  productRecommendations: ProductRecommendationItem[];
  savingsExplanation: SavingsExplanation;
  meta: {
    generatedAt: string;
    basedOnSource: "DASHBOARD_AGGREGATED_V1";
    severityEnum: ["low", "moderate", "high"];
    confidenceEnum: ["low", "moderate", "high"];
  };
}

export type AiInsightSuccessEnvelope = ApiSuccessEnvelope<AiInsightContractOutput>;
