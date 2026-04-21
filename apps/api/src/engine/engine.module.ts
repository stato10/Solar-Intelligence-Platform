import { Module } from "@nestjs/common";
import { EstimatedProductionEngine } from "./estimated-production.engine";
import { LossEngine } from "./loss.engine";
import { FinancialEngine } from "./financial.engine";
import { RecommendationEngine } from "./recommendation.engine";

@Module({
  providers: [
    EstimatedProductionEngine,
    LossEngine,
    FinancialEngine,
    RecommendationEngine
  ],
  exports: [
    EstimatedProductionEngine,
    LossEngine,
    FinancialEngine,
    RecommendationEngine
  ]
})
export class EngineModule {}
