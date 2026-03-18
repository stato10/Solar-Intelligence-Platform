import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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
}
