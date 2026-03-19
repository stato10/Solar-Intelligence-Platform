import { Injectable } from "@nestjs/common";
import {
  WeatherProvider,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../contracts/weather-provider.interface";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

@Injectable()
export class MockOpenMeteoWeatherProvider implements WeatherProvider {
  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPEN_METEO",
      available: true,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "mock"
      }
    };
  }

  async getSnapshot(
    input: WeatherSnapshotInput,
    _meta?: ProviderRequestMeta
  ): Promise<WeatherSnapshotOutput> {
    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "OPEN_METEO_MOCK",
      temperature: 28.4,
      cloudCover: 35,
      windSpeed: 4.8,
      precipitation: 0,
      alerts: []
    };
  }
}
