import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MockOpenCageGeolocationProvider } from "../adapters/mock-opencage-geolocation.provider";
import { OpenMeteoWeatherProvider } from "../adapters/open-meteo-weather.provider";
import { OpenCageGeolocationProvider } from "../adapters/opencage-geolocation.provider";
import { OpenWeatherWeatherProvider } from "../adapters/openweather-weather.provider";
import { GeolocationProvider } from "../contracts/geolocation-provider.interface";
import { WeatherProvider } from "../contracts/weather-provider.interface";

export type WeatherProviderKey = "open_meteo" | "openweather";
export type GeolocationProviderKey = "opencage" | "mock";

@Injectable()
export class ProviderSelectionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly openMeteoProvider: OpenMeteoWeatherProvider,
    private readonly openWeatherProvider: OpenWeatherWeatherProvider,
    private readonly openCageProvider: OpenCageGeolocationProvider,
    private readonly mockOpenCageProvider: MockOpenCageGeolocationProvider
  ) {}

  getPrimaryWeatherProviderKey(): WeatherProviderKey {
    const configured =
      this.configService
        .get<string>("app.weatherPrimaryProvider")
        ?.trim()
        .toLowerCase() ?? "open_meteo";

    return configured === "openweather" ? "openweather" : "open_meteo";
  }

  getWeatherProviderChain(): WeatherProviderKey[] {
    const primary = this.getPrimaryWeatherProviderKey();
    return primary === "open_meteo"
      ? ["open_meteo", "openweather"]
      : ["openweather", "open_meteo"];
  }

  resolveWeatherProvider(key: WeatherProviderKey): WeatherProvider {
    return key === "openweather" ? this.openWeatherProvider : this.openMeteoProvider;
  }

  getGeolocationProviderChain(): GeolocationProviderKey[] {
    const mode =
      this.configService
        .get<string>("app.geolocationProviderMode")
        ?.trim()
        .toLowerCase() ?? "auto";

    if (mode === "mock") {
      return ["mock"];
    }
    if (mode === "real") {
      return ["opencage"];
    }
    return ["opencage", "mock"];
  }

  resolveGeolocationProvider(key: GeolocationProviderKey): GeolocationProvider {
    return key === "opencage" ? this.openCageProvider : this.mockOpenCageProvider;
  }
}
