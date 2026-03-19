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

  if (
    config.WEATHER_PRIMARY_PROVIDER !== undefined &&
    config.WEATHER_PRIMARY_PROVIDER !== "open_meteo" &&
    config.WEATHER_PRIMARY_PROVIDER !== "openweather"
  ) {
    throw new Error("WEATHER_PRIMARY_PROVIDER must be open_meteo or openweather");
  }

  return config;
}
