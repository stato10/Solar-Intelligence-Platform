import { Inject, Injectable, Logger } from "@nestjs/common";
import { WEATHER_PROVIDER_TOKEN } from "../integrations/providers/common/provider.tokens";
import {
  WeatherDailyEntry,
  WeatherHourlyEntry,
  WeatherProvider,
  WeatherRiskAlert,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../integrations/providers/contracts/weather-provider.interface";
import { ProviderNormalizerService } from "./provider-normalizer.service";

/**
 * A solar-specific alert computed from weather data
 */
export interface SolarWeatherAlert {
  id: string;
  type: "overheat" | "snow_coverage" | "hail_storm" | "dust_soiling" | "natural_cleaning" | "frost" | "uv_degradation" | "optimal_production";
  severity: "low" | "moderate" | "high";
  title: string;
  message: string;
  expectedDate?: string;
  productionImpactPercent?: number;
}

/**
 * Canonical weather snapshot enriched with solar-specific intelligence.
 */
export interface CanonicalWeatherSnapshot {
  fetchedAt: string;
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    cloudCover: number;
    windSpeed: number;
    precipitation: number;
    humidity: number;
    snowfall: number;
    uvIndex: number;
    ghi: number;
  };
  hourlyForecast: WeatherHourlyEntry[];
  dailyForecast: WeatherDailyEntry[];
  alerts: WeatherRiskAlert[];
  solarAlerts: SolarWeatherAlert[];
  source: string;
}

@Injectable()
export class WeatherIngestionService {
  private readonly logger = new Logger(WeatherIngestionService.name);

  constructor(
    @Inject(WEATHER_PROVIDER_TOKEN) private readonly weatherProvider: WeatherProvider,
    private readonly normalizer: ProviderNormalizerService
  ) {}

  /**
   * Orchestrates weather fetch from the provider chain (OpenWeather → Open-Meteo fallback).
   * Enriches result with solar-specific alerts computed from weather data.
   *
   * Returns null if all providers fail — caller decides fallback strategy.
   */
  async ingestWeather(input: WeatherSnapshotInput): Promise<CanonicalWeatherSnapshot | null> {
    try {
      this.logger.log(
        `Ingesting weather for site ${input.siteId} at lat:${input.latitude}, lng:${input.longitude}`
      );

      // The WEATHER_PROVIDER_TOKEN resolves to WeatherProviderOrchestratorService
      // which already handles OpenWeather → Open-Meteo fallback chain
      const rawSnapshot = await this.weatherProvider.getSnapshot(input);

      // Build canonical snapshot with normalized values
      const canonical: CanonicalWeatherSnapshot = {
        fetchedAt: new Date().toISOString(),
        latitude: input.latitude,
        longitude: input.longitude,
        current: {
          temperature: this.normalizer.normalizeTemperature(rawSnapshot.temperature ?? 25),
          cloudCover: this.normalizer.safeNumber(rawSnapshot.cloudCover),
          windSpeed: this.normalizer.normalizeWindSpeed(rawSnapshot.windSpeed ?? 0),
          precipitation: this.normalizer.normalizePrecipitation(rawSnapshot.precipitation),
          humidity: this.normalizer.normalizeHumidity(rawSnapshot.humidity),
          snowfall: this.normalizer.normalizeSnowfall(rawSnapshot.snowfall),
          uvIndex: this.normalizer.normalizeUvIndex(rawSnapshot.uvIndex),
          ghi: this.normalizer.safeNumber(rawSnapshot.ghi)
        },
        hourlyForecast: this.normalizer.normalizeArray(rawSnapshot.hourlyForecast),
        dailyForecast: this.normalizer.normalizeArray(rawSnapshot.dailyForecast),
        alerts: this.normalizer.normalizeArray(rawSnapshot.alerts),
        solarAlerts: [],
        source: rawSnapshot.source || "unknown"
      };

      // Compute solar-specific alerts from weather data
      canonical.solarAlerts = this.computeSolarAlerts(canonical);

      return canonical;
    } catch (error) {
      this.logger.error(
        `Weather ingestion failed for site ${input.siteId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
      return null;
    }
  }

  /**
   * Analyzes weather snapshot data to generate solar-system-specific alerts.
   * These alerts help the user protect their system and optimize production.
   */
  private computeSolarAlerts(snapshot: CanonicalWeatherSnapshot): SolarWeatherAlert[] {
    const alerts: SolarWeatherAlert[] = [];
    const daily = snapshot.dailyForecast;

    if (daily.length === 0) return alerts;

    // --- 1. Panel Overheat Risk ---
    for (const day of daily) {
      if (day.temperatureMax > 35 && day.windSpeedMax < 3) {
        alerts.push({
          id: `overheat-${day.date}`,
          type: "overheat",
          severity: day.temperatureMax > 42 ? "high" : "moderate",
          title: "Panel Overheat Risk",
          message: `High temperature (${day.temperatureMax}°C) with low wind on ${day.date}. Panel efficiency may drop 10-15%. Shift heavy loads to morning hours.`,
          expectedDate: day.date,
          productionImpactPercent: Math.round((day.temperatureMax - 25) * 0.4)
        });
        break; // Only alert for the nearest overheat day
      }
    }

    // --- 2. Snow Coverage ---
    for (const day of daily) {
      if (day.snowfallSum > 2) {
        alerts.push({
          id: `snow-${day.date}`,
          type: "snow_coverage",
          severity: day.snowfallSum > 10 ? "high" : "moderate",
          title: "Snow Coverage Expected",
          message: `${day.snowfallSum}cm of snow expected on ${day.date}. Panels may need clearing. Production loss could reach 80-100%.`,
          expectedDate: day.date,
          productionImpactPercent: Math.min(100, Math.round(day.snowfallSum * 8))
        });
        break;
      }
    }

    // --- 3. Hail / Severe Storm ---
    for (const day of daily) {
      const classification = this.normalizer.classifyWeatherCode(day.weatherCode);
      if (classification.solarImpact === "storm") {
        alerts.push({
          id: `storm-${day.date}`,
          type: "hail_storm",
          severity: "high",
          title: "Severe Weather Alert",
          message: `${classification.label} expected on ${day.date}. Inspect panels after storm passes for potential damage.`,
          expectedDate: day.date,
          productionImpactPercent: classification.productionImpactPercent
        });
        break;
      }
    }

    // Also check OpenWeather text alerts for hail
    for (const alert of snapshot.alerts) {
      const text = `${alert.riskType} ${alert.message}`.toLowerCase();
      if (text.includes("hail") || text.includes("tornado") || text.includes("hurricane")) {
        alerts.push({
          id: `alert-${alert.riskType}-${alert.expectedStart}`,
          type: "hail_storm",
          severity: "high",
          title: "Extreme Weather Warning",
          message: alert.message,
          expectedDate: alert.expectedStart.split("T")[0]
        });
        break;
      }
    }

    // --- 4. Dust / Soiling Acceleration (dry spell) ---
    const consecutiveDryDays = this.countConsecutiveDryDays(daily);
    if (consecutiveDryDays >= 5) {
      const avgHumidity = snapshot.current.humidity;
      if (avgHumidity < 40) {
        alerts.push({
          id: `dust-dry-spell`,
          type: "dust_soiling",
          severity: consecutiveDryDays >= 10 ? "high" : "moderate",
          title: "Dust & Soiling Acceleration",
          message: `No rain for ${consecutiveDryDays}+ days with low humidity (${avgHumidity}%). Soiling is accelerating. Consider cleaning within 3 days.`,
          productionImpactPercent: Math.min(15, consecutiveDryDays * 1.5)
        });
      }
    }

    // --- 5. Heavy Rain = Natural Cleaning ---
    for (const day of daily) {
      if (day.precipitationSum > 10) {
        alerts.push({
          id: `rain-clean-${day.date}`,
          type: "natural_cleaning",
          severity: "low",
          title: "Natural Panel Cleaning",
          message: `Heavy rain (${day.precipitationSum}mm) expected on ${day.date}. This will naturally clean panels. Delay any planned cleaning.`,
          expectedDate: day.date,
          productionImpactPercent: 0
        });
        break;
      }
    }

    // --- 6. Frost Risk ---
    for (const day of daily) {
      if (day.temperatureMin < 0) {
        alerts.push({
          id: `frost-${day.date}`,
          type: "frost",
          severity: day.temperatureMin < -5 ? "high" : "moderate",
          title: "Frost Risk",
          message: `Freezing temperatures (${day.temperatureMin}°C) expected on ${day.date}. Avoid panel contact until thaw. Check for ice accumulation.`,
          expectedDate: day.date,
          productionImpactPercent: 20
        });
        break;
      }
    }

    // --- 7. Extreme UV Degradation ---
    const highUvDays = daily.filter((d) => d.uvIndexMax > 11).length;
    if (highUvDays >= 3) {
      alerts.push({
        id: `uv-degradation`,
        type: "uv_degradation",
        severity: "moderate",
        title: "Sustained Extreme UV",
        message: `Extreme UV index (>11) for ${highUvDays} consecutive days. Check panel coating condition during next maintenance.`,
        productionImpactPercent: 2
      });
    }

    // --- 8. Optimal Production Window (positive alert) ---
    const today = daily[0];
    if (
      today &&
      today.temperatureMax >= 15 &&
      today.temperatureMax <= 30 &&
      today.precipitationSum === 0 &&
      today.snowfallSum === 0
    ) {
      const classification = this.normalizer.classifyWeatherCode(today.weatherCode);
      if (classification.solarImpact === "clear" || classification.productionImpactPercent < 10) {
        alerts.push({
          id: `optimal-${today.date}`,
          type: "optimal_production",
          severity: "low",
          title: "Excellent Production Conditions",
          message: `Clear skies and optimal temperature (${today.temperatureMax}°C) today. Run heavy appliances during peak solar hours.`,
          expectedDate: today.date,
          productionImpactPercent: 0
        });
      }
    }

    return alerts;
  }

  /**
   * Counts how many consecutive days in the forecast have zero precipitation.
   */
  private countConsecutiveDryDays(daily: WeatherDailyEntry[]): number {
    let count = 0;
    for (const day of daily) {
      if (day.precipitationSum < 0.5) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}
