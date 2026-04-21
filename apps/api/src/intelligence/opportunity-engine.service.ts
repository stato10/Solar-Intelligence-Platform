import { Injectable } from "@nestjs/common";
import {
  IntelligenceConfidence,
  IntelligenceInput,
  IntelligenceOpportunity,
  IntelligenceOpportunityType,
  IntelligenceSeverity,
  roundCurrency
} from "./intelligence.types";

@Injectable()
export class OpportunityEngineService {
  derive(data: IntelligenceInput): IntelligenceOpportunity[] {
    const opportunities: IntelligenceOpportunity[] = [];

    for (const rec of data.optimization.recommendations) {
      opportunities.push({
        id: rec.id,
        type: this.classifyType(rec.type, rec.sourceModule),
        title: rec.title,
        description: rec.message,
        estimatedValueIls: roundCurrency(rec.estimatedValue),
        confidence: this.severityToConfidence(rec.severity),
        priority: rec.priority
      });
    }

    if (data.selfConsumption.selfConsumptionScore < 60) {
      opportunities.push({
        id: `opp.automation.${data.siteId}`,
        type: "automation",
        title: "Automate to use more self-generated energy",
        description: `Self-consumption is ${Math.round(data.selfConsumption.selfConsumptionScore)}. Shifting usage into the ${data.selfConsumption.recommendedUsageWindow.start}–${data.selfConsumption.recommendedUsageWindow.end} window raises savings.`,
        estimatedValueIls: roundCurrency(data.selfConsumption.estimatedSavingsIls * 30),
        confidence: "medium",
        priority: 3
      });
    }

    if (
      data.benchmark.actualExportKwh > 3 &&
      data.benchmark.exportDeviationPercent < -15
    ) {
      opportunities.push({
        id: `opp.battery.${data.siteId}`,
        type: "battery",
        title: "A battery could recover exported energy",
        description:
          "You are exporting energy that could be stored and used later at a higher self-consumption rate.",
        estimatedValueIls: roundCurrency(data.financial.yearlyOptimizationPotential * 0.4),
        confidence: "low",
        priority: 4
      });
    }

    return opportunities.sort((a, b) => a.priority - b.priority);
  }

  private classifyType(type: string, sourceModule: string): IntelligenceOpportunityType {
    const signal = `${type} ${sourceModule}`.toLowerCase();
    if (signal.includes("clean") || signal.includes("soil")) return "cleaning";
    if (signal.includes("battery") || signal.includes("storage")) return "battery";
    if (signal.includes("ev") || signal.includes("vehicle")) return "ev";
    return "automation";
  }

  private severityToConfidence(severity: IntelligenceSeverity): IntelligenceConfidence {
    if (severity === "high") return "high";
    if (severity === "moderate") return "medium";
    return "low";
  }
}
