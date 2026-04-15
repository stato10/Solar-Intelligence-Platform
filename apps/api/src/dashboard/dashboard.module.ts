import { Module } from "@nestjs/common";
import { DomainModule } from "../domain";
import { EngineModule } from "../integrations/engine/engine.module";
import { DataIngestionModule } from "../data-ingestion/data-ingestion.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardDemoSeedService } from "./dashboard-demo-seed.service";
import { DashboardQueryService } from "./dashboard-query.service";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [EngineModule, DomainModule, DataIngestionModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardDemoSeedService, DashboardQueryService]
})
export class DashboardModule {}
