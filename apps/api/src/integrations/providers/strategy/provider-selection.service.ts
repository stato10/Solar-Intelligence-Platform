import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MockOpenCageGeolocationProvider } from "../adapters/mock-opencage-geolocation.provider";
import { MockPvgisSolarProvider } from "../adapters/mock-pvgis-solar.provider";
import { OpenMeteoWeatherProvider } from "../adapters/open-meteo-weather.provider";
import { OpenCageGeolocationProvider } from "../adapters/opencage-geolocation.provider";
import { OpenWeatherWeatherProvider } from "../adapters/openweather-weather.provider";
import { PvgisSolarProvider } from "../adapters/pvgis-solar.provider";
import { GeolocationProvider } from "../contracts/geolocation-provider.interface";
import { SolarProvider } from "../contracts/solar-provider.interface";
import { WeatherProvider } from "../contracts/weather-provider.interface";

export type WeatherProviderKey = "open_meteo" | "openweather";
export type GeolocationProviderKey = "opencage" | "mock";
export type SolarProviderKey = "pvgis" | "mock";

@Injectable()
export class ProviderSelectionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pvgisSolarProvider: PvgisSolarProvider,
    private readonly mockPvgisSolarProvider: MockPvgisSolarProvider,
    private readonly openMeteoProvider: OpenMeteoWeatherProvider,
    private readonly openWeatherProvider: OpenWeatherWeatherProvider,
    private readonly openCageProvider: OpenCageGeolocationProvider,
    private readonly mockOpenCageProvider: MockOpenCageGeolocationProvider
  ) {}

  getSolarProviderChain(): SolarProviderKey[] {
    const mode =
      this.configService
        .get<string>("app.solarProviderMode")
        ?.trim()
        .toLowerCase() ?? "auto";

    if (mode === "mock") {
      return ["mock"];
    }
    if (mode === "real") {
      return ["pvgis"];
    }
    return ["pvgis", "mock"];
  }

  resolveSolarProvider(key: SolarProviderKey): SolarProvider {
    return key === "pvgis" ? this.pvgisSolarProvider : this.mockPvgisSolarProvider;
  }

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
