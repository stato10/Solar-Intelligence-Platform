import { Module } from "@nestjs/common";
import { SitesModule } from "../domain/sites/sites.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ConnectorFactory } from "./connectors/connector.factory";
import { MockInverterConnector } from "./connectors/mock.connector";
import { SolarEdgeConnector } from "./connectors/solaredge.connector";
import { TelemetrySyncScheduler } from "./telemetry-sync.scheduler";
import { TelemetryController } from "./telemetry.controller";
import { TelemetryService } from "./telemetry.service";

@Module({
  imports: [PrismaModule, SitesModule],
  controllers: [TelemetryController],
  providers: [
    TelemetryService,
    TelemetrySyncScheduler,
    ConnectorFactory,
    SolarEdgeConnector,
    MockInverterConnector
  ],
  exports: [TelemetryService]
})
export class TelemetryModule {}
