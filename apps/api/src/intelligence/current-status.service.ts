import { Injectable } from "@nestjs/common";
import {
  IntelligenceInput,
  IntelligenceStatusBlock,
  roundCurrency
} from "./intelligence.types";

@Injectable()
export class CurrentStatusService {
  derive(data: IntelligenceInput): IntelligenceStatusBlock {
    const devPercent = data.benchmark.productionDeviationPercent;
    const absDev = Math.abs(devPercent);
    const cleaningRec = data.soiling.cleaningRecommended;
    const soilingLoss = data.soiling.estimatedLossPercent;
    const heatLoss = data.heat.estimatedLossPercent;
    const highRisk = data.risks.alerts.find((alert) => alert.severity === "high");

    if (absDev > 15 || highRisk) {
      const cause = highRisk
        ? highRisk.message
        : devPercent < 0
          ? `Production is ${absDev.toFixed(1)}% below expected.`
          : `Production is ${absDev.toFixed(1)}% above expected.`;

      return {
        level: "critical",
        statusLabel: "Action Required",
        headline: "Significant issue detected",
        primaryCause: cause,
        moneyImpactIls: roundCurrency(data.financial.monthlyEstimatedSavings * (absDev / 100)),
        moneyPeriod: "monthly",
        cta: { label: "Review Optimization", type: "optimization" }
      };
    }

    if (cleaningRec || absDev > 5 || soilingLoss > 5 || heatLoss > 5) {
      const cause = cleaningRec
        ? "Dust accumulation is likely reducing output."
        : soilingLoss > 5
          ? `Soiling is costing about ${soilingLoss.toFixed(1)}%.`
          : heatLoss > 5
            ? `Panel heat is costing about ${heatLoss.toFixed(1)}%.`
            : `Production is drifting by ${absDev.toFixed(1)}%.`;

      return {
        level: "warning",
        statusLabel: "Attention Needed",
        headline: cleaningRec
          ? "Panel cleaning will restore output"
          : "Minor performance drift detected",
        primaryCause: cause,
        moneyImpactIls: roundCurrency(data.optimization.estimatedValue),
        moneyPeriod: "recoverable",
        cta: {
          label: cleaningRec ? "Schedule Cleaning" : "Review Optimization",
          type: cleaningRec ? "cleaning" : "optimization"
        }
      };
    }

    return {
      level: "good",
      statusLabel: "On Track",
      headline: "Your system is performing well",
      primaryCause: data.benchmark.insight,
      moneyImpactIls: roundCurrency(data.financial.monthlyEstimatedSavings),
      moneyPeriod: "monthly",
      cta: { label: "View Details", type: "monitoring" }
    };
  }
}
