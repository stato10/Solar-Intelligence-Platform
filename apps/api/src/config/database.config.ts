import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  url:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/solar_intelligence",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  name: process.env.POSTGRES_DB ?? "solar_intelligence",
  user: process.env.POSTGRES_USER ?? "postgres"
}));
