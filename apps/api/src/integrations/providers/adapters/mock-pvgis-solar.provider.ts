import { Injectable } from "@nestjs/common";
import {
  SolarForecastInput,
  SolarForecastOutput,
  SolarProvider
} from "../contracts/solar-provider.interface";
import { ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";

@Injectable()
export class MockPvgisSolarProvider implements SolarProvider {
  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "PVGIS",
      available: true,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "mock"
      }
    };
  }

  async getForecast(
    input: SolarForecastInput,
    _meta?: ProviderRequestMeta
  ): Promise<SolarForecastOutput> {
    const expectedDailyKwh = Number((input.systemSizeKw * (1 - input.lossPercent / 100) * 4.2).toFixed(2));
    const expectedWeeklyKwh = Number((expectedDailyKwh * 7).toFixed(2));
    const expectedMonthlyKwh = Number((expectedDailyKwh * 30).toFixed(2));

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: "PVGIS_MOCK",
      expectedDailyKwh,
      expectedWeeklyKwh,
      expectedMonthlyKwh,
      peakWindowStart: "10:00",
      peakWindowEnd: "15:00"
    };
  }
}
