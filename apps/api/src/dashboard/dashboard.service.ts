import { Injectable, Logger } from "@nestjs/common";
import { EngineClientService } from "../integrations/engine/engine-client.service";
import { AirQualityIngestionService } from "../data-ingestion/air-quality-ingestion.service";
import { FreshnessPolicyService } from "../data-ingestion/freshness-policy.service";
import { SnapshotWriterService } from "../data-ingestion/snapshot-writer.service";
import { WeatherIngestionService } from "../data-ingestion/weather-ingestion.service";
import { SolarIngestionService } from "../data-ingestion/solar-ingestion.service";
import {
  IntelligenceEvaluatorService,
  IntelligenceInput
} from "../intelligence";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly engineClientService: EngineClientService,
    private readonly snapshotWriter: SnapshotWriterService,
    private readonly freshnessPolicy: FreshnessPolicyService,
    private readonly weatherIngestion: WeatherIngestionService,
    private readonly solarIngestion: SolarIngestionService,
    private readonly airQualityIngestion: AirQualityIngestionService,
    private readonly intelligence: IntelligenceEvaluatorService
  ) {}

  async aggregate(payload: AggregateDashboardRequestDto, correlationId?: string) {
    const generatedAt = payload.generatedAt ?? new Date().toISOString();
    const lossPercent = payload.lossPercent ?? 14;
    const startedAt = Date.now();

    // ─── Step 1: Check for fresh cached snapshot ──────────────────────
    const existingSnapshot = await this.snapshotWriter.getCurrentSnapshot(payload.siteId);

    if (existingSnapshot && this.freshnessPolicy.isFresh(existingSnapshot.fetchedAt, "weather_current")) {
      const cachedAggregate = existingSnapshot.aggregateJson as Record<string, unknown> | null;

      if (cachedAggregate) {
        this.logger.log(
          JSON.stringify({
            event: "dashboard.aggregate.cache_hit",
            correlationId,
            siteId: payload.siteId,
            snapshotAge: Date.now() - existingSnapshot.fetchedAt.getTime(),
            durationMs: Date.now() - startedAt
          })
        );
        return this.withIntelligence(cachedAggregate);
      }
    }

    // ─── Step 2: Fetch fresh data from providers ──────────────────────
    try {
      const [weatherSnapshot, solarBaseline, airQualitySnapshot] = await Promise.all([
        this.weatherIngestion.ingestWeather({
          siteId: payload.siteId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timezone: payload.timezone
        }),
        this.solarIngestion.ingestSolarBaseline({
          siteId: payload.siteId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          systemSizeKw: payload.systemSizeKw,
          lossPercent,
          tilt: payload.tilt,
          azimuth: payload.azimuth
        }),
        this.airQualityIngestion.ingestAirQuality({
          siteId: payload.siteId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timezone: payload.timezone
        })
      ]);

      // If both ingestions failed, fall back to stale snapshot
      if (!weatherSnapshot && !solarBaseline) {
        return this.handleTotalIngestionFailure(payload.siteId, existingSnapshot, correlationId, startedAt);
      }

      // Use ingested data or safe fallbacks for engine call
      const weatherForEngine = weatherSnapshot
        ? {
            temperature: weatherSnapshot.current.temperature,
            cloudCover: weatherSnapshot.current.cloudCover,
            windSpeed: weatherSnapshot.current.windSpeed,
            precipitation: weatherSnapshot.current.precipitation,
            ghi: weatherSnapshot.current.ghi
          }
        : {
            temperature: 25,
            cloudCover: 50,
            windSpeed: 3,
            precipitation: 0,
            ghi: 1000
          };

      const solarForEngine = solarBaseline
        ? {
            expectedDailyKwh: solarBaseline.expectedDailyKwh,
            expectedWeeklyKwh: solarBaseline.expectedWeeklyKwh,
            expectedMonthlyKwh: solarBaseline.expectedMonthlyKwh
          }
        : {
            expectedDailyKwh: payload.systemSizeKw * 4 * (1 - lossPercent / 100),
            expectedWeeklyKwh: payload.systemSizeKw * 4 * (1 - lossPercent / 100) * 7,
            expectedMonthlyKwh: payload.systemSizeKw * 4 * (1 - lossPercent / 100) * 30
          };

      // ─── Step 3: Call calculation engine ───────────────────────────
      const engine = await this.engineClientService.calculateV1(
        {
          siteId: payload.siteId,
          generatedAt,
          weather: weatherForEngine,
          solar: solarForEngine,
          tariff: payload.tariff
        },
        { correlationId }
      );

      const engineData = engine.data;

      // ─── Step 4: Build response (SAME shape as before) ────────────
      const baseResponse = {
        siteId: payload.siteId,
        generatedAt,
        source: "DASHBOARD_AGGREGATED_V1",
        forecast: engineData.forecast,
        soiling: engineData.soiling,
        heat: engineData.heat,
        risks: engineData.risks,
        optimization: engineData.optimization,
        financial: engineData.financial,
        benchmark: engineData.benchmark,
        selfConsumption: engineData.selfConsumption,
        providers: {
          weather: weatherSnapshot?.source ?? "fallback",
          solar: solarBaseline?.source ?? "fallback",
          engine: engine.engineBaseUrl
        },
        // Echo the tariff used for the calculation so clients can render
        // money values in the user's actual currency without a second fetch.
        tariff: {
          currency: payload.tariff?.currency ?? "ILS",
          importRate: payload.tariff?.importRate ?? 0.6,
          exportRate: payload.tariff?.exportRate ?? 0.2
        }
      };

      // ─── Step 4b: Attach Intelligence Layer (additive, non-breaking) ────
      const response = this.withIntelligence({
        ...baseResponse,
        engineContext: {
          ghi: weatherForEngine.ghi ?? 1000,
          cloudCover: weatherForEngine.cloudCover,
          temperature: weatherForEngine.temperature,
          // Live Open-Meteo Air Quality pm10; conservative fallback when unavailable
          pm10: airQualitySnapshot?.pm10 ?? 45,
          // Real trailing dry-spell length from weather history; fallback when unavailable
          daysWithoutRain: weatherSnapshot?.daysWithoutRain ?? 5
        },
        engineTariff: {
          importRate: payload.tariff?.importRate ?? 0.6,
          exportRate: payload.tariff?.exportRate ?? 0.2
        }
      });

      // ─── Step 5: Persist to database (fire-and-forget) ────────────
      this.persistSnapshot(
        payload.siteId,
        weatherSnapshot,
        solarBaseline,
        response,
        engineData
      ).catch((err) => {
        this.logger.error(
          `Failed to persist snapshot for site ${payload.siteId}: ${
            err instanceof Error ? err.message : "unknown"
          }`
        );
      });

      this.logger.log(
        JSON.stringify({
          event: "dashboard.aggregate.fresh_fetch",
          correlationId,
          siteId: payload.siteId,
          weatherProvider: weatherSnapshot?.source ?? "fallback",
          solarProvider: solarBaseline?.source ?? "fallback",
          durationMs: Date.now() - startedAt
        })
      );

      return response;
    } catch (error) {
      // ─── Step 6: Total failure fallback to stale snapshot ──────────
      return this.handleTotalIngestionFailure(payload.siteId, existingSnapshot, correlationId, startedAt, error);
    }
  }

  /**
   * When everything fails (providers + engine), return stale snapshot data
   * rather than throwing a 500 error. Dashboard uptime > data freshness.
   */
  private handleTotalIngestionFailure(
    siteId: string,
    existingSnapshot: any,
    correlationId: string | undefined,
    startedAt: number,
    error?: unknown
  ) {
    if (existingSnapshot?.aggregateJson) {
      this.logger.warn(
        JSON.stringify({
          event: "dashboard.aggregate.stale_fallback",
          correlationId,
          siteId,
          snapshotAge: Date.now() - existingSnapshot.fetchedAt.getTime(),
          durationMs: Date.now() - startedAt,
          reason: error instanceof Error ? error.message : "ingestion_failed"
        })
      );
      return this.withIntelligence(existingSnapshot.aggregateJson);
    }

    // No snapshot at all — this is a truly new site with no data
    this.logger.error(
      JSON.stringify({
        event: "dashboard.aggregate.total_failure",
        correlationId,
        siteId,
        durationMs: Date.now() - startedAt,
        reason: error instanceof Error ? error.message : "no_snapshot_available"
      })
    );

    // Re-throw so the controller returns a proper error
    if (error instanceof Error) throw error;
    throw new Error(`Dashboard aggregate failed for site ${siteId} — no cached data available`);
  }

  /**
   * Persists weather, solar, and aggregate data to the snapshot tables.
   * Also extracts benchmark data to create/update the daily summary.
   * Runs as fire-and-forget to not block the response.
   */
  private async persistSnapshot(
    siteId: string,
    weatherSnapshot: any,
    solarBaseline: any,
    aggregateResponse: any,
    engineData: any
  ) {
    // Stateless aggregate calls may reference site ids that are not persisted
    // (e.g. anonymous demo payloads) — skip persistence instead of violating FKs.
    const siteExists = await this.snapshotWriter.siteExists(siteId);
    if (!siteExists) {
      this.logger.debug(`Skipping snapshot persistence for unknown site ${siteId}`);
      return;
    }

    // Save current snapshot
    await this.snapshotWriter.saveCurrentSnapshot({
      siteId,
      weatherJson: weatherSnapshot ?? {},
      solarJson: solarBaseline ?? {},
      aggregateJson: aggregateResponse
    });

    // Extract benchmark data for daily summary logging
    const benchmark = engineData.benchmark;
    const soiling = engineData.soiling;
    const heat = engineData.heat;
    const financial = engineData.financial;

    if (benchmark) {
      await this.snapshotWriter.saveDailySummary({
        siteId,
        date: new Date(),
        expectedKwh: benchmark.expectedProductionKwh ?? 0,
        actualKwh: benchmark.actualProductionKwh ?? 0,
        deviationPercent: benchmark.productionDeviationPercent ?? 0,
        soilingScore: soiling?.score,
        heatScore: heat?.score,
        dailySavings: financial?.dailyEstimatedSavings
      });
    }
  }

  /**
   * Appends the Intelligence Layer output to an aggregate response.
   *
   * Non-breaking: never throws, skips when the payload is missing the
   * required fields, and preserves an already-present `intelligence`
   * block on cached snapshots to avoid recompute.
   */
  private withIntelligence<T extends Record<string, unknown>>(response: T): T {
    if (!response || typeof response !== "object") return response;
    if ((response as { intelligence?: unknown }).intelligence) return response;

    if (!this.isIntelligenceInput(response)) return response;

    try {
      const intelligence = this.intelligence.evaluate(response);
      return { ...response, intelligence };
    } catch (error) {
      this.logger.warn(
        `Intelligence evaluation failed: ${error instanceof Error ? error.message : "unknown"}`
      );
      return response;
    }
  }

  private isIntelligenceInput(value: unknown): value is IntelligenceInput {
    if (!value || typeof value !== "object") return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.siteId === "string" &&
      typeof v.generatedAt === "string" &&
      !!v.forecast &&
      !!v.soiling &&
      !!v.heat &&
      !!v.risks &&
      !!v.optimization &&
      !!v.financial &&
      !!v.benchmark &&
      !!v.selfConsumption
    );
  }
}
