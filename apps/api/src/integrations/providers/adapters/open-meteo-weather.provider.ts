import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  WeatherProvider,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../contracts/weather-provider.interface";

interface OpenMeteoForecastResponse {
  hourly?: {
    temperature_2m?: number[];
    cloud_cover?: number[];
    wind_speed_10m?: number[];
    precipitation?: number[];
  };
}

@Injectable()
export class OpenMeteoWeatherProvider
  extends HttpProviderBase
  implements WeatherProvider
{
  constructor(private readonly configService: ConfigService) {
    super(
      "OPEN_METEO",
      configService.get<string>("app.openMeteo.baseUrl") ?? "https://api.open-meteo.com"
    );
  }

  private get config() {
    return {
      path: "/v1/forecast",
      forecastDays: Number(this.configService.get<number>("app.openMeteo.forecastDays") ?? 7),
      timezone: this.configService.get<string>("app.openMeteo.timezone") ?? "auto"
    };
  }

  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPEN_METEO",
      available: true,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "real",
        baseUrl: this.baseUrl
      }
    };
  }

  async getSnapshot(
    input: WeatherSnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<WeatherSnapshotOutput> {
    const searchParams = new URLSearchParams({
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      timezone: input.timezone ?? this.config.timezone,
      forecast_days: String(this.config.forecastDays),
      hourly: "temperature_2m,cloud_cover,wind_speed_10m,precipitation"
    });

    const response = await this.getJson<OpenMeteoForecastResponse>(
      this.config.path,
      searchParams,
      meta
    );

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "OPEN_METEO",
      temperature: response.hourly?.temperature_2m?.[0],
      cloudCover: response.hourly?.cloud_cover?.[0],
      windSpeed: response.hourly?.wind_speed_10m?.[0],
      precipitation: response.hourly?.precipitation?.[0],
      alerts: []
    };
  }
}
