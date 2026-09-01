import { Injectable, Logger } from "@nestjs/common";
import {
  ConnectorCredentials,
  ConnectorVerifyResult,
  IntervalReading,
  InverterConnector
} from "./inverter-connector.interface";

interface SolarEdgeEnergyValue {
  date: string; // "2026-09-01 11:15:00" in the site's local time
  value: number | null; // Wh for the interval
}

interface SolarEdgeEnergyResponse {
  energy?: {
    timeUnit?: string;
    unit?: string;
    values?: SolarEdgeEnergyValue[];
  };
}

interface SolarEdgeDetailsResponse {
  details?: { id?: number; name?: string; status?: string };
}

/**
 * SolarEdge Monitoring API adapter.
 * Docs: https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf
 *
 * Rate limits: 300 requests/day per site token — the sync scheduler runs
 * every 15 minutes (96/day) which stays comfortably under it.
 */
@Injectable()
export class SolarEdgeConnector implements InverterConnector {
  readonly vendor = "solaredge" as const;

  private readonly logger = new Logger(SolarEdgeConnector.name);
  private readonly baseUrl =
    process.env.SOLAREDGE_API_BASE_URL ?? "https://monitoringapi.solaredge.com";

  async verify(credentials: ConnectorCredentials): Promise<ConnectorVerifyResult> {
    if (!credentials.externalSystemId) {
      return { ok: false, error: "SolarEdge requires the site id from your monitoring portal." };
    }
    try {
      const url = `${this.baseUrl}/site/${encodeURIComponent(credentials.externalSystemId)}/details?api_key=${encodeURIComponent(credentials.apiKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.status === 403 || res.status === 401) {
        return { ok: false, error: "SolarEdge rejected the API key." };
      }
      if (!res.ok) {
        return { ok: false, error: `SolarEdge responded with HTTP ${res.status}.` };
      }
      const body = (await res.json()) as SolarEdgeDetailsResponse;
      return { ok: true, systemName: body.details?.name };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.warn(`SolarEdge verify failed: ${message}`);
      return { ok: false, error: `Could not reach SolarEdge: ${message}` };
    }
  }

  async fetchReadings(
    credentials: ConnectorCredentials,
    since: Date,
    until: Date
  ): Promise<IntervalReading[]> {
    if (!credentials.externalSystemId) return [];
    const params = new URLSearchParams({
      api_key: credentials.apiKey,
      timeUnit: "QUARTER_OF_AN_HOUR",
      startTime: this.formatLocal(since),
      endTime: this.formatLocal(until)
    });
    const url = `${this.baseUrl}/site/${encodeURIComponent(credentials.externalSystemId)}/energy?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      throw new Error(`SolarEdge energy endpoint returned HTTP ${res.status}`);
    }
    const body = (await res.json()) as SolarEdgeEnergyResponse;
    const values = body.energy?.values ?? [];
    return values
      .filter((v) => v.value !== null && Number.isFinite(v.value))
      .map((v) => ({
        // SolarEdge returns naive local timestamps; treat as UTC for storage
        // consistency (per-site timezone correction happens at display time).
        timestamp: new Date(v.date.replace(" ", "T") + "Z"),
        productionWh: v.value as number,
        intervalMinutes: 15
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /** SolarEdge expects "yyyy-MM-dd HH:mm:ss". */
  private formatLocal(date: Date): string {
    return date.toISOString().slice(0, 19).replace("T", " ");
  }
}
