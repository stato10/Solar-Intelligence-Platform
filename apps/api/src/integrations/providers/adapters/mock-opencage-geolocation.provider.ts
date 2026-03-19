import { Injectable } from "@nestjs/common";
import {
  GeolocationForwardInput,
  GeolocationForwardOutput,
  GeolocationProvider,
  GeolocationReverseInput,
  GeolocationReverseOutput
} from "../contracts/geolocation-provider.interface";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

@Injectable()
export class MockOpenCageGeolocationProvider implements GeolocationProvider {
  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "OPENCAGE",
      available: true,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "mock"
      }
    };
  }

  async forward(
    input: GeolocationForwardInput,
    _meta?: ProviderRequestMeta
  ): Promise<GeolocationForwardOutput> {
    return {
      query: input.query,
      generatedAt: new Date().toISOString(),
      source: "OPENCAGE_MOCK",
      results: [
        {
          formattedAddress: `${input.query} (mock normalized)`,
          lat: 32.0853,
          lon: 34.7818,
          countryCode: input.countryCode ?? "il",
          confidence: 8,
          timezone: "Asia/Jerusalem",
          components: {
            language: input.language ?? "native"
          }
        }
      ]
    };
  }

  async reverse(
    input: GeolocationReverseInput,
    _meta?: ProviderRequestMeta
  ): Promise<GeolocationReverseOutput> {
    return {
      lat: input.latitude,
      lon: input.longitude,
      generatedAt: new Date().toISOString(),
      source: "OPENCAGE_MOCK",
      formattedAddress: "Mock Reverse Address, Tel Aviv, Israel",
      countryCode: "il",
      timezone: "Asia/Jerusalem",
      components: {
        language: input.language ?? "native"
      }
    };
  }
}
