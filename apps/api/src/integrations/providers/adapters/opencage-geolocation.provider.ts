import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  GeolocationForwardInput,
  GeolocationForwardOutput,
  GeolocationProvider,
  GeolocationResult,
  GeolocationReverseInput,
  GeolocationReverseOutput
} from "../contracts/geolocation-provider.interface";

interface OpenCageResult {
  formatted: string;
  confidence?: number;
  geometry: {
    lat: number;
    lng: number;
  };
  components?: Record<string, unknown> & {
    country_code?: string;
  };
  annotations?: {
    timezone?: {
      name?: string;
    };
  };
}

interface OpenCageResponse {
  status: {
    code: number;
    message: string;
  };
  results: OpenCageResult[];
}

@Injectable()
export class OpenCageGeolocationProvider
  extends HttpProviderBase
  implements GeolocationProvider
{
  constructor(private readonly configService: ConfigService) {
    super(
      "OPENCAGE",
      configService.get<string>("app.openCage.baseUrl") ?? "https://api.opencagedata.com"
    );
  }

  private get config() {
    return {
      apiKey: this.configService.get<string>("app.openCage.apiKey") ?? "",
      path: this.configService.get<string>("app.openCage.path") ?? "/geocode/v1/json",
      defaultLanguage:
        this.configService.get<string>("app.openCage.defaultLanguage") ?? "native",
      defaultLimit: Number(this.configService.get<number>("app.openCage.defaultLimit") ?? 5),
      noAnnotations:
        (this.configService.get<string>("app.openCage.noAnnotations") ?? "1") === "1",
      noRecord: (this.configService.get<string>("app.openCage.noRecord") ?? "1") === "1"
    };
  }

  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPENCAGE",
      available: Boolean(this.config.apiKey),
      checkedAt: new Date().toISOString(),
      details: {
        mode: "real",
        configured: Boolean(this.config.apiKey),
        baseUrl: this.baseUrl
      }
    };
  }

  async forward(
    input: GeolocationForwardInput,
    meta?: ProviderRequestMeta
  ): Promise<GeolocationForwardOutput> {
    if (!this.config.apiKey) {
      throw new ServiceUnavailableException("OpenCage API key is not configured");
    }

    const searchParams = new URLSearchParams({
      q: input.query,
      key: this.config.apiKey,
      language: input.language ?? this.config.defaultLanguage,
      limit: String(input.limit ?? this.config.defaultLimit)
    });

    if (input.countryCode) {
      searchParams.set("countrycode", input.countryCode);
    }
    // Annotations are always requested: they carry the IANA timezone, which
    // the product requires for accurate production-window calculations.
    if (this.config.noRecord) {
      searchParams.set("no_record", "1");
    }

    const response = await this.getJson<OpenCageResponse>(
      this.config.path,
      searchParams,
      meta
    );

    const results = response.results.map((item) => this.mapResult(item));
    return {
      query: input.query,
      generatedAt: new Date().toISOString(),
      source: "OPENCAGE",
      results
    };
  }

  async reverse(
    input: GeolocationReverseInput,
    meta?: ProviderRequestMeta
  ): Promise<GeolocationReverseOutput> {
    if (!this.config.apiKey) {
      throw new ServiceUnavailableException("OpenCage API key is not configured");
    }

    const searchParams = new URLSearchParams({
      q: `${input.latitude},${input.longitude}`,
      key: this.config.apiKey,
      language: input.language ?? this.config.defaultLanguage,
      limit: "1"
    });

    // Annotations carry the IANA timezone — always requested (see forward()).
    if (this.config.noRecord) {
      searchParams.set("no_record", "1");
    }

    const response = await this.getJson<OpenCageResponse>(
      this.config.path,
      searchParams,
      meta
    );

    const first = response.results[0];
    if (!first) {
      throw new ServiceUnavailableException("OpenCage reverse geocoding returned no results");
    }

    return {
      lat: input.latitude,
      lon: input.longitude,
      generatedAt: new Date().toISOString(),
      source: "OPENCAGE",
      formattedAddress: first.formatted,
      countryCode: first.components?.country_code,
      timezone: first.annotations?.timezone?.name,
      components: first.components
    };
  }

  private mapResult(item: OpenCageResult): GeolocationResult {
    return {
      formattedAddress: item.formatted,
      lat: item.geometry.lat,
      lon: item.geometry.lng,
      countryCode: item.components?.country_code,
      confidence: item.confidence,
      timezone: item.annotations?.timezone?.name,
      components: item.components
    };
  }
}
