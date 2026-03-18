import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.API_PORT ?? 3000),
  apiPrefix: "api/v1",
  engineBaseUrl: process.env.ENGINE_BASE_URL ?? "http://localhost:8000"
}));
