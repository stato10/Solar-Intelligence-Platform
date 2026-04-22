import { Injectable, Logger } from "@nestjs/common";
import { CurrentStatusService } from "./current-status.service";
import {
  DashboardIntelligence,
  IntelligenceAlert,
  IntelligenceInput,
  IntelligenceSeverity
} from "./intelligence.types";
import { MaintenanceIntelligenceService } from "./maintenance-intelligence.service";
import { OpportunityEngineService } from "./opportunity-engine.service";
import { ProfitLossService } from "./profit-loss.service";
import { WeatherRiskService } from "./weather-risk.service";
import { EstimatedProductionEngine } from "../engine/estimated-production.engine";
import { LossEngine } from "../engine/loss.engine";
import { FinancialEngine } from "../engine/financial.engine";
import { RecommendationEngine } from "../engine/recommendation.engine";
import { CalculationMode } from "../engine/calculation-mode";

const SEVERITY_ORDER: Record<IntelligenceSeverity, number> = {
  high: 0,
  moderate: 1,
  low: 2
};

@Injectable()
export class IntelligenceEvaluatorService {
  private readonly logger = new Logger(IntelligenceEvaluatorService.name);

  constructor(
    private readonly currentStatus: CurrentStatusService,
    private readonly profitLoss: ProfitLossService,
    private readonly maintenance: MaintenanceIntelligenceService,
    private readonly weather: WeatherRiskService,
    private readonly opportunities: OpportunityEngineService,
    private readonly estimatedProductionEngine: EstimatedProductionEngine,
    private readonly lossEngine: LossEngine,
    private readonly financialEngine: FinancialEngine,
    private readonly recommendationEngine: RecommendationEngine
  ) {}

  /**
   * Pure-logic evaluation of a dashboard aggregate payload. Produces the
   * `intelligence` block appended additively to the API response.
   */
  evaluate(data: IntelligenceInput): DashboardIntelligence {
    const status = this.currentStatus.derive(data);
    const profit = this.profitLoss.derive(data);

    const maintenanceAlerts = this.maintenance.derive(data);
    const weatherAlerts = this.weather.derive(data);
    const alerts = this.sortAlerts([...maintenanceAlerts, ...weatherAlerts]);

    const opportunities = this.opportunities.derive(data);

    // --- Native Engine Subsystem ---
    const expected = data.benchmark.expectedProductionKwh;
    
    // Default safe context if not provided
    const context = data.engineContext ?? {
      ghi: 1000, cloudCover: 0, temperature: 25, pm10: 10, daysWithoutRain: 0
    };
    
    // 3. Estimated production
    const estimation = this.estimatedProductionEngine.estimate({
      expectedKwh: expected,
      ghi: context.ghi ?? 1000,
      ghiClearSky: 1000, // standard assumption for MVP
      cloudCoverPercent: context.cloudCover ?? 0,
      maxTemperature: context.temperature ?? 25,
      pm10: context.pm10 ?? 10,
      daysWithoutRain: context.daysWithoutRain ?? 0
    });

    // 4. Determine mode
    let actualProduction = context.actualKwh;
    const mode: CalculationMode = actualProduction ? "real" : "estimated";

    if (!actualProduction) {
      actualProduction = estimation.estimatedKwh;
    }

    const tariffs = data.engineTariff ?? { importRate: 0.6, exportRate: 0.2 };

    let lossBreakdown = null;
    try {
      lossBreakdown = this.lossEngine.calculateLoss({
        expectedKwh: expected,
        actualKwh: actualProduction,
        mode,
        selfConsumptionRatio: 0.7, // Hardcoded fallback for now, avoiding circular financial dependency
        tariff: { currency: "ILS", ...tariffs },
        factors: estimation.factors,
        hasHistoricalData: true
      });
    } catch (e) {
      this.logger.error("Calculation failed for explicit loss breakdown", e instanceof Error ? e.stack : e);
      lossBreakdown = {
        error: true,
        message: "Failed to resolve calculation engine. Standard fallback active.",
        mode: "forecast"
      } as any;
    }

    // Multi-scenario engine providing local context for the Simulator
    const simulations = this.financialEngine.simulate(
      profit.currentMonthlyIls,
      lossBreakdown?.totalMoneyLossIls ?? 0, // Strict engine coupling (Removed old logic)
      profit.headroomMonthlyIls * 12,
      { cleaning: true, battery: true, automation: false }
    );

    // Single unified call mapping directly to structural actions
    const engineRecommendations = this.recommendationEngine.generateRecommendations(
      lossBreakdown,
      simulations,
      data.selfConsumption.selfConsumptionScore
    );

    return {
      status,
      profit,
      alerts,
      opportunities,
      generatedAt: data.generatedAt,
      // Extensions - Never breaking existing contracts:
      lossBreakdown,
      estimation,
      engineRecommendations,
      simulations,
      debug: {
        expected,
        estimated: estimation.estimatedKwh,
        factors: estimation.factors
      }
    };
  }

  private sortAlerts(alerts: IntelligenceAlert[]): IntelligenceAlert[] {
    return [...alerts].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );
  }
}
