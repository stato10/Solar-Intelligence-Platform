/**
 * Inverter telemetry API client (Phase 9).
 *
 * Connections carry vendor credentials, so every call is JWT-authenticated.
 * The API never returns the stored key — only connection status metadata.
 */

import { getApiBaseUrl } from "./env";
import { getJson, postJson, ApiHttpError } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export type InverterVendorId = "solaredge" | "enphase" | "fronius" | "sma" | "mock";

export interface InverterConnection {
  siteId: string;
  vendor: InverterVendorId;
  externalSystemId: string | null;
  status: "pending" | "active" | "error" | "disconnected";
  lastSyncAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface CreateInverterConnectionInput {
  siteId: string;
  vendor: InverterVendorId;
  apiKey: string;
  externalSystemId?: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function createInverterConnection(
  input: CreateInverterConnectionInput,
  accessToken: string
): Promise<InverterConnection> {
  const res = await postJson<CreateInverterConnectionInput, Envelope<InverterConnection>>(
    API_ENDPOINTS.telemetry.connections,
    input,
    { accessToken }
  );
  return res.data;
}

/**
 * Returns the site's connection, or null when none exists (or the request
 * fails) — callers treat "no connection" and "couldn't check" the same way.
 */
export async function fetchInverterConnection(
  siteId: string,
  accessToken?: string
): Promise<InverterConnection | null> {
  if (!accessToken) return null;
  try {
    const res = await getJson<Envelope<InverterConnection | null>>(
      `${API_ENDPOINTS.telemetry.connections}/${siteId}`,
      undefined,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data ?? null;
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) return null;
    return null;
  }
}

export async function deleteInverterConnection(
  siteId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}${API_ENDPOINTS.telemetry.connections}/${siteId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    }
  );
  if (!response.ok) {
    throw new ApiHttpError(response.status, `Disconnect failed with status ${response.status}`);
  }
}

export async function syncInverterNow(
  siteId: string,
  accessToken: string
): Promise<{ inserted: number }> {
  const res = await postJson<Record<string, never>, Envelope<{ inserted: number }>>(
    `${API_ENDPOINTS.telemetry.connections}/${siteId}/sync`,
    {},
    { accessToken }
  );
  return res.data;
}
