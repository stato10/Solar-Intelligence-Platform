import { Injectable } from "@nestjs/common";
import {
  ConnectorCredentials,
  ConnectorVerifyResult,
  IntervalReading,
  InverterConnector
} from "./inverter-connector.interface";

/**
 * Deterministic mock inverter for demos and tests.
 *
 * Produces a plausible solar bell curve (06:00–19:00 UTC, peak at 12:30)
 * scaled to a nominal 8 kWp system, with a small deterministic "noise"
 * component derived from the timestamp so repeated syncs are idempotent.
 */
@Injectable()
export class MockInverterConnector implements InverterConnector {
  readonly vendor = "mock" as const;

  async verify(_credentials: ConnectorCredentials): Promise<ConnectorVerifyResult> {
    return { ok: true, systemName: "Simulated inverter" };
  }

  async fetchReadings(
    _credentials: ConnectorCredentials,
    since: Date,
    until: Date
  ): Promise<IntervalReading[]> {
    const readings: IntervalReading[] = [];
    const stepMs = 15 * 60 * 1000;
    // Align to the 15-minute grid so repeated syncs upsert the same rows.
    let cursor = Math.ceil(since.getTime() / stepMs) * stepMs;
    const end = Math.min(until.getTime(), Date.now());

    while (cursor <= end) {
      const ts = new Date(cursor);
      readings.push({
        timestamp: ts,
        productionWh: this.simulatedIntervalWh(ts),
        intervalMinutes: 15
      });
      cursor += stepMs;
    }
    return readings;
  }

  private simulatedIntervalWh(ts: Date): number {
    const hour = ts.getUTCHours() + ts.getUTCMinutes() / 60;
    // Daylight window with a cosine bell centered on 12.5h.
    if (hour < 6 || hour > 19) return 0;
    const bell = Math.cos(((hour - 12.5) / 6.5) * (Math.PI / 2)) ** 2;
    const peakWatts = 8000 * 0.82; // 8 kWp derated
    // Deterministic pseudo-noise (±6%) keyed off the timestamp.
    const seed = Math.sin(ts.getTime() / 1_000_000) * 10_000;
    const noise = 1 + ((seed - Math.floor(seed)) - 0.5) * 0.12;
    return Math.max(0, Math.round(peakWatts * bell * noise * 0.25)); // W → Wh per 15 min
  }
}
