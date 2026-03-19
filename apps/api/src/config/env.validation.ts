type EnvInput = Record<string, unknown>;

function ensureNumber(name: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a valid number`);
  }
}

export function validateEnv(config: EnvInput) {
  ensureNumber("API_PORT", config.API_PORT);
  ensureNumber("DB_PORT", config.DB_PORT);
  ensureNumber("OPENCAGE_DEFAULT_LIMIT", config.OPENCAGE_DEFAULT_LIMIT);

  if (
    config.WEATHER_PRIMARY_PROVIDER !== undefined &&
    config.WEATHER_PRIMARY_PROVIDER !== "open_meteo" &&
    config.WEATHER_PRIMARY_PROVIDER !== "openweather"
  ) {
    throw new Error("WEATHER_PRIMARY_PROVIDER must be open_meteo or openweather");
  }

  if (
    config.GEOLOCATION_PROVIDER_MODE !== undefined &&
    config.GEOLOCATION_PROVIDER_MODE !== "auto" &&
    config.GEOLOCATION_PROVIDER_MODE !== "real" &&
    config.GEOLOCATION_PROVIDER_MODE !== "mock"
  ) {
    throw new Error("GEOLOCATION_PROVIDER_MODE must be auto, real, or mock");
  }

  return config;
}
