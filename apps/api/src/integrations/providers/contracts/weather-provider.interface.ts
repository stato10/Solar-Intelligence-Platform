import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

export interface WeatherSnapshotInput {
  siteId: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface WeatherRiskAlert {
  riskType: string;
  severity: string;
  message: string;
  expectedStart: string;
  expectedEnd: string;
  sourceProvider: string;
}

export interface WeatherSnapshotOutput {
  siteId: string;
  generatedAt: string;
  source: string;
  temperature?: number;
  cloudCover?: number;
  windSpeed?: number;
  precipitation?: number;
  alerts: WeatherRiskAlert[];
}

export interface WeatherProvider {
  getHealth(meta?: ProviderRequestMeta): Promise<ProviderHealthStatus>;
  getSnapshot(
    input: WeatherSnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<WeatherSnapshotOutput>;
}
