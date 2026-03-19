export type ProviderName = "PVGIS" | "OPEN_METEO" | "OPENWEATHER_ONECALL_3_0" | "OPENCAGE";

export interface ProviderRequestMeta {
  requestId?: string;
  timeoutMs?: number;
}

export interface ProviderHealthStatus {
  provider: ProviderName;
  available: boolean;
  checkedAt: string;
  details?: Record<string, unknown>;
}

export interface AdapterErrorPayload {
  provider: ProviderName;
  statusCode: number;
  message: string;
  retryable: boolean;
  raw?: unknown;
}
