import { Inject, Injectable, Logger } from "@nestjs/common";
import { AIR_QUALITY_PROVIDER_TOKEN } from "../integrations/providers/common/provider.tokens";
import {
  AirQualityProvider,
  AirQualitySnapshotInput
} from "../integrations/providers/contracts/air-quality-provider.interface";

export interface CanonicalAirQualitySnapshot {
  fetchedAt: string;
  pm10: number | null;
  pm25: number | null;
  dustIndex: number | null;
  source: string;
}

@Injectable()
export class AirQualityIngestionService {
  private readonly logger = new Logger(AirQualityIngestionService.name);

  constructor(
    @Inject(AIR_QUALITY_PROVIDER_TOKEN) private readonly airQualityProvider: AirQualityProvider
  ) {}

  /**
   * Fetches live air quality (pm10/pm2.5/dust) for the site's coordinates.
   * Returns null if the provider fails — caller decides fallback strategy.
   */
  async ingestAirQuality(input: AirQualitySnapshotInput): Promise<CanonicalAirQualitySnapshot | null> {
    try {
      const snapshot = await this.airQualityProvider.getSnapshot(input);
      return {
        fetchedAt: new Date().toISOString(),
        pm10: snapshot.pm10 ?? null,
        pm25: snapshot.pm25 ?? null,
        dustIndex: snapshot.dustIndex ?? null,
        source: snapshot.source || "unknown"
      };
    } catch (error) {
      this.logger.error(
        `Air quality ingestion failed for site ${input.siteId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
      return null;
    }
  }
}
