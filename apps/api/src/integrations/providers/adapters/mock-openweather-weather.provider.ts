import { Injectable } from "@nestjs/common";
import {
  WeatherProvider,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../contracts/weather-provider.interface";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

@Injectable()
export class MockOpenWeatherWeatherProvider implements WeatherProvider {
  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPENWEATHER_ONECALL_3_0",
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
      source: "OPENWEATHER_ONECALL_3_0_MOCK",
      temperature: 29.1,
      cloudCover: 42,
      windSpeed: 5.2,
      precipitation: 0.2,
      alerts: [
        {
          riskType: "heat",
          severity: "moderate",
          message: "Heat conditions expected in the afternoon window.",
          expectedStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          expectedEnd: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          sourceProvider: "OPENWEATHER_ONECALL_3_0_MOCK"
        }
      ]
    };
  }
}
