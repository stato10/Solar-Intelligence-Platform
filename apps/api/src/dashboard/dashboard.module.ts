import { Module } from "@nestjs/common";
import { DomainModule } from "../domain";
import { EngineModule } from "../integrations/engine/engine.module";
import { ProvidersModule } from "../integrations/providers";
import { DashboardController } from "./dashboard.controller";
import { DashboardDemoSeedService } from "./dashboard-demo-seed.service";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [ProvidersModule, EngineModule, DomainModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardDemoSeedService]
})
export class DashboardModule {}
