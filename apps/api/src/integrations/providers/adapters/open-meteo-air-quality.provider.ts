import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  AirQualityProvider,
  AirQualitySnapshotInput,
  AirQualitySnapshotOutput
} from "../contracts/air-quality-provider.interface";

interface OpenMeteoAirQualityHourly {
  time?: string[];
  pm10?: number[];
  pm2_5?: number[];
  dust?: number[];
}

interface OpenMeteoAirQualityResponse {
  hourly?: OpenMeteoAirQualityHourly;
}

/**
 * Open-Meteo Air Quality API adapter (keyless).
 * Provides live pm10/pm2.5/dust concentrations used by the soiling
 * intelligence instead of hardcoded MVP values.
 */
@Injectable()
export class OpenMeteoAirQualityProvider
  extends HttpProviderBase
  implements AirQualityProvider
{
  constructor(private readonly configService: ConfigService) {
    super(
      "OPEN_METEO",
      configService.get<string>("app.openMeteo.airQualityBaseUrl") ??
        "https://air-quality-api.open-meteo.com"
    );
  }

  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPEN_METEO",
      available: true,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "real",
        baseUrl: this.baseUrl,
        kind: "air_quality"
      }
    };
  }

  async getSnapshot(
    input: AirQualitySnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<AirQualitySnapshotOutput> {
    const searchParams = new URLSearchParams({
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      timezone: input.timezone ?? "auto",
      hourly: "pm10,pm2_5,dust",
      forecast_days: "1"
    });

    const response = await this.getJson<OpenMeteoAirQualityResponse>(
      "/v1/air-quality",
      searchParams,
      meta
    );

    const currentIdx = this.findCurrentHourIndex(response.hourly?.time);

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "OPEN_METEO_AIR_QUALITY",
      pm10: this.safeGet(response.hourly?.pm10, currentIdx),
      pm25: this.safeGet(response.hourly?.pm2_5, currentIdx),
      dustIndex: this.safeGet(response.hourly?.dust, currentIdx)
    };
  }

  private findCurrentHourIndex(times?: string[]): number {
    if (!times || times.length === 0) return 0;

    const now = Date.now();
    let bestIdx = 0;
    let bestDiff = Infinity;

    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - now);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  private safeGet(arr?: number[], idx = 0): number | undefined {
    if (!arr || idx < 0 || idx >= arr.length) return undefined;
    return arr[idx];
  }
}
