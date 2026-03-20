import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EngineCalculateV1RequestDto,
  EngineCalculateV1Response,
  isEngineCalculateV1Response
} from "./dto/engine-calculate-v1.dto";

@Injectable()
export class EngineClientService {
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

  async calculateV1(payload: EngineCalculateV1RequestDto) {
    const timeoutMs = 10000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/calculate/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

      const normalized = this.normalizeLegacyRecommendations(data as EngineCalculateV1Response);
      return {
        connected: true,
        statusCode: response.status,
        engineBaseUrl: this.baseUrl,
        data: normalized
      };
    } catch (error) {
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

  private normalizeLegacyRecommendations(
    payload: EngineCalculateV1Response
  ): EngineCalculateV1Response {
    const recs = payload.optimization.recommendations as unknown[];
    const hasLegacyStrings = recs.every((item) => typeof item === "string");
    if (!hasLegacyStrings) {
      return payload;
    }

    const normalized = recs.map((item, index) => {
      const message = item as string;
      return {
        id: `rec-legacy-${payload.siteId}-${index + 1}`,
        type: "operational",
        title: message,
        message,
        severity: "moderate" as const,
        priority: 3,
        estimated_value: 0,
        valid_from: payload.generatedAt,
        valid_until: payload.generatedAt,
        source_module: "engine_legacy"
      };
    });

    return {
      ...payload,
      optimization: {
        ...payload.optimization,
        recommendations: normalized
      }
    };
  }
}
