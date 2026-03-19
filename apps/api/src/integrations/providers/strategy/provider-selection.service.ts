import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MockOpenMeteoWeatherProvider } from "../adapters/mock-open-meteo-weather.provider";
import { MockOpenWeatherWeatherProvider } from "../adapters/mock-openweather-weather.provider";
import { WeatherProvider } from "../contracts/weather-provider.interface";

export type WeatherProviderKey = "open_meteo" | "openweather";

@Injectable()
export class ProviderSelectionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly openMeteoProvider: MockOpenMeteoWeatherProvider,
    private readonly openWeatherProvider: MockOpenWeatherWeatherProvider
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
}
