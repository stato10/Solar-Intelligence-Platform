import { Injectable } from "@nestjs/common";
import {
  IntelligenceInput,
  IntelligenceProfitBlock,
  roundCurrency
} from "./intelligence.types";

@Injectable()
export class ProfitLossService {
  derive(data: IntelligenceInput): IntelligenceProfitBlock {
    const daily = data.financial.dailyEstimatedSavings;
    const monthly = data.financial.monthlyEstimatedSavings;
    const yearly = data.financial.yearlyOptimizationPotential;

    // "Leakage" = money lost monthly because soiling + heat are suppressing output.
    // Extrapolate the expected ideal monthly value given current loss factors, then
    // subtract the observed monthly savings.
    const totalLossPercent = Math.max(
      0,
      (data.soiling.estimatedLossPercent ?? 0) + (data.heat.estimatedLossPercent ?? 0)
    );
    const lossFactor = Math.min(0.99, totalLossPercent / 100);
    const monthlyIdeal = lossFactor > 0 && monthly > 0 ? monthly / (1 - lossFactor) : monthly;
    const leakage = Math.max(0, monthlyIdeal - monthly);

    // Split of daily savings between export value and direct self-consumption value.
    const selfConsumptionValue = Math.max(0, data.selfConsumption.estimatedSavingsIls);
    const exportValue = Math.max(0, daily - selfConsumptionValue);

    const headroom = Math.max(0, data.optimization.estimatedValue);
    const optimal = monthly + headroom;

    return {
      dailySavingsIls: roundCurrency(daily),
      monthlySavingsIls: roundCurrency(monthly),
      yearlySavingsIls: roundCurrency(yearly),
      maintenanceLeakageMonthlyIls: roundCurrency(leakage),
      exportValueDailyIls: roundCurrency(exportValue),
      selfConsumptionValueDailyIls: roundCurrency(selfConsumptionValue),
      currentMonthlyIls: roundCurrency(monthly),
      optimalMonthlyIls: roundCurrency(optimal),
      headroomMonthlyIls: roundCurrency(headroom)
    };
  }
}
