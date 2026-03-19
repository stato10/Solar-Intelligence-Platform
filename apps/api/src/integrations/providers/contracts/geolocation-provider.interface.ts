import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

export interface GeolocationForwardInput {
  query: string;
  language?: string;
  countryCode?: string;
  limit?: number;
}

export interface GeolocationReverseInput {
  latitude: number;
  longitude: number;
  language?: string;
}

export interface GeolocationResult {
  formattedAddress: string;
  lat: number;
  lon: number;
  countryCode?: string;
  confidence?: number;
  timezone?: string;
  components?: Record<string, unknown>;
}

export interface GeolocationForwardOutput {
  query: string;
  generatedAt: string;
  source: string;
  results: GeolocationResult[];
}

export interface GeolocationReverseOutput {
  lat: number;
  lon: number;
  generatedAt: string;
  source: string;
  formattedAddress: string;
  countryCode?: string;
  timezone?: string;
  components?: Record<string, unknown>;
}

export interface GeolocationProvider {
  getHealth(meta?: ProviderRequestMeta): Promise<ProviderHealthStatus>;
  forward(
    input: GeolocationForwardInput,
    meta?: ProviderRequestMeta
  ): Promise<GeolocationForwardOutput>;
  reverse(
    input: GeolocationReverseInput,
    meta?: ProviderRequestMeta
  ): Promise<GeolocationReverseOutput>;
}
