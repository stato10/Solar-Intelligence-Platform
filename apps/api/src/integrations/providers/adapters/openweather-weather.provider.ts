import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  WeatherDailyEntry,
  WeatherHourlyEntry,
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

interface OpenWeatherHourlyEntry {
  dt?: number;
  temp?: number;
  clouds?: number;
  wind_speed?: number;
  humidity?: number;
  uvi?: number;
  rain?: { "1h"?: number };
  snow?: { "1h"?: number };
  weather?: Array<{ id?: number; main?: string; description?: string }>;
}

interface OpenWeatherDailyEntry {
  dt?: number;
  temp?: { min?: number; max?: number };
  humidity?: number;
  wind_speed?: number;
  uvi?: number;
  rain?: number;
  snow?: number;
  sunrise?: number;
  sunset?: number;
  weather?: Array<{ id?: number; main?: string; description?: string }>;
}

interface OpenWeatherResponse {
  current?: {
    temp?: number;
    clouds?: number;
    wind_speed?: number;
    humidity?: number;
    uvi?: number;
    dew_point?: number;
    rain?: { "1h"?: number };
    snow?: { "1h"?: number };
  };
  hourly?: OpenWeatherHourlyEntry[];
  daily?: OpenWeatherDailyEntry[];
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
      // Request all sections — no exclude so we get hourly + daily + alerts
      exclude: ""
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
    // Don't exclude anything — we want hourly, daily, and alerts
    // Only exclude minutely which is not useful for solar
    searchParams.set("exclude", "minutely");

    const response = await this.getJson<OpenWeatherResponse>(
      this.config.path,
      searchParams,
      meta
    );

    const precipitation =
      response.current?.rain?.["1h"] ?? response.current?.snow?.["1h"] ?? 0;

    // Build enriched hourly forecast from OpenWeather (48 hours)
    const hourlyForecast = this.buildHourlyEntries(response.hourly);

    // Build enriched daily forecast from OpenWeather (8 days)
    const dailyForecast = this.buildDailyEntries(response.daily);

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "OPENWEATHER_ONECALL_3_0",
      temperature: response.current?.temp,
      cloudCover: response.current?.clouds,
      windSpeed: response.current?.wind_speed,
      precipitation,
      humidity: response.current?.humidity,
      snowfall: response.current?.snow?.["1h"],
      uvIndex: response.current?.uvi,
      alerts: (response.alerts ?? []).map((alert) => this.mapAlert(alert)),
      hourlyForecast,
      dailyForecast
    };
  }

  private buildHourlyEntries(hourly?: OpenWeatherHourlyEntry[]): WeatherHourlyEntry[] {
    if (!hourly) return [];

    return hourly.map((entry) => ({
      time: entry.dt ? new Date(entry.dt * 1000).toISOString() : new Date().toISOString(),
      temperature: entry.temp ?? 0,
      cloudCover: entry.clouds ?? 0,
      windSpeed: entry.wind_speed ?? 0,
      precipitation: entry.rain?.["1h"] ?? 0,
      snowfall: entry.snow?.["1h"] ?? 0,
      humidity: entry.humidity ?? 50,
      uvIndex: entry.uvi,
      weatherCode: this.mapOpenWeatherIdToWmo(entry.weather?.[0]?.id)
    }));
  }

  private buildDailyEntries(daily?: OpenWeatherDailyEntry[]): WeatherDailyEntry[] {
    if (!daily) return [];

    return daily.map((entry) => ({
      date: entry.dt
        ? new Date(entry.dt * 1000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      temperatureMax: entry.temp?.max ?? 0,
      temperatureMin: entry.temp?.min ?? 0,
      precipitationSum: entry.rain ?? 0,
      snowfallSum: entry.snow ?? 0,
      windSpeedMax: entry.wind_speed ?? 0,
      uvIndexMax: entry.uvi ?? 0,
      weatherCode: this.mapOpenWeatherIdToWmo(entry.weather?.[0]?.id),
      sunriseTime: entry.sunrise
        ? new Date(entry.sunrise * 1000).toISOString()
        : undefined,
      sunsetTime: entry.sunset
        ? new Date(entry.sunset * 1000).toISOString()
        : undefined
    }));
  }

  /**
   * Maps OpenWeather condition IDs to approximate WMO weather codes.
   * See: https://openweathermap.org/weather-conditions
   */
  private mapOpenWeatherIdToWmo(owId?: number): number {
    if (!owId) return 0;

    // Thunderstorm (200-232)
    if (owId >= 200 && owId <= 232) return 95;
    // Drizzle (300-321)
    if (owId >= 300 && owId <= 321) return 51;
    // Rain (500-531)
    if (owId >= 500 && owId <= 504) return 61;
    if (owId === 511) return 67; // freezing rain
    if (owId >= 520 && owId <= 531) return 80;
    // Snow (600-622)
    if (owId >= 600 && owId <= 622) return 71;
    // Atmosphere (701-781): mist, smoke, haze, dust, fog, sand, ash, squall, tornado
    if (owId === 701 || owId === 741) return 45; // fog
    if (owId === 711) return 4; // smoke/haze
    if (owId === 721) return 5; // haze
    if (owId === 731 || owId === 751 || owId === 761) return 30; // dust/sand
    if (owId === 762) return 4; // volcanic ash
    if (owId === 771) return 95; // squall
    if (owId === 781) return 99; // tornado
    // Clear (800)
    if (owId === 800) return 0;
    // Clouds (801-804)
    if (owId === 801) return 1;
    if (owId === 802) return 2;
    if (owId >= 803) return 3;

    return 0;
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
