import { Injectable } from "@nestjs/common";
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

const SEVERITY_ORDER: Record<IntelligenceSeverity, number> = {
  high: 0,
  moderate: 1,
  low: 2
};

@Injectable()
export class IntelligenceEvaluatorService {
  constructor(
    private readonly currentStatus: CurrentStatusService,
    private readonly profitLoss: ProfitLossService,
    private readonly maintenance: MaintenanceIntelligenceService,
    private readonly weather: WeatherRiskService,
    private readonly opportunities: OpportunityEngineService
  ) {}

  /**
   * Pure-logic evaluation of a dashboard aggregate payload. Produces the
   * `intelligence` block appended additively to the API response.
   *
   * Never throws — returns a safe default if input is malformed.
   */
  evaluate(data: IntelligenceInput): DashboardIntelligence {
    const status = this.currentStatus.derive(data);
    const profit = this.profitLoss.derive(data);

    const maintenanceAlerts = this.maintenance.derive(data);
    const weatherAlerts = this.weather.derive(data);
    const alerts = this.sortAlerts([...maintenanceAlerts, ...weatherAlerts]);

    const opportunities = this.opportunities.derive(data);

    return {
      status,
      profit,
      alerts,
      opportunities,
      generatedAt: data.generatedAt
    };
  }

  private sortAlerts(alerts: IntelligenceAlert[]): IntelligenceAlert[] {
    return [...alerts].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );
  }
}
