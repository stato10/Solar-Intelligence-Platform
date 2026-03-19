import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  WeatherProvider,
  WeatherRiskAlert,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../contracts/weather-provider.interface";

interface OpenWeatherAlert {
  sender_name?: string;
  event?: string;
  start?: number;
  end?: number;
  description?: string;
  tags?: string[];
}

interface OpenWeatherResponse {
  current?: {
    temp?: number;
    clouds?: number;
    wind_speed?: number;
    rain?: { "1h"?: number };
    snow?: { "1h"?: number };
  };
  alerts?: OpenWeatherAlert[];
}

@Injectable()
export class OpenWeatherWeatherProvider
  extends HttpProviderBase
  implements WeatherProvider
{
  constructor(private readonly configService: ConfigService) {
    super(
      "OPENWEATHER_ONECALL_3_0",
      configService.get<string>("app.openWeather.baseUrl") ??
        "https://api.openweathermap.org"
    );
  }

  private get config() {
    return {
      apiKey: this.configService.get<string>("app.openWeather.apiKey") ?? "",
      path:
        this.configService.get<string>("app.openWeather.oneCallPath") ??
        "/data/3.0/onecall",
      units: this.configService.get<string>("app.openWeather.units") ?? "metric",
      lang: this.configService.get<string>("app.openWeather.lang") ?? "en",
      exclude:
        this.configService.get<string>("app.openWeather.exclude") ?? "minutely"
    };
  }

  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPENWEATHER_ONECALL_3_0",
      available: Boolean(this.config.apiKey),
      checkedAt: new Date().toISOString(),
      details: {
        mode: "real",
        configured: Boolean(this.config.apiKey),
        baseUrl: this.baseUrl
      }
    };
  }

  async getSnapshot(
    input: WeatherSnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<WeatherSnapshotOutput> {
    if (!this.config.apiKey) {
      throw new ServiceUnavailableException("OpenWeather API key is not configured");
    }

    const searchParams = new URLSearchParams({
      lat: String(input.latitude),
      lon: String(input.longitude),
      appid: this.config.apiKey,
      units: this.config.units,
      lang: this.config.lang,
      exclude: this.config.exclude
    });

    const response = await this.getJson<OpenWeatherResponse>(
      this.config.path,
      searchParams,
      meta
    );

    const precipitation =
      response.current?.rain?.["1h"] ?? response.current?.snow?.["1h"] ?? 0;

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "OPENWEATHER_ONECALL_3_0",
      temperature: response.current?.temp,
      cloudCover: response.current?.clouds,
      windSpeed: response.current?.wind_speed,
      precipitation,
      alerts: (response.alerts ?? []).map((alert) => this.mapAlert(alert))
    };
  }

  private mapAlert(alert: OpenWeatherAlert): WeatherRiskAlert {
    return {
      riskType: alert.event?.toLowerCase() ?? "weather-alert",
      severity: this.inferSeverity(alert),
      message: alert.description ?? alert.event ?? "Weather alert",
      expectedStart: alert.start
        ? new Date(alert.start * 1000).toISOString()
        : new Date().toISOString(),
      expectedEnd: alert.end
        ? new Date(alert.end * 1000).toISOString()
        : new Date().toISOString(),
      sourceProvider: alert.sender_name ?? "OPENWEATHER_ONECALL_3_0"
    };
  }

  private inferSeverity(alert: OpenWeatherAlert) {
    const text = `${alert.event ?? ""} ${alert.description ?? ""}`.toLowerCase();
    if (text.includes("extreme") || text.includes("severe") || text.includes("warning")) {
      return "high";
    }
    if (text.includes("watch") || text.includes("advisory")) {
      return "moderate";
    }
    return "low";
  }
}
