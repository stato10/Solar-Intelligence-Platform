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
  private static readonly API_KEY_PATTERN = /^[a-f0-9]{32}$/i;

  constructor(private readonly configService: ConfigService) {
    super(
      "OPENWEATHER_ONECALL_3_0",
      configService.get<string>("app.openWeather.baseUrl") ??
        "https://api.openweathermap.org"
    );
  }

  private get config() {
    const rawKey = this.configService.get<string>("app.openWeather.apiKey") ?? "";
    return {
      apiKey: rawKey.trim(),
      path:
        this.configService.get<string>("app.openWeather.oneCallPath") ??
        "/data/3.0/onecall",
      units: this.configService.get<string>("app.openWeather.units") ?? "metric",
      lang: this.configService.get<string>("app.openWeather.lang") ?? "en",
      exclude:
        this.configService.get<string>("app.openWeather.exclude") ?? "minutely"
    };
  }

  private resolveApiKey(rawKey: string) {
    const trimmed = rawKey.trim().replace(/^"(.*)"$/, "$1");
    if (OpenWeatherWeatherProvider.API_KEY_PATTERN.test(trimmed)) {
      return {
        key: trimmed,
        normalized: false
      };
    }

    // Some local env values may accidentally concatenate/pad keys; prefer the last
    // valid 32-char hex window so runtime can still use the intended key.
    const overlappingMatches = Array.from(
      trimmed.matchAll(/(?=([a-f0-9]{32}))/gi),
      (match) => match[1]
    );
    if (overlappingMatches.length > 0) {
      return {
        key: overlappingMatches[overlappingMatches.length - 1],
        normalized: true
      };
    }

    return {
      key: trimmed,
      normalized: false
    };
  }

  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    const keyConfigured = Boolean(this.config.apiKey);
    const resolved = this.resolveApiKey(this.config.apiKey);
    const validApiKey =
      keyConfigured && OpenWeatherWeatherProvider.API_KEY_PATTERN.test(resolved.key);

    return {
      provider: "OPENWEATHER_ONECALL_3_0",
      available: keyConfigured,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "real",
        configured: keyConfigured,
        apiKeyFormatValid: validApiKey,
        apiKeyNormalized: resolved.normalized,
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
    const resolved = this.resolveApiKey(this.config.apiKey);
    if (!OpenWeatherWeatherProvider.API_KEY_PATTERN.test(resolved.key)) {
      throw new ServiceUnavailableException(
        "OpenWeather API key format is invalid. Expected 32 hexadecimal characters."
      );
    }

    const searchParams = new URLSearchParams();
    searchParams.set("lat", String(input.latitude));
    searchParams.set("lon", String(input.longitude));
    searchParams.set("appid", resolved.key);
    if (this.config.units) {
      searchParams.set("units", this.config.units);
    }
    if (this.config.lang) {
      searchParams.set("lang", this.config.lang);
    }
    if (this.config.exclude) {
      searchParams.set("exclude", this.config.exclude);
    }

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
