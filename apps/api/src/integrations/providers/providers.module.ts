import { Module } from "@nestjs/common";
import { MockOpenCageGeolocationProvider } from "./adapters/mock-opencage-geolocation.provider";
import { MockOpenMeteoWeatherProvider } from "./adapters/mock-open-meteo-weather.provider";
import { MockOpenWeatherWeatherProvider } from "./adapters/mock-openweather-weather.provider";
import { MockPvgisSolarProvider } from "./adapters/mock-pvgis-solar.provider";
import {
  GEOLOCATION_PROVIDER_TOKEN,
  SOLAR_PROVIDER_TOKEN,
  WEATHER_PROVIDER_TOKEN
} from "./common/provider.tokens";
import { ProvidersController } from "./providers.controller";
import { ProviderSelectionService } from "./strategy/provider-selection.service";
import { WeatherProviderOrchestratorService } from "./strategy/weather-provider-orchestrator.service";

@Module({
  controllers: [ProvidersController],
  providers: [
    MockPvgisSolarProvider,
    MockOpenMeteoWeatherProvider,
    MockOpenWeatherWeatherProvider,
    MockOpenCageGeolocationProvider,
    ProviderSelectionService,
    WeatherProviderOrchestratorService,
    {
      provide: SOLAR_PROVIDER_TOKEN,
      useExisting: MockPvgisSolarProvider
    },
    {
      provide: WEATHER_PROVIDER_TOKEN,
      useExisting: WeatherProviderOrchestratorService
    },
    {
      provide: GEOLOCATION_PROVIDER_TOKEN,
      useExisting: MockOpenCageGeolocationProvider
    }
  ],
  exports: [
    SOLAR_PROVIDER_TOKEN,
    WEATHER_PROVIDER_TOKEN,
    GEOLOCATION_PROVIDER_TOKEN,
    ProviderSelectionService,
    WeatherProviderOrchestratorService
  ]
})
export class ProvidersModule {}
