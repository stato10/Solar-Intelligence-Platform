import { Injectable } from "@nestjs/common";
import { LossBreakdown } from "./loss.engine";
import { SimulationResult } from "./financial.engine";

export interface EngineRecommendation {
  id: string;
  type: "cleaning" | "hardware" | "automation" | "monitoring";
  title: string;
  message: string;
  impactIls: number;
  confidence: "low" | "medium" | "high";
  actionMode: "simulate" | "execute";
}

@Injectable()
export class RecommendationEngine {
  generateRecommendations(
    loss: LossBreakdown | null, 
    financialImpact: SimulationResult | null,
    selfConsumptionScore: number
  ): EngineRecommendation[] {
    const recommendations: EngineRecommendation[] = [];

    // Rule 1: High Soiling/Dust Loss -> Cleaning Recommendation
    if (loss && loss.causes.dust && loss.causes.dust > 5) {
      recommendations.push({
        id: "rec-cleaning-01",
        type: "cleaning",
        title: "Clean Panels Now",
        message: "High dust accumulation is suppressing production.",
        impactIls: loss.causes.dust * 0.6, // rough estimate based on tariff
        confidence: loss.confidence,
        actionMode: "execute"
      });
    }

    // Rule 2: Low Self Consumption -> Battery/Automation Recommendation
    if (selfConsumptionScore < 70) {
      recommendations.push({
        id: "rec-automation-01",
        type: "automation",
        title: "Shift Heavy Loads",
        message: "You are exporting too much power. Shift loads to peak solar hours.",
        impactIls: financialImpact ? financialImpact.deltaMonthlyIls : 0,
        confidence: "medium",
        actionMode: "simulate"
      });
    }

    // Rule 3: Missing system metrics -> Hardware Integration recommendation
    if (!loss || loss.mode === "forecast") {
      recommendations.push({
        id: "rec-monitor-01",
        type: "monitoring",
        title: "Connect Inverter API",
        message: "Connect your SolarEdge or Enphase system to get real-time loss tracking.",
        impactIls: 0,
        confidence: "high",
        actionMode: "execute"
      });
    }

    return recommendations;
  }
}
