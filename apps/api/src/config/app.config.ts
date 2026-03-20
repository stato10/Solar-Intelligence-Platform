import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.API_PORT ?? 3000),
  apiPrefix: "api/v1",
  engineBaseUrl: process.env.ENGINE_BASE_URL ?? "http://localhost:8000",
  solarProviderMode: process.env.SOLAR_PROVIDER_MODE ?? "auto",
  pvgis: {
    baseUrl: process.env.PVGIS_BASE_URL ?? "https://re.jrc.ec.europa.eu/api/v5_3",
    fallbackBaseUrl: process.env.PVGIS_FALLBACK_BASE_URL ?? "https://re.jrc.ec.europa.eu/api/v5_2",
    outputFormat: process.env.PVGIS_OUTPUT_FORMAT ?? "json",
    pvcalcPath: process.env.PVGIS_PVCALC_PATH ?? "/PVcalc",
    pvTechChoice: process.env.PVGIS_PVTECHCHOICE ?? "crystSi",
    mountingPlace: process.env.PVGIS_MOUNTINGPLACE ?? "free"
  },
  weatherPrimaryProvider: process.env.WEATHER_PRIMARY_PROVIDER ?? "open_meteo",
  openMeteo: {
    baseUrl: process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com",
    forecastDays: Number(process.env.OPEN_METEO_FORECAST_DAYS ?? 7),
    timezone: process.env.OPEN_METEO_TIMEZONE ?? "auto"
  },
  openWeather: {
    baseUrl: process.env.OPENWEATHER_BASE_URL ?? "https://api.openweathermap.org",
    apiKey: process.env.OPENWEATHER_API_KEY ?? "",
    units: process.env.OPENWEATHER_UNITS ?? "metric",
    lang: process.env.OPENWEATHER_LANG ?? "en",
    exclude: process.env.OPENWEATHER_EXCLUDE ?? "minutely",
    oneCallPath: process.env.OPENWEATHER_ONECALL_PATH ?? "/data/3.0/onecall"
  },
  geolocationProviderMode: process.env.GEOLOCATION_PROVIDER_MODE ?? "auto",
  openCage: {
    baseUrl: process.env.OPENCAGE_BASE_URL ?? "https://api.opencagedata.com",
    apiKey: process.env.OPENCAGE_API_KEY ?? "",
    path: process.env.OPENCAGE_GEOCODE_PATH ?? "/geocode/v1/json",
    defaultLanguage: process.env.OPENCAGE_DEFAULT_LANGUAGE ?? "native",
    defaultLimit: Number(process.env.OPENCAGE_DEFAULT_LIMIT ?? 5),
    noAnnotations: process.env.OPENCAGE_NO_ANNOTATIONS ?? "1",
    noRecord: process.env.OPENCAGE_NO_RECORD ?? "1"
  }
}));
