import { Injectable } from "@nestjs/common";

/**
 * WMO Weather Interpretation Code → Solar Impact Category.
 * See: https://open-meteo.com/en/docs#weathervariables
 */
export type SolarImpactCategory = "clear" | "cloudy" | "rain" | "snow" | "storm" | "fog" | "dust";

export interface WeatherClassification {
  label: string;
  solarImpact: SolarImpactCategory;
  productionImpactPercent: number; // estimated % loss (0 = no loss, 100 = total loss)
}

@Injectable()
export class ProviderNormalizerService {
  /**
   * Unifies units across different providers (e.g., Fahrenheit to Celsius).
   */
  normalizeTemperature(temp: number, unit: "C" | "F" | "K" = "C"): number {
    if (unit === "F") return (temp - 32) * (5 / 9);
    if (unit === "K") return temp - 273.15;
    return temp;
  }

  /**
   * Converts a given timestamp string/ms to the site's timezone.
   * Resolves basic timestamps to ISO strings.
   */
  normalizeTimestamp(timestamp: string | number, timezone: string): string {
    const date = new Date(timestamp);
    // In a full implementation, we'd use intl or date-fns-tz to format exact string,
    // but ISO is canonically safe for backend storage.
    return date.toISOString();
  }

  /**
   * Safely normalizes arrays to ensure they are never null
   * and have consistent boundaries.
   */
  normalizeArray<T>(arr: T[] | null | undefined, limit?: number): T[] {
    const safeArr = Array.isArray(arr) ? arr : [];
    return limit ? safeArr.slice(0, limit) : safeArr;
  }

  /**
   * Standardizes wind speed to m/s
   */
  normalizeWindSpeed(speed: number, unit: "m/s" | "km/h" | "mph" = "m/s"): number {
    if (unit === "km/h") return speed / 3.6;
    if (unit === "mph") return speed * 0.44704;
    return speed;
  }

  /**
   * Normalizes humidity to 0-100 range.
   */
  normalizeHumidity(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value)) return 50; // safe default
    return Math.max(0, Math.min(100, value));
  }

  /**
   * Normalizes UV index to 0-16 range.
   */
  normalizeUvIndex(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(16, value));
  }

  /**
   * Normalizes precipitation (mm), ensures non-negative.
   */
  normalizePrecipitation(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.max(0, value);
  }

  /**
   * Normalizes snowfall (cm), ensures non-negative.
   */
  normalizeSnowfall(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.max(0, value);
  }

  /**
   * Normalizes radiation values (W/m²), ensures non-negative.
   */
  normalizeRadiation(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.max(0, value);
  }

  /**
   * Classifies WMO weather interpretation code into human-readable label
   * and solar production impact category.
   * See: https://open-meteo.com/en/docs → Weather variable documentation
   */
  classifyWeatherCode(code: number | null | undefined): WeatherClassification {
    if (code == null || !Number.isFinite(code)) {
      return { label: "Unknown", solarImpact: "clear", productionImpactPercent: 0 };
    }

    // WMO 4677 weather code classification
    if (code === 0) return { label: "Clear sky", solarImpact: "clear", productionImpactPercent: 0 };
    if (code <= 3) return { label: "Partly cloudy", solarImpact: "cloudy", productionImpactPercent: 15 };

    // Fog / Haze / Dust
    if (code >= 4 && code <= 12) return { label: "Fog/Haze", solarImpact: "fog", productionImpactPercent: 40 };

    // Drizzle
    if (code >= 51 && code <= 57) return { label: "Drizzle", solarImpact: "rain", productionImpactPercent: 30 };

    // Rain
    if (code >= 61 && code <= 67) return { label: "Rain", solarImpact: "rain", productionImpactPercent: 50 };

    // Snow
    if (code >= 71 && code <= 77) return { label: "Snowfall", solarImpact: "snow", productionImpactPercent: 80 };

    // Showers
    if (code >= 80 && code <= 82) return { label: "Rain showers", solarImpact: "rain", productionImpactPercent: 45 };
    if (code >= 85 && code <= 86) return { label: "Snow showers", solarImpact: "snow", productionImpactPercent: 75 };

    // Thunderstorm
    if (code >= 95 && code <= 99) return { label: "Thunderstorm", solarImpact: "storm", productionImpactPercent: 70 };

    // Dust storm (code 30-35 in extended WMO)
    if (code >= 30 && code <= 35) return { label: "Dust storm", solarImpact: "dust", productionImpactPercent: 60 };

    // Fallback
    if (code >= 40 && code <= 49) return { label: "Fog", solarImpact: "fog", productionImpactPercent: 35 };

    return { label: `Weather code ${code}`, solarImpact: "cloudy", productionImpactPercent: 20 };
  }

  /**
   * Safely extracts a numeric value from a provider response, with fallback.
   */
  safeNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return fallback;
  }
}
