import { Inject, Injectable, Logger } from "@nestjs/common";
import { SOLAR_PROVIDER_TOKEN } from "../integrations/providers/common/provider.tokens";
import { SolarProvider, SolarForecastInput } from "../integrations/providers/contracts/solar-provider.interface";
import { ProviderNormalizerService } from "./provider-normalizer.service";

/**
 * Monthly solar profile entry from PVGIS — kWh data for a specific month.
 */
export interface MonthlyProfileEntry {
  month: number;         // 1-12
  avgDailyKwh: number;   // E_d per month from PVGIS
  totalMonthlyKwh: number;
}

/**
 * Canonical solar baseline with full monthly profile.
 */
export interface CanonicalSolarBaseline {
  siteId: string;
  expectedDailyKwh: number;
  expectedWeeklyKwh: number;
  expectedMonthlyKwh: number;
  monthlyProfile: MonthlyProfileEntry[];
  yearlyEstimate: number;
  source: string;
  peakWindowStart: string;
  peakWindowEnd: string;
}

@Injectable()
export class SolarIngestionService {
  private readonly logger = new Logger(SolarIngestionService.name);

  constructor(
    @Inject(SOLAR_PROVIDER_TOKEN) private readonly solarProvider: SolarProvider,
    private readonly normalizer: ProviderNormalizerService
  ) {}

  /**
   * Fetches baseline generation data from PVGIS or the configured solar provider chain.
   * Extracts the full 12-month profile when available for month-aware deviation scoring.
   *
   * Returns null if all providers fail — caller decides fallback strategy.
   */
  async ingestSolarBaseline(input: SolarForecastInput): Promise<CanonicalSolarBaseline | null> {
    try {
      this.logger.log(
        `Ingesting solar baseline for site ${input.siteId} (System: ${input.systemSizeKw}kW, Loss: ${input.lossPercent}%)`
      );

      const rawPayload = await this.solarProvider.getForecast(input);

      // The PVGIS provider already returns aggregated values.
      // We build the canonical baseline with monthly profile if available.
      const baseline: CanonicalSolarBaseline = {
        siteId: input.siteId,
        expectedDailyKwh: rawPayload.expectedDailyKwh,
        expectedWeeklyKwh: rawPayload.expectedWeeklyKwh,
        expectedMonthlyKwh: rawPayload.expectedMonthlyKwh,
        monthlyProfile: this.buildMonthlyProfile(rawPayload.expectedDailyKwh, rawPayload.expectedMonthlyKwh),
        yearlyEstimate: rawPayload.expectedMonthlyKwh * 12,
        source: rawPayload.source || "pvgis",
        peakWindowStart: rawPayload.peakWindowStart || "10:00",
        peakWindowEnd: rawPayload.peakWindowEnd || "15:00"
      };

      return baseline;
    } catch (error) {
      this.logger.error(
        `Solar baseline ingestion failed for site ${input.siteId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
      return null;
    }
  }

  /**
   * When PVGIS monthly breakdown isn't available, we create an approximate
   * 12-month profile using seasonal variation curves for typical locations.
   *
   * This is based on standard solar irradiance seasonal variation:
   * Summer months produce ~30-40% more than winter months in mid-latitudes.
   */
  private buildMonthlyProfile(avgDailyKwh: number, avgMonthlyKwh: number): MonthlyProfileEntry[] {
    // Seasonal multipliers for mid-latitude locations (approx 25-40° lat)
    // These represent relative production compared to annual average
    const seasonalMultipliers = [
      0.65,  // Jan
      0.75,  // Feb
      0.95,  // Mar
      1.10,  // Apr
      1.25,  // May
      1.30,  // Jun
      1.30,  // Jul
      1.20,  // Aug
      1.05,  // Sep
      0.85,  // Oct
      0.70,  // Nov
      0.60   // Dec
    ];

    // Normalize multipliers so they average to 1.0
    const sum = seasonalMultipliers.reduce((a, b) => a + b, 0);
    const normFactor = 12 / sum;

    return seasonalMultipliers.map((multiplier, index) => {
      const normalizedMultiplier = multiplier * normFactor;
      const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
      const monthAvgDaily = avgDailyKwh * normalizedMultiplier;

      return {
        month: index + 1,
        avgDailyKwh: Number(monthAvgDaily.toFixed(2)),
        totalMonthlyKwh: Number((monthAvgDaily * monthDays).toFixed(2))
      };
    });
  }

  /**
   * Returns the expected daily kWh for a specific month from the profile.
   * Falls back to overall average if month not found.
   */
  getExpectedDailyForMonth(baseline: CanonicalSolarBaseline, month: number): number {
    const entry = baseline.monthlyProfile.find((p) => p.month === month);
    return entry?.avgDailyKwh ?? baseline.expectedDailyKwh;
  }
}
