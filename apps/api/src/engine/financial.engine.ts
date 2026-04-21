import { Injectable } from "@nestjs/common";

export interface SimulationParams {
  cleaning: boolean;
  battery: boolean;
  automation: boolean;
}

export interface SimulationResult {
  currentMonthlyIls: number;
  afterMonthlyIls: number;
  deltaMonthlyIls: number;
  roiYears: number | null;
  actions: string[];
}

@Injectable()
export class FinancialEngine {
  /**
   * Multi-Scenario Engine to calculate "What-If" scenarios.
   * Compares the current baseline against a projected future.
   */
  simulate(
    currentMonthlyIls: number, 
    maintenanceLeakageMonthlyIls: number, 
    yearlyBasePotentialIls: number,
    params: SimulationParams
  ): SimulationResult {
    let afterMonthlyIls = currentMonthlyIls;
    let hardwareCostEstimate = 0;
    const actionsTaken: string[] = [];

    // Scenario 1: Cleaning Panels recovers the maintenance leakage
    if (params.cleaning) {
      afterMonthlyIls += maintenanceLeakageMonthlyIls;
      hardwareCostEstimate += 400; // Average cost of manual cleaning
      actionsTaken.push("Cleaned Panels");
    }

    // Scenario 2: Adding a Battery recovers exported energy
    if (params.battery) {
      // Assuming a 5kWh battery recovers ~30% of yearly optimization potential over 12 months
      const batteryGainMonthly = (yearlyBasePotentialIls * 0.3) / 12;
      afterMonthlyIls += batteryGainMonthly;
      hardwareCostEstimate += 15000; // Average cost of a 5kWh home battery
      actionsTaken.push("Installed 5kWh Battery");
    }

    // Scenario 3: Smart Home Automation shifts energy to peak hours
    if (params.automation) {
      // Assuming shifting loads recovers ~15% of yearly optimization potential over 12 months
      const automationGainMonthly = (yearlyBasePotentialIls * 0.15) / 12;
      afterMonthlyIls += automationGainMonthly;
      hardwareCostEstimate += 1200; // Average cost for smart switches / meter
      actionsTaken.push("Automated Home Appliances");
    }

    const deltaMonthlyIls = afterMonthlyIls - currentMonthlyIls;
    
    // ROI calculation: Hardware cost / Action Gain Yearly
    let roiYears: number | null = null;
    if (deltaMonthlyIls > 0) {
      const yearlyGain = deltaMonthlyIls * 12;
      roiYears = Math.round((hardwareCostEstimate / yearlyGain) * 10) / 10;
    }

    return {
      currentMonthlyIls: Math.round(currentMonthlyIls),
      afterMonthlyIls: Math.round(afterMonthlyIls),
      deltaMonthlyIls: Math.round(deltaMonthlyIls),
      roiYears,
      actions: actionsTaken
    };
  }
}
