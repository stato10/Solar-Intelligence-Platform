import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EngineCalculateV1RequestDto,
  EngineCalculateV1Response,
  RawEngineCalculateV1Response,
  isEngineCalculateV1Response
} from "./dto/engine-calculate-v1.dto";

@Injectable()
export class EngineClientService {
  private readonly logger = new Logger(EngineClientService.name);

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl() {
    return this.configService.get<string>("app.engineBaseUrl") ?? "http://localhost:8000";
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        return {
          connected: false,
          statusCode: response.status,
          engineBaseUrl: this.baseUrl
        };
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return {
        connected: true,
        statusCode: response.status,
        engineBaseUrl: this.baseUrl,
        payload
      };
    } catch (error) {
      return {
        connected: false,
        statusCode: 503,
        engineBaseUrl: this.baseUrl,
        error: error instanceof Error ? error.message : "unknown error"
      };
    }
  }

  async calculateV1(
    payload: EngineCalculateV1RequestDto,
    options?: {
      correlationId?: string;
    }
  ) {
    const timeoutMs = 10000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      this.logger.log(
        JSON.stringify({
          event: "engine.request.start",
          correlationId: options?.correlationId,
          siteId: payload.siteId
        })
      );
      const response = await fetch(`${this.baseUrl}/calculate/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options?.correlationId
            ? {
                "x-correlation-id": options.correlationId
              }
            : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) {
        let raw: unknown;
        const text = await response.text();
        try {
          raw = text ? (JSON.parse(text) as unknown) : text;
        } catch {
          raw = text;
        }
        throw new ServiceUnavailableException({
          message: "Engine calculate request failed",
          statusCode: response.status,
          engineBaseUrl: this.baseUrl,
          raw
        });
      }

      const data = (await response.json()) as unknown;
      if (!isEngineCalculateV1Response(data)) {
        throw new ServiceUnavailableException({
          message: "Engine response contract mismatch",
          engineBaseUrl: this.baseUrl
        });
      }

      const normalized = this.normalizeEngineResponse(data as RawEngineCalculateV1Response);
      this.logger.log(
        JSON.stringify({
          event: "engine.request.finish",
          correlationId: options?.correlationId,
          siteId: payload.siteId,
          statusCode: response.status,
          durationMs: Date.now() - startedAt
        })
      );
      return {
        connected: true,
        statusCode: response.status,
        engineBaseUrl: this.baseUrl,
        data: normalized
      };
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: "engine.request.error",
          correlationId: options?.correlationId,
          siteId: payload.siteId,
          durationMs: Date.now() - startedAt,
          message: error instanceof Error ? error.message : "unknown error"
        })
      );
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableException({
          message: "Engine calculate request timed out",
          timeoutMs,
          engineBaseUrl: this.baseUrl
        });
      }
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException({
        message: "Engine calculate request failed",
        engineBaseUrl: this.baseUrl,
        error: error instanceof Error ? error.message : "unknown error"
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeEngineResponse(
    payload: RawEngineCalculateV1Response
  ): EngineCalculateV1Response {
    const recs = payload.optimization.recommendations as unknown[];
    const normalized = recs.map((item, index) => {
      if (typeof item === "string") {
        const message = item;
        return {
          id: `rec-legacy-${payload.siteId}-${index + 1}`,
          type: "operational",
          title: message,
          message,
          severity: "moderate" as const,
          priority: 3,
          estimatedValue: 0,
          validFrom: payload.generatedAt,
          validUntil: payload.generatedAt,
          sourceModule: "engine_legacy"
        };
      }

      const recommendation = item as Record<string, unknown>;
      return {
        id: String(recommendation.id),
        type: String(recommendation.type),
        title: String(recommendation.title),
        message: String(recommendation.message),
        severity: recommendation.severity as "low" | "moderate" | "high",
        priority: Number(recommendation.priority),
        estimatedValue: Number(recommendation.estimated_value),
        validFrom: String(recommendation.valid_from),
        validUntil: String(recommendation.valid_until),
        sourceModule: String(recommendation.source_module)
      };
    });

    return {
      siteId: payload.siteId,
      generatedAt: payload.generatedAt,
      source: payload.source,
      forecast: payload.forecast as EngineCalculateV1Response["forecast"],
      soiling: payload.soiling as EngineCalculateV1Response["soiling"],
      heat: payload.heat as EngineCalculateV1Response["heat"],
      risks: payload.risks as EngineCalculateV1Response["risks"],
      optimization: {
        ...payload.optimization,
        recommendations: normalized
      },
      financial: payload.financial as EngineCalculateV1Response["financial"],
      benchmark: {
        expectedProductionKwh: payload.benchmark.expected_production_kwh,
        actualProductionKwh: payload.benchmark.actual_production_kwh,
        expectedExportKwh: payload.benchmark.expected_export_kwh,
        actualExportKwh: payload.benchmark.actual_export_kwh,
        productionDeviationPercent: payload.benchmark.production_deviation_percent,
        exportDeviationPercent: payload.benchmark.export_deviation_percent,
        performanceStatus: payload.benchmark.performance_status,
        insight: payload.benchmark.insight
      },
      selfConsumption: {
        recommendedUsageWindow: {
          start: payload.self_consumption.recommended_usage_window.start,
          end: payload.self_consumption.recommended_usage_window.end
        },
        selfConsumptionScore: payload.self_consumption.self_consumption_score,
        estimatedSavingsIls: payload.self_consumption.estimated_savings_ils,
        actions: payload.self_consumption.actions
      }
    };
  }
}
