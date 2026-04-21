import { Injectable } from "@nestjs/common";
import { CalculationMode, SystemTariff } from "./calculation-mode";

export interface LossEvaluationInput {
  mode: CalculationMode;
  expectedKwh: number;
  actualKwh: number; // For "estimated" mode, this is the pseudo-actual KWH
  selfConsumptionRatio: number;
  tariff: SystemTariff;
  factors: {
    radiation: number;
    cloud: number;
    temperature: number;
    dust: number;
    soiling: number;
  };
  hasHistoricalData: boolean;
}

export interface LossBreakdown {
  mode: CalculationMode;
  totalLossKwh: number;
  totalMoneyLossIls: number;
  selfConsumptionLossIls: number;
  exportLossIls: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  causes: {
    dust?: number;
    temperature?: number;
    clouds?: number;
  };
}

@Injectable()
export class LossEngine {
  calculateLoss(input: LossEvaluationInput): LossBreakdown | null {
    // Forecast mode has no actual production (not even estimated), so loss is 0 conceptually.
    // Potential risks are handled by Recommendation engine instead.
    if (!input.actualKwh || input.mode === "forecast") {
      return null;
    }

    const lossKwh = Math.max(0, input.expectedKwh - input.actualKwh);

    // Dual-Tariff Financial Splitting
    const selfUseLossKwh = lossKwh * input.selfConsumptionRatio;
    const exportLossKwh = lossKwh * (1 - input.selfConsumptionRatio);

    const selfConsumptionLossIls = selfUseLossKwh * input.tariff.importRate;
    const exportLossIls = exportLossKwh * input.tariff.exportRate;
    const totalMoneyLossIls = selfConsumptionLossIls + exportLossIls;

    // Confidence Score Calculation
    let score = 0;
    if (input.factors.radiation > 0) score += 0.3;
    if (input.factors.temperature > 0) score += 0.2;
    if (input.factors.cloud > 0) score += 0.3;
    if (input.hasHistoricalData) score += 0.2;

    // Force score to 1 if real hardware integration exists
    if (input.mode === "real") {
      score = 1.0;
    }

    let confidence: "low" | "medium" | "high" = "low";
    if (score > 0.8) confidence = "high";
    else if (score > 0.5) confidence = "medium";

    // Root Cause Analysis (attributing KWH loss proportionally to the degradation factors)
    // The sum of degradations (1 - factor) gives us relative weights.
    const degCloud = 1 - input.factors.cloud;
    const degTemp = 1 - input.factors.temperature;
    const degDust = 1 - input.factors.dust;
    const degSoil = 1 - input.factors.soiling;

    const totalDegradation = degCloud + degTemp + degDust + degSoil;
    
    const causes: LossBreakdown["causes"] = {};
    if (totalDegradation > 0 && lossKwh > 0) {
      causes.clouds = (degCloud / totalDegradation) * lossKwh;
      causes.temperature = (degTemp / totalDegradation) * lossKwh;
      causes.dust = ((degDust + degSoil) / totalDegradation) * lossKwh;
    }

    return {
      mode: input.mode,
      totalLossKwh: lossKwh,
      totalMoneyLossIls: Math.round(totalMoneyLossIls * 100) / 100,
      selfConsumptionLossIls: Math.round(selfConsumptionLossIls * 100) / 100,
      exportLossIls: Math.round(exportLossIls * 100) / 100,
      confidence,
      confidenceScore: score,
      causes,
    };
  }
}
