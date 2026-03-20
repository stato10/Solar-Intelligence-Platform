import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

export interface AirQualitySnapshotInput {
  siteId: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface AirQualitySnapshotOutput {
  siteId: string;
  generatedAt: string;
  source: string;
  pm10?: number;
  pm25?: number;
  dustIndex?: number;
}

export interface AirQualityProvider {
  getHealth(meta?: ProviderRequestMeta): Promise<ProviderHealthStatus>;
  getSnapshot(
    input: AirQualitySnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<AirQualitySnapshotOutput>;
}
