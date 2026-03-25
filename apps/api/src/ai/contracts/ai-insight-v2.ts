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

export const CANONICAL_SOURCE_REFS: AggregateSourceRef[] = [
  "soiling.score",
  "soiling.estimatedLossPercent",
  "soiling.cleaningRecommended",
  "soiling.recommendedCleaningDate",
  "soiling.explanation",
  "heat.score",
  "heat.estimatedLossPercent",
  "heat.peakHeatWindowStart",
  "heat.peakHeatWindowEnd",
  "risks.alerts[].riskType",
  "risks.alerts[].severity",
  "risks.alerts[].message",
  "risks.alerts[].expectedStart",
  "risks.alerts[].expectedEnd",
  "optimization.opportunityScore",
  "optimization.estimatedValue",
  "optimization.recommendations[].id",
  "optimization.recommendations[].type",
  "optimization.recommendations[].title",
  "optimization.recommendations[].message",
  "optimization.recommendations[].severity",
  "optimization.recommendations[].priority",
  "optimization.recommendations[].estimatedValue",
  "optimization.recommendations[].validFrom",
  "optimization.recommendations[].validUntil",
  "optimization.recommendations[].sourceModule",
  "financial.dailyEstimatedSavings",
  "financial.monthlyEstimatedSavings",
  "financial.yearlyOptimizationPotential",
  "benchmark.expectedProductionKwh",
  "benchmark.actualProductionKwh",
  "benchmark.expectedExportKwh",
  "benchmark.actualExportKwh",
  "benchmark.productionDeviationPercent",
  "benchmark.exportDeviationPercent",
  "benchmark.performanceStatus",
  "benchmark.insight",
  "selfConsumption.recommendedUsageWindow.start",
  "selfConsumption.recommendedUsageWindow.end",
  "selfConsumption.selfConsumptionScore",
  "selfConsumption.estimatedSavingsIls",
  "selfConsumption.actions[]",
  "siteId",
  "generatedAt",
  "source",
  "providers.weather",
  "providers.solar",
  "providers.engine"
];

export interface CanonicalAggregateAiSource {
  siteId: string;
  generatedAt: string;
  source: "DASHBOARD_AGGREGATED_V1";
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
  providers: {
    weather: string;
    solar: string;
    engine: string;
  };
}

function isSeverity(value: unknown): value is Severity {
  return value === "low" || value === "moderate" || value === "high";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isCanonicalAggregateAiSource(value: unknown): value is CanonicalAggregateAiSource {
  if (!isRecord(value)) return false;
  if (!isString(value.siteId) || !isString(value.generatedAt) || value.source !== "DASHBOARD_AGGREGATED_V1") {
    return false;
  }

  if (!isRecord(value.soiling) || !isRecord(value.heat) || !isRecord(value.risks) || !isRecord(value.optimization)) {
    return false;
  }
  if (!isRecord(value.financial) || !isRecord(value.benchmark) || !isRecord(value.selfConsumption) || !isRecord(value.providers)) {
    return false;
  }

  const soiling = value.soiling;
  if (!isNumber(soiling.score) || !isNumber(soiling.estimatedLossPercent) || typeof soiling.cleaningRecommended !== "boolean") {
    return false;
  }
  if (!(soiling.recommendedCleaningDate === null || isString(soiling.recommendedCleaningDate)) || !isString(soiling.explanation)) {
    return false;
  }

  const heat = value.heat;
  if (!isNumber(heat.score) || !isNumber(heat.estimatedLossPercent) || !isString(heat.peakHeatWindowStart) || !isString(heat.peakHeatWindowEnd)) {
    return false;
  }

  const risks = value.risks;
  if (!Array.isArray(risks.alerts)) return false;
  if (!risks.alerts.every((alert) => {
    if (!isRecord(alert)) return false;
    return isString(alert.riskType) && isSeverity(alert.severity) && isString(alert.message) && isString(alert.expectedStart) && isString(alert.expectedEnd);
  })) return false;

  const optimization = value.optimization;
  if (!isNumber(optimization.opportunityScore) || !isNumber(optimization.estimatedValue) || !Array.isArray(optimization.recommendations)) {
    return false;
  }
  if (!optimization.recommendations.every((rec) => {
    if (!isRecord(rec)) return false;
    return (
      isString(rec.id) &&
      isString(rec.type) &&
      isString(rec.title) &&
      isString(rec.message) &&
      isSeverity(rec.severity) &&
      isNumber(rec.priority) &&
      isNumber(rec.estimatedValue) &&
      isString(rec.validFrom) &&
      isString(rec.validUntil) &&
      isString(rec.sourceModule)
    );
  })) return false;

  const financial = value.financial;
  if (!isNumber(financial.dailyEstimatedSavings) || !isNumber(financial.monthlyEstimatedSavings) || !isNumber(financial.yearlyOptimizationPotential)) {
    return false;
  }

  const benchmark = value.benchmark;
  if (
    !isNumber(benchmark.expectedProductionKwh) ||
    !isNumber(benchmark.actualProductionKwh) ||
    !isNumber(benchmark.expectedExportKwh) ||
    !isNumber(benchmark.actualExportKwh) ||
    !isNumber(benchmark.productionDeviationPercent) ||
    !isNumber(benchmark.exportDeviationPercent) ||
    !isString(benchmark.insight) ||
    !["good", "underperforming", "overexporting"].includes(String(benchmark.performanceStatus))
  ) {
    return false;
  }

  const selfConsumption = value.selfConsumption;
  if (!isRecord(selfConsumption.recommendedUsageWindow) || !isNumber(selfConsumption.selfConsumptionScore) || !isNumber(selfConsumption.estimatedSavingsIls)) {
    return false;
  }
  if (!isString(selfConsumption.recommendedUsageWindow.start) || !isString(selfConsumption.recommendedUsageWindow.end) || !Array.isArray(selfConsumption.actions)) {
    return false;
  }
  if (!selfConsumption.actions.every((item) => isString(item))) return false;

  const providers = value.providers;
  return isString(providers.weather) && isString(providers.solar) && isString(providers.engine);
}

// ---------------------------------------------------------------------------
// Output validator (Change A — task 7.8)
// Validates that the value produced by the fallback or any future OpenAI
// provider fully satisfies AiInsightContractOutput before it is returned.
// Rules: shape-only, no semantic checks, no arithmetic, lightweight.
// ---------------------------------------------------------------------------

const VALID_INSIGHT_TYPES: InsightType[] = ["behavior", "maintenance", "product"];
const VALID_ACTIONABILITY: Actionability[] = ["immediate", "scheduled", "informational"];
const CANONICAL_SOURCE_REF_SET = new Set<string>(CANONICAL_SOURCE_REFS);

function isInsightType(value: unknown): value is InsightType {
  return VALID_INSIGHT_TYPES.includes(value as InsightType);
}

function isActionability(value: unknown): value is Actionability {
  return VALID_ACTIONABILITY.includes(value as Actionability);
}

function isConfidence(value: unknown): value is Confidence {
  return value === "low" || value === "moderate" || value === "high";
}

function isValidSourceRef(value: unknown): boolean {
  return isString(value) && CANONICAL_SOURCE_REF_SET.has(value);
}

function isValidTraceableReason(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isString(value.text)) return false;
  if (!Array.isArray(value.sourceRefs)) return false;
  return value.sourceRefs.every(isValidSourceRef);
}

function isValidBenefitRange(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isNumber(value.min) || !isNumber(value.max)) return false;
  if (!Array.isArray(value.basedOn)) return false;
  return value.basedOn.every(isValidSourceRef);
}

function isValidInsightItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || !isString(value.title) || !isString(value.message)) return false;
  if (!isInsightType(value.insightType)) return false;
  // Change C — enforce severity and confidence enums
  if (!isSeverity(value.severity)) return false;
  if (!isConfidence(value.confidence)) return false;
  if (!isActionability(value.actionability)) return false;
  if (!isValidTraceableReason(value.reason)) return false;
  if (typeof value.requiresPurchase !== "boolean") return false;
  if (value.expectedBenefitRangeIlsMonthly !== undefined && !isValidBenefitRange(value.expectedBenefitRangeIlsMonthly)) {
    return false;
  }
  return true;
}

function isValidProductRecommendationItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || !isString(value.productId) || !isString(value.name) || !isString(value.useCase)) return false;
  if (value.insightType !== "product") return false;
  if (!isSeverity(value.severity)) return false;
  if (!isConfidence(value.confidence)) return false;
  if (!isActionability(value.actionability)) return false;
  if (!isValidTraceableReason(value.reason)) return false;
  if (!isValidTraceableReason(value.whyRelevant)) return false;
  if (!isValidBenefitRange(value.expectedBenefitRangeIlsMonthly)) return false;
  if (value.requiresPurchase !== true) return false;
  return true;
}

function isValidSavingsSection(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isString(value.summary)) return false;
  if (!Array.isArray(value.items)) return false;
  return value.items.every((item) => {
    if (!isRecord(item)) return false;
    if (!isString(item.id) || !isString(item.title) || !isString(item.message)) return false;
    if (!isSeverity(item.severity)) return false;
    if (!isConfidence(item.confidence)) return false;
    if (!isActionability(item.actionability)) return false;
    if (!isValidTraceableReason(item.reason)) return false;
    if (item.expectedBenefitRangeIlsMonthly !== undefined && !isValidBenefitRange(item.expectedBenefitRangeIlsMonthly)) {
      return false;
    }
    return true;
  });
}

/**
 * Runtime output validator for AiInsightContractOutput (task 7.8 — Change A+C).
 *
 * Called by AiService after any insight generator (fallback or future OpenAI)
 * produces a result. Returns false if the output is malformed so that the
 * service can throw InternalServerErrorException rather than propagate bad data.
 *
 * Validates:
 * - contractVersion literal
 * - all four insight section arrays and each item's required fields
 * - severity + confidence enum membership (guardrail enforcement)
 * - reason.sourceRefs membership in CANONICAL_SOURCE_REFS
 * - savingsExplanation section structure
 * - meta required fields
 */
export function isValidAiInsightOutput(value: unknown): value is AiInsightContractOutput {
  if (!isRecord(value)) return false;

  if (value.contractVersion !== "ai-insight-v2") return false;

  if (!Array.isArray(value.currentStateInsights) || !value.currentStateInsights.every(isValidInsightItem)) return false;
  if (!Array.isArray(value.maintenanceInsights) || !value.maintenanceInsights.every(isValidInsightItem)) return false;
  if (!Array.isArray(value.optimizationInsights) || !value.optimizationInsights.every(isValidInsightItem)) return false;
  if (!Array.isArray(value.productRecommendations) || !value.productRecommendations.every(isValidProductRecommendationItem)) return false;

  if (!isRecord(value.savingsExplanation)) return false;
  if (!isValidSavingsSection(value.savingsExplanation.withoutUpgrades)) return false;
  if (!isValidSavingsSection(value.savingsExplanation.withUpgrades)) return false;

  if (!isRecord(value.meta)) return false;
  if (!isString(value.meta.generatedAt)) return false;
  if (value.meta.basedOnSource !== "DASHBOARD_AGGREGATED_V1") return false;
  // Validate the declared meta enum arrays match the contract literal tuples.
  const sev = value.meta.severityEnum;
  if (!Array.isArray(sev) || sev[0] !== "low" || sev[1] !== "moderate" || sev[2] !== "high" || sev.length !== 3) return false;
  const conf = value.meta.confidenceEnum;
  if (!Array.isArray(conf) || conf[0] !== "low" || conf[1] !== "moderate" || conf[2] !== "high" || conf.length !== 3) return false;

  return true;
}
