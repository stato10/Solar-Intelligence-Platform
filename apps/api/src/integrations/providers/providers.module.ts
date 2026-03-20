import { Module } from "@nestjs/common";
import { MockOpenCageGeolocationProvider } from "./adapters/mock-opencage-geolocation.provider";
import { MockPvgisSolarProvider } from "./adapters/mock-pvgis-solar.provider";
import { OpenMeteoWeatherProvider } from "./adapters/open-meteo-weather.provider";
import { OpenCageGeolocationProvider } from "./adapters/opencage-geolocation.provider";
import { OpenWeatherWeatherProvider } from "./adapters/openweather-weather.provider";
import { PvgisSolarProvider } from "./adapters/pvgis-solar.provider";
import {
  GEOLOCATION_PROVIDER_TOKEN,
  SOLAR_PROVIDER_TOKEN,
  WEATHER_PROVIDER_TOKEN
} from "./common/provider.tokens";
import { ProvidersController } from "./providers.controller";
import { GeolocationProviderOrchestratorService } from "./strategy/geolocation-provider-orchestrator.service";
import { ProviderSelectionService } from "./strategy/provider-selection.service";
import { SolarProviderOrchestratorService } from "./strategy/solar-provider-orchestrator.service";
import { WeatherProviderOrchestratorService } from "./strategy/weather-provider-orchestrator.service";

@Module({
  controllers: [ProvidersController],
  providers: [
    MockPvgisSolarProvider,
    PvgisSolarProvider,
    OpenMeteoWeatherProvider,
    OpenWeatherWeatherProvider,
    MockOpenCageGeolocationProvider,
    OpenCageGeolocationProvider,
    ProviderSelectionService,
    SolarProviderOrchestratorService,
    WeatherProviderOrchestratorService,
    GeolocationProviderOrchestratorService,
    {
      provide: SOLAR_PROVIDER_TOKEN,
      useExisting: SolarProviderOrchestratorService
    },
    {
      provide: WEATHER_PROVIDER_TOKEN,
      useExisting: WeatherProviderOrchestratorService
    },
    {
      provide: GEOLOCATION_PROVIDER_TOKEN,
      useExisting: GeolocationProviderOrchestratorService
    }
  ],
  exports: [
    SOLAR_PROVIDER_TOKEN,
    WEATHER_PROVIDER_TOKEN,
    GEOLOCATION_PROVIDER_TOKEN,
    ProviderSelectionService,
    SolarProviderOrchestratorService,
    WeatherProviderOrchestratorService,
    GeolocationProviderOrchestratorService
  ]
})
export class ProvidersModule {}
