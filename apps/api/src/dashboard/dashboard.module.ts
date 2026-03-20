import { Module } from "@nestjs/common";
import { EngineModule } from "../integrations/engine/engine.module";
import { ProvidersModule } from "../integrations/providers";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [ProvidersModule, EngineModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
