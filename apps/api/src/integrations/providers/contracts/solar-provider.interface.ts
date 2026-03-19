import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

export interface SolarForecastInput {
  siteId: string;
  latitude: number;
  longitude: number;
  systemSizeKw: number;
  lossPercent: number;
}

export interface SolarForecastOutput {
  siteId: string;
  generatedAt: string;
  source: string;
  expectedDailyKwh: number;
  expectedWeeklyKwh: number;
  expectedMonthlyKwh: number;
  peakWindowStart: string;
  peakWindowEnd: string;
}

export interface SolarProvider {
  getHealth(meta?: ProviderRequestMeta): Promise<ProviderHealthStatus>;
  getForecast(
    input: SolarForecastInput,
    meta?: ProviderRequestMeta
  ): Promise<SolarForecastOutput>;
}
