import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module";
import { CurrentStatusService } from "./current-status.service";
import { IntelligenceEvaluatorService } from "./intelligence-evaluator.service";
import { MaintenanceIntelligenceService } from "./maintenance-intelligence.service";
import { OpportunityEngineService } from "./opportunity-engine.service";
import { ProfitLossService } from "./profit-loss.service";
import { WeatherRiskService } from "./weather-risk.service";

/**
 * Intelligence Layer — pure-logic evaluators that transform the canonical
 * dashboard aggregate payload into user-facing status, profit, alerts,
 * and opportunities. Appended additively to the API response under the
 * `intelligence` field.
 */
@Module({
  imports: [EngineModule],
  providers: [
    CurrentStatusService,
    ProfitLossService,
    MaintenanceIntelligenceService,
    WeatherRiskService,
    OpportunityEngineService,
    IntelligenceEvaluatorService
  ],
  exports: [IntelligenceEvaluatorService]
})
export class IntelligenceModule {}
