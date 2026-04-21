import { Injectable } from "@nestjs/common";
import {
  IntelligenceAlert,
  IntelligenceInput,
  roundCurrency
} from "./intelligence.types";

@Injectable()
export class MaintenanceIntelligenceService {
  derive(data: IntelligenceInput): IntelligenceAlert[] {
    const alerts: IntelligenceAlert[] = [];

    if (data.soiling.cleaningRecommended) {
      const loss = data.soiling.estimatedLossPercent ?? 0;
      alerts.push({
        id: "maintenance.soiling",
        severity: loss > 8 ? "high" : "moderate",
        category: "maintenance",
        title: "Panel cleaning recommended",
        message: data.soiling.explanation,
        actionHint: data.soiling.recommendedCleaningDate
          ? `Suggested for ${data.soiling.recommendedCleaningDate}`
          : "Schedule a cleaning soon",
        moneyImpactIls: roundCurrency(data.optimization.estimatedValue)
      });
    }

    if ((data.heat.estimatedLossPercent ?? 0) > 5) {
      const loss = data.heat.estimatedLossPercent ?? 0;
      alerts.push({
        id: "maintenance.heat",
        severity: loss > 10 ? "high" : "moderate",
        category: "maintenance",
        title: "Heat is reducing output",
        message: `Panel heat is costing about ${loss.toFixed(1)}% between ${data.heat.peakHeatWindowStart}–${data.heat.peakHeatWindowEnd}.`,
        actionHint: "Shift heavy loads outside the peak heat window"
      });
    }

    const absDev = Math.abs(data.benchmark.productionDeviationPercent ?? 0);
    if (data.benchmark.performanceStatus === "underperforming" && absDev > 10) {
      alerts.push({
        id: "production.underperforming",
        severity: "high",
        category: "production",
        title: "System is underperforming",
        message: data.benchmark.insight,
        actionHint: "Check inverters, connections, and recent cleaning date"
      });
    }

    return alerts;
  }
}
