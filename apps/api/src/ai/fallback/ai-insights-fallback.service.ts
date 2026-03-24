import { Injectable } from "@nestjs/common";
import {
  Actionability,
  AiInsightContractInput,
  AiInsightContractOutput,
  AggregateSourceRef,
  BenefitRange,
  CANONICAL_SOURCE_REFS,
  Confidence,
  InsightItem,
  ProductRecommendationItem,
  Severity,
  SmartProductCatalogItem,
  TraceableReason
} from "../contracts/ai-insight-v2";

const MIN_MATCHED_RULES = 2;
const MIN_WEIGHTED_SCORE = 0.5;
const MAX_RECOMMENDATIONS = 2;

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 1,
  moderate: 2,
  high: 3
};

const BASE_FIELD_WEIGHTS: Record<AggregateSourceRef, number> = Object.fromEntries(
  CANONICAL_SOURCE_REFS.map((ref) => [ref, 1])
) as Record<AggregateSourceRef, number>;

const FIELD_WEIGHTS: Record<AggregateSourceRef, number> = {
  ...BASE_FIELD_WEIGHTS,
  "optimization.opportunityScore": 1.3,
  "optimization.estimatedValue": 1.3,
  "financial.monthlyEstimatedSavings": 1.2,
  "financial.yearlyOptimizationPotential": 1.2,
  "benchmark.exportDeviationPercent": 1.25,
  "benchmark.actualExportKwh": 1.25,
  "selfConsumption.selfConsumptionScore": 1.3,
  "heat.estimatedLossPercent": 1.15
};

interface ProductCandidate {
  item: SmartProductCatalogItem;
  matchedRuleFields: AggregateSourceRef[];
  matchedWeight: number;
  totalWeight: number;
  weightedScore: number;
  confidence: Confidence;
}

@Injectable()
export class AiInsightsFallbackService {
  generate(input: AiInsightContractInput): AiInsightContractOutput {
    const currentStateInsights = this.buildCurrentStateInsights(input);
    const maintenanceInsights = this.buildMaintenanceInsights(input);
    const optimizationInsights = this.buildOptimizationInsights(input);
    const productRecommendations = this.buildProductRecommendations(input);
    const savingsExplanation = this.buildSavingsExplanation(input, productRecommendations);

    return {
      contractVersion: "ai-insight-v2",
      currentStateInsights,
      maintenanceInsights,
      optimizationInsights,
      productRecommendations,
      savingsExplanation,
      meta: {
        generatedAt: new Date().toISOString(),
        basedOnSource: "DASHBOARD_AGGREGATED_V1",
        severityEnum: ["low", "moderate", "high"],
        confidenceEnum: ["low", "moderate", "high"]
      }
    };
  }

  private buildCurrentStateInsights(input: AiInsightContractInput): InsightItem[] {
    const insights: InsightItem[] = [];
    const { benchmark, financial, selfConsumption } = input.aggregate;

    insights.push({
      id: "current-state-financial-baseline",
      insightType: "behavior",
      title: "Current savings baseline",
      message: `Current deterministic baseline is ${financial.monthlyEstimatedSavings.toFixed(2)} ILS monthly (${financial.dailyEstimatedSavings.toFixed(2)} ILS daily).`,
      severity: "low",
      confidence: "high",
      actionability: "informational",
      reason: this.reason(
        "Daily and monthly savings baseline come directly from canonical financial output.",
        ["financial.dailyEstimatedSavings", "financial.monthlyEstimatedSavings"]
      ),
      requiresPurchase: false,
      expectedBenefitRangeIlsMonthly: this.benefit(
        financial.monthlyEstimatedSavings,
        financial.monthlyEstimatedSavings,
        ["financial.monthlyEstimatedSavings"]
      )
    });

    const exportSeverity: Severity = this.severityFromDeviation(
      Math.abs(benchmark.exportDeviationPercent)
    );
    insights.push({
      id: "current-state-export-gap",
      insightType: "behavior",
      title: "Export deviation context",
      message: `Export deviation is ${benchmark.exportDeviationPercent.toFixed(2)}% (actual ${benchmark.actualExportKwh.toFixed(2)} kWh vs expected ${benchmark.expectedExportKwh.toFixed(2)} kWh).`,
      severity: exportSeverity,
      confidence: "high",
      actionability: "immediate",
      reason: this.reason(
        "Export transparency is based on benchmark expected/actual export and deviation fields.",
        [
          "benchmark.exportDeviationPercent",
          "benchmark.actualExportKwh",
          "benchmark.expectedExportKwh"
        ]
      ),
      requiresPurchase: false
    });

    const productionSeverity: Severity = this.severityFromDeviation(
      Math.abs(benchmark.productionDeviationPercent)
    );
    insights.push({
      id: "current-state-production-gap",
      insightType: "behavior",
      title: "Production transparency",
      message: `Production deviation is ${benchmark.productionDeviationPercent.toFixed(2)}% with status "${benchmark.performanceStatus}".`,
      severity: productionSeverity,
      confidence: "high",
      actionability: "informational",
      reason: this.reason(
        "Production transparency is provided by benchmark production deviation and status.",
        [
          "benchmark.productionDeviationPercent",
          "benchmark.expectedProductionKwh",
          "benchmark.actualProductionKwh",
          "benchmark.performanceStatus",
          "benchmark.insight"
        ]
      ),
      requiresPurchase: false
    });

    insights.push({
      id: "current-state-self-consumption-window",
      insightType: "behavior",
      title: "Self-consumption behavior window",
      message: `Recommended usage window is ${selfConsumption.recommendedUsageWindow.start} - ${selfConsumption.recommendedUsageWindow.end}; current self-consumption score is ${selfConsumption.selfConsumptionScore.toFixed(2)}.`,
      severity: this.severityFromLowScore(selfConsumption.selfConsumptionScore),
      confidence: "high",
      actionability: "immediate",
      reason: this.reason(
        "Behavior transparency comes directly from self-consumption score, usage window, and actions.",
        [
          "selfConsumption.selfConsumptionScore",
          "selfConsumption.recommendedUsageWindow.start",
          "selfConsumption.recommendedUsageWindow.end",
          "selfConsumption.actions[]"
        ]
      ),
      requiresPurchase: false,
      expectedBenefitRangeIlsMonthly: this.benefit(
        selfConsumption.estimatedSavingsIls,
        selfConsumption.estimatedSavingsIls,
        ["selfConsumption.estimatedSavingsIls"]
      )
    });

    return insights;
  }

  private buildMaintenanceInsights(input: AiInsightContractInput): InsightItem[] {
    const insights: InsightItem[] = [];
    const { soiling, heat, risks } = input.aggregate;

    insights.push({
      id: "maintenance-soiling-signal",
      insightType: "maintenance",
      title: "Soiling maintenance signal",
      message: soiling.cleaningRecommended
        ? "Cleaning is recommended based on deterministic soiling signal."
        : "No immediate cleaning action is required from deterministic soiling signal.",
      severity: soiling.cleaningRecommended
        ? this.severityFromLossPercent(soiling.estimatedLossPercent)
        : "low",
      confidence: "high",
      actionability: "scheduled",
      reason: this.reason("Soiling output explicitly provides cleaning recommendation.", [
        "soiling.cleaningRecommended",
        "soiling.score",
        "soiling.estimatedLossPercent",
        "soiling.recommendedCleaningDate",
        "soiling.explanation"
      ]),
      requiresPurchase: false
    });

    insights.push({
      id: "maintenance-heat-window",
      insightType: "maintenance",
      title: "Heat maintenance window",
      message: `Heat loss signal is ${heat.estimatedLossPercent.toFixed(2)}% around ${heat.peakHeatWindowStart} - ${heat.peakHeatWindowEnd}.`,
      severity: this.severityFromLossPercent(heat.estimatedLossPercent),
      confidence: "high",
      actionability: "scheduled",
      reason: this.reason("Heat section provides deterministic loss and peak windows.", [
        "heat.estimatedLossPercent",
        "heat.peakHeatWindowStart",
        "heat.peakHeatWindowEnd",
        "heat.score"
      ]),
      requiresPurchase: false
    });

    if (risks.alerts.length > 0) {
      const topRisk = risks.alerts[0];
      insights.push({
        id: "maintenance-risk-alert-primary",
        insightType: "maintenance",
        title: "Primary maintenance alert",
        message: topRisk.message,
        severity: topRisk.severity,
        confidence: "moderate",
        actionability: "immediate",
        reason: this.reason("Risk alerts are deterministic outputs from the canonical aggregate.", [
          "risks.alerts[].riskType",
          "risks.alerts[].severity",
          "risks.alerts[].message",
          "risks.alerts[].expectedStart",
          "risks.alerts[].expectedEnd"
        ]),
        requiresPurchase: false
      });
    }

    return insights;
  }

  private buildOptimizationInsights(input: AiInsightContractInput): InsightItem[] {
    const insights: InsightItem[] = [];
    const { optimization, financial } = input.aggregate;

    insights.push({
      id: "optimization-opportunity-score",
      insightType: "behavior",
      title: "Optimization opportunity score",
      message: `Opportunity score is ${optimization.opportunityScore.toFixed(2)} / 100 with estimated value ${optimization.estimatedValue.toFixed(2)} ILS.`,
      severity: this.severityFromOpportunityScore(optimization.opportunityScore),
      confidence: "high",
      actionability: "immediate",
      reason: this.reason("Optimization section provides score and estimated value.", [
        "optimization.opportunityScore",
        "optimization.estimatedValue"
      ]),
      requiresPurchase: false,
      expectedBenefitRangeIlsMonthly: this.benefit(
        optimization.estimatedValue,
        optimization.estimatedValue,
        ["optimization.estimatedValue"]
      )
    });

    insights.push({
      id: "optimization-avoidable-loss-baseline",
      insightType: "behavior",
      title: "Avoidable loss transparency",
      message: `Yearly optimization potential is ${financial.yearlyOptimizationPotential.toFixed(2)} ILS based on current deterministic profile.`,
      severity: this.severityFromYearlyPotential(financial.yearlyOptimizationPotential),
      confidence: "high",
      actionability: "scheduled",
      reason: this.reason("Avoidable-loss context comes from canonical financial optimization potential.", [
        "financial.yearlyOptimizationPotential"
      ]),
      requiresPurchase: false,
      expectedBenefitRangeIlsMonthly: this.benefit(
        financial.monthlyEstimatedSavings,
        financial.monthlyEstimatedSavings,
        ["financial.monthlyEstimatedSavings"]
      )
    });

    for (const recommendation of optimization.recommendations.slice(0, 2)) {
      insights.push({
        id: `optimization-rec-${recommendation.id}`,
        insightType: "behavior",
        title: recommendation.title,
        message: recommendation.message,
        severity: recommendation.severity,
        confidence: "moderate",
        actionability: "immediate",
        reason: this.reason("Recommendation is part of canonical optimization output.", [
          "optimization.recommendations[].id",
          "optimization.recommendations[].title",
          "optimization.recommendations[].message",
          "optimization.recommendations[].severity",
          "optimization.recommendations[].estimatedValue",
          "optimization.recommendations[].sourceModule"
        ]),
        requiresPurchase: false,
        expectedBenefitRangeIlsMonthly: this.benefit(
          recommendation.estimatedValue,
          recommendation.estimatedValue,
          ["optimization.recommendations[].estimatedValue"]
        )
      });
    }

    return insights;
  }

  private buildProductRecommendations(
    input: AiInsightContractInput
  ): ProductRecommendationItem[] {
    const candidates = input.productCatalog
      .map((item) => this.evaluateProductCandidate(input, item))
      .filter((candidate): candidate is ProductCandidate => candidate !== null);

    const bestPerGroup = this.selectBestPerExpectedBenefitType(candidates);
    const selected = bestPerGroup
      .sort((left, right) => this.compareCandidates(right, left))
      .slice(0, MAX_RECOMMENDATIONS);

    return selected.map((candidate) => {
      const reason = this.reason(
        `Deterministic suitability matched weighted score ${candidate.weightedScore.toFixed(2)} for ${candidate.item.name}.`,
        candidate.matchedRuleFields
      );

      return {
        id: `product-${candidate.item.id}`,
        insightType: "product",
        severity: this.severityFromWeightedScore(candidate.weightedScore),
        confidence: candidate.confidence,
        actionability: "scheduled",
        productId: candidate.item.id,
        name: candidate.item.name,
        useCase: candidate.item.useCase,
        reason,
        whyRelevant: reason,
        expectedBenefitRangeIlsMonthly: this.productBenefitRange(input),
        requiresPurchase: true
      };
    });
  }

  private buildSavingsExplanation(
    input: AiInsightContractInput,
    productRecommendations: ProductRecommendationItem[]
  ): AiInsightContractOutput["savingsExplanation"] {
    return {
      withoutUpgrades: {
        summary:
          "Behavior-based savings opportunities from deterministic aggregate data, without purchasing new products.",
        items: [
          {
            id: "savings-without-upgrade-baseline",
            title: "Current monthly savings baseline",
            message: `Current monthly estimated savings is ${input.aggregate.financial.monthlyEstimatedSavings.toFixed(2)} ILS.`,
            severity: "low",
            confidence: "high",
            actionability: "informational",
            reason: this.reason("Baseline is provided directly by financial section.", [
              "financial.monthlyEstimatedSavings"
            ]),
            expectedBenefitRangeIlsMonthly: this.benefit(
              input.aggregate.financial.monthlyEstimatedSavings,
              input.aggregate.financial.monthlyEstimatedSavings,
              ["financial.monthlyEstimatedSavings"]
            )
          },
          {
            id: "savings-without-upgrade-self-consumption",
            title: "Self-consumption behavioral window",
            message: `Use the recommended window ${input.aggregate.selfConsumption.recommendedUsageWindow.start} - ${input.aggregate.selfConsumption.recommendedUsageWindow.end} to improve savings behaviorally.`,
            severity: "moderate",
            confidence: "moderate",
            actionability: "immediate",
            reason: this.reason("Window and self-consumption score come from canonical selfConsumption output.", [
              "selfConsumption.recommendedUsageWindow.start",
              "selfConsumption.recommendedUsageWindow.end",
              "selfConsumption.selfConsumptionScore",
              "selfConsumption.actions[]"
            ]),
            expectedBenefitRangeIlsMonthly: this.benefit(
              input.aggregate.selfConsumption.estimatedSavingsIls,
              input.aggregate.selfConsumption.estimatedSavingsIls,
              ["selfConsumption.estimatedSavingsIls"]
            )
          }
        ]
      },
      withUpgrades: {
        summary:
          "Additional savings opportunities when adopting smart products that match deterministic site signals.",
        items: productRecommendations.map((item) => ({
          id: `savings-with-upgrade-${item.productId}`,
          title: item.name,
          message: item.useCase,
          severity: item.severity,
          confidence: item.confidence,
          actionability: item.actionability,
          reason: item.whyRelevant,
          expectedBenefitRangeIlsMonthly: item.expectedBenefitRangeIlsMonthly
        }))
      }
    };
  }

  private reason(text: string, sourceRefs: AggregateSourceRef[]): TraceableReason {
    return { text, sourceRefs };
  }

  private benefit(min: number, max: number, basedOn: AggregateSourceRef[]): BenefitRange {
    return {
      min,
      max,
      basedOn
    };
  }

  private evaluateProductCandidate(
    input: AiInsightContractInput,
    item: SmartProductCatalogItem
  ): ProductCandidate | null {
    const matchedRuleFields: AggregateSourceRef[] = [];
    let matchedCount = 0;
    let notMatchedCount = 0;
    let unresolvedCount = 0;
    let matchedWeight = 0;
    let totalWeight = 0;

    for (const rule of item.suitableWhen) {
      const ruleWeight = FIELD_WEIGHTS[rule.field] ?? 1;
      totalWeight += ruleWeight;
      const value = this.getValueByRef(input, rule.field);

      if (value === undefined || value === null) {
        unresolvedCount += 1;
        continue;
      }

      let matched = false;
      if (rule.operator === "=") {
        matched = value === rule.value;
      } else if (typeof value === "number" && typeof rule.value === "number") {
        matched = rule.operator === ">" ? value > rule.value : value < rule.value;
      }

      if (!matched && rule.operator !== "=" && (typeof value !== "number" || typeof rule.value !== "number")) {
        unresolvedCount += 1;
        continue;
      }

      if (matched) {
        matchedCount += 1;
        matchedWeight += ruleWeight;
        matchedRuleFields.push(rule.field);
      } else {
        notMatchedCount += 1;
      }
    }

    if (notMatchedCount > 0) {
      return null;
    }
    if (matchedCount < MIN_MATCHED_RULES) {
      return null;
    }
    if (totalWeight <= 0) {
      return null;
    }

    const weightedScore = matchedWeight / totalWeight;
    if (weightedScore < MIN_WEIGHTED_SCORE) {
      return null;
    }

    return {
      item,
      matchedRuleFields,
      matchedWeight,
      totalWeight,
      weightedScore,
      confidence: this.confidenceFromCoverage(weightedScore, unresolvedCount)
    };
  }

  private selectBestPerExpectedBenefitType(candidates: ProductCandidate[]): ProductCandidate[] {
    const grouped = new Map<SmartProductCatalogItem["expectedBenefitType"], ProductCandidate>();
    for (const candidate of candidates) {
      const existing = grouped.get(candidate.item.expectedBenefitType);
      if (!existing || this.compareCandidates(candidate, existing) > 0) {
        grouped.set(candidate.item.expectedBenefitType, candidate);
      }
    }
    return Array.from(grouped.values());
  }

  private compareCandidates(left: ProductCandidate, right: ProductCandidate): number {
    if (left.weightedScore !== right.weightedScore) {
      return left.weightedScore - right.weightedScore;
    }
    if (CONFIDENCE_RANK[left.confidence] !== CONFIDENCE_RANK[right.confidence]) {
      return CONFIDENCE_RANK[left.confidence] - CONFIDENCE_RANK[right.confidence];
    }
    return left.matchedWeight - right.matchedWeight;
  }

  private confidenceFromCoverage(weightedScore: number, unresolvedCount: number): Confidence {
    if (unresolvedCount > 1) {
      return "low";
    }
    if (weightedScore >= 0.85 && unresolvedCount === 0) {
      return "high";
    }
    if (weightedScore >= 0.65) {
      return "moderate";
    }
    return "low";
  }

  private severityFromWeightedScore(weightedScore: number): Severity {
    if (weightedScore >= 0.85) {
      return "high";
    }
    if (weightedScore >= 0.65) {
      return "moderate";
    }
    return "low";
  }

  private productBenefitRange(input: AiInsightContractInput): BenefitRange {
    const optimizationValue = Math.max(0, input.aggregate.optimization.estimatedValue);
    const cap = Math.max(0, input.aggregate.financial.monthlyEstimatedSavings);
    const min = Math.min(cap, optimizationValue * 0.1);
    const max = Math.min(cap, optimizationValue * 0.3);

    return {
      min,
      max: Math.max(min, max),
      basedOn: ["optimization.estimatedValue", "financial.monthlyEstimatedSavings"]
    };
  }

  private getValueByRef(input: AiInsightContractInput, ref: AggregateSourceRef): unknown {
    const pathMap: Partial<Record<AggregateSourceRef, unknown>> = {
      "optimization.opportunityScore": input.aggregate.optimization.opportunityScore,
      "optimization.estimatedValue": input.aggregate.optimization.estimatedValue,
      "benchmark.exportDeviationPercent": input.aggregate.benchmark.exportDeviationPercent,
      "benchmark.expectedExportKwh": input.aggregate.benchmark.expectedExportKwh,
      "benchmark.actualExportKwh": input.aggregate.benchmark.actualExportKwh,
      "selfConsumption.selfConsumptionScore": input.aggregate.selfConsumption.selfConsumptionScore,
      "heat.estimatedLossPercent": input.aggregate.heat.estimatedLossPercent
    };

    return pathMap[ref];
  }

  private severityFromDeviation(absDeviationPercent: number): Severity {
    if (absDeviationPercent >= 20) {
      return "high";
    }
    if (absDeviationPercent >= 10) {
      return "moderate";
    }
    return "low";
  }

  private severityFromLossPercent(lossPercent: number): Severity {
    if (lossPercent >= 8) {
      return "high";
    }
    if (lossPercent >= 4) {
      return "moderate";
    }
    return "low";
  }

  private severityFromOpportunityScore(opportunityScore: number): Severity {
    if (opportunityScore >= 70) {
      return "high";
    }
    if (opportunityScore >= 40) {
      return "moderate";
    }
    return "low";
  }

  private severityFromLowScore(score: number): Severity {
    if (score < 50) {
      return "high";
    }
    if (score < 75) {
      return "moderate";
    }
    return "low";
  }

  private severityFromYearlyPotential(valueIls: number): Severity {
    if (valueIls >= 2000) {
      return "high";
    }
    if (valueIls >= 800) {
      return "moderate";
    }
    return "low";
  }
}
