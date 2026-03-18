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

  return config;
}
