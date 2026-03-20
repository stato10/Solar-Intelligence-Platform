import { Inject, Injectable } from "@nestjs/common";
import { EngineClientService } from "../integrations/engine/engine-client.service";
import {
  SOLAR_PROVIDER_TOKEN,
  WEATHER_PROVIDER_TOKEN
} from "../integrations/providers/common/provider.tokens";
import { SolarProvider } from "../integrations/providers/contracts/solar-provider.interface";
import { WeatherProvider } from "../integrations/providers/contracts/weather-provider.interface";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";

@Injectable()
export class DashboardService {
  constructor(
    @Inject(SOLAR_PROVIDER_TOKEN) private readonly solarProvider: SolarProvider,
    @Inject(WEATHER_PROVIDER_TOKEN) private readonly weatherProvider: WeatherProvider,
    private readonly engineClientService: EngineClientService
  ) {}

  async aggregate(payload: AggregateDashboardRequestDto) {
    const generatedAt = payload.generatedAt ?? new Date().toISOString();
    const lossPercent = payload.lossPercent ?? 14;

    const [weather, solar] = await Promise.all([
      this.weatherProvider.getSnapshot({
        siteId: payload.siteId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        timezone: payload.timezone
      }),
      this.solarProvider.getForecast({
        siteId: payload.siteId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        systemSizeKw: payload.systemSizeKw,
        lossPercent
      })
    ]);

    const engine = await this.engineClientService.calculateV1({
      siteId: payload.siteId,
      generatedAt,
      weather: {
        temperature: weather.temperature,
        cloudCover: weather.cloudCover,
        windSpeed: weather.windSpeed,
        precipitation: weather.precipitation
      },
      solar: {
        expectedDailyKwh: solar.expectedDailyKwh,
        expectedWeeklyKwh: solar.expectedWeeklyKwh,
        expectedMonthlyKwh: solar.expectedMonthlyKwh
      },
      tariff: payload.tariff
    });

    const engineData = engine.data;
    return {
      siteId: payload.siteId,
      generatedAt,
      source: "DASHBOARD_AGGREGATED_V1",
      forecast: engineData.forecast,
      soiling: engineData.soiling,
      heat: engineData.heat,
      risks: engineData.risks,
      optimization: engineData.optimization,
      financial: engineData.financial,
      providers: {
        weather: weather.source,
        solar: solar.source,
        engine: engine.engineBaseUrl
      }
    };
  }
}
