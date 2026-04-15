import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

export interface WeatherSnapshotInput {
  siteId: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface WeatherRiskAlert {
  riskType: string;
  severity: string;
  message: string;
  expectedStart: string;
  expectedEnd: string;
  sourceProvider: string;
}

// --- Enriched hourly forecast entry ---
export interface WeatherHourlyEntry {
  time: string;
  temperature: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  snowfall: number;
  humidity: number;
  uvIndex?: number;
  directRadiation?: number;   // W/m² — direct solar irradiance
  diffuseRadiation?: number;  // W/m² — diffuse solar irradiance
  weatherCode?: number;       // WMO weather interpretation code
}

// --- Enriched daily forecast entry ---
export interface WeatherDailyEntry {
  date: string;              // YYYY-MM-DD
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  snowfallSum: number;
  windSpeedMax: number;
  uvIndexMax: number;
  weatherCode: number;       // WMO weather interpretation code
  sunriseTime?: string;
  sunsetTime?: string;
}

export interface WeatherSnapshotOutput {
  siteId: string;
  generatedAt: string;
  source: string;
  temperature?: number;
  cloudCover?: number;
  windSpeed?: number;
  precipitation?: number;
  alerts: WeatherRiskAlert[];
  // --- Enriched fields (optional — backward compatible) ---
  humidity?: number;
  snowfall?: number;
  uvIndex?: number;
  hourlyForecast?: WeatherHourlyEntry[];
  dailyForecast?: WeatherDailyEntry[];
}

export interface WeatherProvider {
  getHealth(meta?: ProviderRequestMeta): Promise<ProviderHealthStatus>;
  getSnapshot(
    input: WeatherSnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<WeatherSnapshotOutput>;
}
