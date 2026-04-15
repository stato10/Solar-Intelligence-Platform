import { Module } from "@nestjs/common";
import { ProvidersModule } from "../integrations/providers/providers.module";
import { PrismaModule } from "../prisma/prisma.module";
import { FreshnessPolicyService } from "./freshness-policy.service";
import { ProviderNormalizerService } from "./provider-normalizer.service";
import { SnapshotWriterService } from "./snapshot-writer.service";
import { SolarIngestionService } from "./solar-ingestion.service";
import { WeatherIngestionService } from "./weather-ingestion.service";
import { WeeklySiteSummaryService } from "./weekly-site-summary.service";
import { MonthlySiteSummaryService } from "./monthly-site-summary.service";

@Module({
  imports: [ProvidersModule, PrismaModule],
  providers: [
    FreshnessPolicyService,
    ProviderNormalizerService,
    SnapshotWriterService,
    SolarIngestionService,
    WeatherIngestionService,
    WeeklySiteSummaryService,
    MonthlySiteSummaryService
  ],
  exports: [
    FreshnessPolicyService,
    SnapshotWriterService,
    SolarIngestionService,
    WeatherIngestionService,
    WeeklySiteSummaryService,
    MonthlySiteSummaryService
  ]
})
export class DataIngestionModule {}
