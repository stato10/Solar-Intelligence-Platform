import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  WeatherDailyEntry,
  WeatherHourlyEntry,
  WeatherProvider,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../contracts/weather-provider.interface";

interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: number[];
  relative_humidity_2m?: number[];
  cloud_cover?: number[];
  wind_speed_10m?: number[];
  precipitation?: number[];
  snowfall?: number[];
  uv_index?: number[];
  weather_code?: number[];
  direct_radiation?: number[];
  diffuse_radiation?: number[];
}

interface OpenMeteoDaily {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  snowfall_sum?: number[];
  wind_speed_10m_max?: number[];
  uv_index_max?: number[];
  weather_code?: number[];
  sunrise?: string[];
  sunset?: string[];
}

interface OpenMeteoForecastResponse {
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
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
      pastDays: 7,    // Always fetch 7 days of history for trend analysis
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
    const hourlyParams = [
      "temperature_2m",
      "relative_humidity_2m",
      "cloud_cover",
      "wind_speed_10m",
      "precipitation",
      "snowfall",
      "uv_index",
      "weather_code",
      "direct_radiation",
      "diffuse_radiation"
    ].join(",");

    const dailyParams = [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "snowfall_sum",
      "wind_speed_10m_max",
      "uv_index_max",
      "weather_code",
      "sunrise",
      "sunset"
    ].join(",");

    const searchParams = new URLSearchParams({
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      timezone: input.timezone ?? this.config.timezone,
      forecast_days: String(this.config.forecastDays),
      past_days: String(this.config.pastDays),
      hourly: hourlyParams,
      daily: dailyParams
    });

    const response = await this.getJson<OpenMeteoForecastResponse>(
      this.config.path,
      searchParams,
      meta
    );

    // Build enriched hourly forecast array
    const hourlyForecast = this.buildHourlyEntries(response.hourly);

    // Build enriched daily forecast array
    const dailyForecast = this.buildDailyEntries(response.daily);

    // Current values = first non-null hourly entry closest to now
    const currentIdx = this.findCurrentHourIndex(response.hourly?.time);

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "OPEN_METEO",
      temperature: this.safeGet(response.hourly?.temperature_2m, currentIdx),
      cloudCover: this.safeGet(response.hourly?.cloud_cover, currentIdx),
      windSpeed: this.safeGet(response.hourly?.wind_speed_10m, currentIdx),
      precipitation: this.safeGet(response.hourly?.precipitation, currentIdx),
      humidity: this.safeGet(response.hourly?.relative_humidity_2m, currentIdx),
      snowfall: this.safeGet(response.hourly?.snowfall, currentIdx),
      uvIndex: this.safeGet(response.hourly?.uv_index, currentIdx),
      alerts: [], // Open-Meteo doesn't provide alert objects — alerts come from OpenWeather
      hourlyForecast,
      dailyForecast
    };
  }

  private buildHourlyEntries(hourly?: OpenMeteoHourly): WeatherHourlyEntry[] {
    if (!hourly?.time) return [];

    const entries: WeatherHourlyEntry[] = [];
    const count = hourly.time.length;

    for (let i = 0; i < count; i++) {
      entries.push({
        time: hourly.time[i],
        temperature: hourly.temperature_2m?.[i] ?? 0,
        cloudCover: hourly.cloud_cover?.[i] ?? 0,
        windSpeed: hourly.wind_speed_10m?.[i] ?? 0,
        precipitation: hourly.precipitation?.[i] ?? 0,
        snowfall: hourly.snowfall?.[i] ?? 0,
        humidity: hourly.relative_humidity_2m?.[i] ?? 50,
        uvIndex: hourly.uv_index?.[i],
        directRadiation: hourly.direct_radiation?.[i],
        diffuseRadiation: hourly.diffuse_radiation?.[i],
        weatherCode: hourly.weather_code?.[i]
      });
    }

    return entries;
  }

  private buildDailyEntries(daily?: OpenMeteoDaily): WeatherDailyEntry[] {
    if (!daily?.time) return [];

    const entries: WeatherDailyEntry[] = [];
    const count = daily.time.length;

    for (let i = 0; i < count; i++) {
      entries.push({
        date: daily.time[i],
        temperatureMax: daily.temperature_2m_max?.[i] ?? 0,
        temperatureMin: daily.temperature_2m_min?.[i] ?? 0,
        precipitationSum: daily.precipitation_sum?.[i] ?? 0,
        snowfallSum: daily.snowfall_sum?.[i] ?? 0,
        windSpeedMax: daily.wind_speed_10m_max?.[i] ?? 0,
        uvIndexMax: daily.uv_index_max?.[i] ?? 0,
        weatherCode: daily.weather_code?.[i] ?? 0,
        sunriseTime: daily.sunrise?.[i],
        sunsetTime: daily.sunset?.[i]
      });
    }

    return entries;
  }

  /**
   * Finds the hourly index closest to "now" in the time array.
   * Since past_days=7 is included, we need the actual current hour, not index 0.
   */
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
