/**
 * Vendor-neutral inverter connector contract (Phase 9).
 *
 * Each vendor adapter (SolarEdge, Enphase, mock, ...) translates its
 * monitoring API into interval energy readings. The telemetry service
 * only speaks this interface, so adding a vendor never touches the
 * ingestion or dashboard layers.
 */

export type InverterVendorId = "solaredge" | "enphase" | "fronius" | "sma" | "mock";

export interface ConnectorCredentials {
  /** Vendor API key / token (decrypted). */
  apiKey: string;
  /** Vendor-side plant/site identifier (e.g. SolarEdge site id). */
  externalSystemId?: string;
}

export interface ConnectorVerifyResult {
  ok: boolean;
  /** Human-readable failure reason when ok = false. */
  error?: string;
  /** Vendor-reported system name, if the API exposes one. */
  systemName?: string;
}

export interface IntervalReading {
  /** Interval start, UTC. */
  timestamp: Date;
  /** Energy produced during the interval, watt-hours. */
  productionWh: number;
  intervalMinutes: number;
}

export interface InverterConnector {
  readonly vendor: InverterVendorId;

  /** Cheap credential/reachability check used when a connection is created. */
  verify(credentials: ConnectorCredentials): Promise<ConnectorVerifyResult>;

  /**
   * Fetch interval production readings in [since, until].
   * Implementations must return readings sorted ascending by timestamp
   * and must not throw for empty ranges (return []).
   */
  fetchReadings(
    credentials: ConnectorCredentials,
    since: Date,
    until: Date
  ): Promise<IntervalReading[]>;
}
