import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { OpenMeteoWeatherProvider } from "./adapters/open-meteo-weather.provider";
import { OpenWeatherWeatherProvider } from "./adapters/openweather-weather.provider";
import { GEOLOCATION_PROVIDER_TOKEN, SOLAR_PROVIDER_TOKEN, WEATHER_PROVIDER_TOKEN } from "./common/provider.tokens";
import {
  GeolocationForwardInput,
  GeolocationProvider,
  GeolocationReverseInput
} from "./contracts/geolocation-provider.interface";
import { SolarForecastInput, SolarProvider } from "./contracts/solar-provider.interface";
import { WeatherProvider, WeatherSnapshotInput } from "./contracts/weather-provider.interface";
import { ProviderSelectionService } from "./strategy/provider-selection.service";

@Controller("integrations/providers")
export class ProvidersController {
  constructor(
    @Inject(SOLAR_PROVIDER_TOKEN) private readonly solarProvider: SolarProvider,
    @Inject(WEATHER_PROVIDER_TOKEN) private readonly weatherProvider: WeatherProvider,
    @Inject(GEOLOCATION_PROVIDER_TOKEN)
    private readonly geolocationProvider: GeolocationProvider,
    private readonly openWeatherProvider: OpenWeatherWeatherProvider,
    private readonly openMeteoProvider: OpenMeteoWeatherProvider,
    private readonly providerSelectionService: ProviderSelectionService
  ) {}

  @Get("health")
  async health() {
    const [solar, weatherDefault, openMeteo, openWeather, geolocation] = await Promise.all([
      this.solarProvider.getHealth(),
      this.weatherProvider.getHealth(),
      this.openMeteoProvider.getHealth(),
      this.openWeatherProvider.getHealth(),
      this.geolocationProvider.getHealth()
    ]);

    return {
      success: true,
      data: {
        solar,
        weather: {
          default: weatherDefault,
          openMeteo,
          openWeather
        },
        geolocation
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get("strategy")
  strategy() {
    const weatherChain = this.providerSelectionService.getWeatherProviderChain();
    const geolocationChain = this.providerSelectionService.getGeolocationProviderChain();
    return {
      success: true,
      data: {
        weather: {
          primary: weatherChain[0],
          fallback: weatherChain[1] ?? null,
          chain: weatherChain
        },
        geolocation: {
          primary: geolocationChain[0],
          fallback: geolocationChain[1] ?? null,
          chain: geolocationChain
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post("solar/forecast")
  async mockSolarForecast(@Body() payload: SolarForecastInput) {
    const data = await this.solarProvider.getForecast(payload);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post("weather/snapshot")
  async mockWeatherSnapshot(@Body() payload: WeatherSnapshotInput) {
    const data = await this.weatherProvider.getSnapshot(payload);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post("weather/snapshot/openweather")
  async mockOpenWeatherSnapshot(@Body() payload: WeatherSnapshotInput) {
    const data = await this.openWeatherProvider.getSnapshot(payload);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get("geolocation/forward")
  async mockForward(@Query() query: GeolocationForwardInput) {
    const data = await this.geolocationProvider.forward(query);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get("geolocation/reverse")
  async mockReverse(@Query() query: GeolocationReverseInput) {
    const data = await this.geolocationProvider.reverse({
      ...query,
      latitude: Number(query.latitude),
      longitude: Number(query.longitude)
    });
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
