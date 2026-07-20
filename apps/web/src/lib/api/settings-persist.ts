/**
 * Settings persistence layer — thin wrappers over the four domain PATCH
 * endpoints (sites, solar-systems, tariffs, devices) plus fetchers that
 * look a resource up by siteId.
 *
 * Used by:
 *   - `app/settings/page.tsx` to hydrate the form from the latest record
 *     in each table (so the user sees their real data, not defaults).
 *   - `app/settings/_components/settings-shell.tsx` to persist changes
 *     when the user clicks "Save changes".
 *
 * Why not reuse `lib/api/onboarding.ts`?
 *   - Onboarding only exposes create (POST). We need findBySite + update.
 *   - The onboarding module is POST-only and intentionally narrow; adding
 *     mutators there would creep its surface. Keep settings writes here.
 */

import type {
  DeviceProfile,
  Site,
  SolarSystem,
  Tariff,
} from "@/lib/contracts/onboarding";
import { API_ENDPOINTS } from "./endpoints";
import { getApiBaseUrl } from "./env";

// ---------------------------------------------------------------------------
// Error & envelope utilities — mirror the onboarding module so any caller
// that catches `SettingsApiError` gets a consistent shape.
// ---------------------------------------------------------------------------

export class SettingsApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "SettingsApiError";
    this.status = status;
  }
}

interface ListEnvelope<T> {
  success: boolean;
  data: T[];
  meta?: unknown;
}

interface ErrorEnvelope {
  success?: false;
  message?: string | string[];
  data?: { message?: string };
}

function buildHeaders(accessToken?: string): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const env = payload as ErrorEnvelope;
  if (typeof env.message === "string" && env.message.trim()) return env.message;
  if (Array.isArray(env.message) && typeof env.message[0] === "string") return env.message[0];
  if (env.data && typeof env.data.message === "string") return env.data.message;
  return fallback;
}

async function request<T>(
  method: "GET" | "PATCH",
  path: string,
  body?: unknown,
  accessToken?: string,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: buildHeaders(accessToken),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new SettingsApiError(
      response.status,
      extractErrorMessage(payload, `Request failed with status ${response.status}`),
    );
  }
  const envelope = payload as { success?: boolean; data?: T };
  if (envelope?.success !== true || envelope.data === undefined) {
    throw new SettingsApiError(response.status, "Settings response payload is invalid");
  }
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Readers — fetch the latest record for a given siteId so the Settings
// form can be prefilled with what's already stored.
// ---------------------------------------------------------------------------

async function fetchListBySiteId<T>(path: string, siteId: string, accessToken?: string): Promise<T[]> {
  const qs = new URLSearchParams({ siteId, page: "1", limit: "10" });
  const response = await fetch(`${getApiBaseUrl()}${path}?${qs.toString()}`, {
    method: "GET",
    headers: buildHeaders(accessToken),
    cache: "no-store",
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new SettingsApiError(
      response.status,
      extractErrorMessage(payload, `Request failed with status ${response.status}`),
    );
  }
  const envelope = payload as ListEnvelope<T>;
  if (envelope?.success !== true || !Array.isArray(envelope.data)) return [];
  return envelope.data;
}

export async function fetchSite(siteId: string, accessToken?: string): Promise<Site> {
  return request<Site>("GET", `${API_ENDPOINTS.onboarding.sites}/${siteId}`, undefined, accessToken);
}

export async function fetchSolarSystemBySite(
  siteId: string,
  accessToken?: string,
): Promise<SolarSystem | null> {
  const items = await fetchListBySiteId<SolarSystem>(
    API_ENDPOINTS.onboarding.solarSystems,
    siteId,
    accessToken,
  );
  return items[0] ?? null;
}

export async function fetchTariffBySite(
  siteId: string,
  accessToken?: string,
): Promise<Tariff | null> {
  const items = await fetchListBySiteId<Tariff>(
    API_ENDPOINTS.onboarding.tariffs,
    siteId,
    accessToken,
  );
  if (items.length === 0) return null;
  // Prefer the most recent effective record.
  return [...items].sort((a, b) =>
    new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
  )[0];
}

export async function fetchDeviceProfileBySite(
  siteId: string,
  accessToken?: string,
): Promise<DeviceProfile | null> {
  const items = await fetchListBySiteId<DeviceProfile>(
    API_ENDPOINTS.onboarding.devices,
    siteId,
    accessToken,
  );
  return items[0] ?? null;
}

// ---------------------------------------------------------------------------
// Writers — `undefined` fields are stripped before send so the PATCH only
// carries what changed (NestJS validates each as `@IsOptional`).
// ---------------------------------------------------------------------------

export interface SitePatch {
  siteName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface SolarSystemPatch {
  systemSizeKw?: number;
  tilt?: number;
  azimuth?: number;
  panelWattage?: number;
  panelEfficiency?: number;
  panelCount?: number;
  panelType?: string;
  inverterType?: string;
  /** ISO-8601 date string. */
  installationDate?: string;
  lastCleaningDate?: string;
}

export interface TariffPatch {
  selfConsumptionRate?: number;
  exportRate?: number;
  currency?: string;
  effectiveFrom?: string;
}

export interface DeviceProfilePatch {
  hasBoiler?: boolean;
  hasEv?: boolean;
  hasDishwasher?: boolean;
  hasWashingMachine?: boolean;
  hasAc?: boolean;
  usageFlexibilityLevel?: number;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) result[k] = v;
  }
  return result as Partial<T>;
}

export async function patchSite(id: string, payload: SitePatch, accessToken?: string): Promise<Site> {
  return request<Site>(
    "PATCH",
    `${API_ENDPOINTS.onboarding.sites}/${id}`,
    stripUndefined(payload),
    accessToken,
  );
}

export async function patchSolarSystem(
  id: string,
  payload: SolarSystemPatch,
  accessToken?: string,
): Promise<SolarSystem> {
  return request<SolarSystem>(
    "PATCH",
    `${API_ENDPOINTS.onboarding.solarSystems}/${id}`,
    stripUndefined(payload),
    accessToken,
  );
}

export async function patchTariff(
  id: string,
  payload: TariffPatch,
  accessToken?: string,
): Promise<Tariff> {
  return request<Tariff>(
    "PATCH",
    `${API_ENDPOINTS.onboarding.tariffs}/${id}`,
    stripUndefined(payload),
    accessToken,
  );
}

export async function patchDeviceProfile(
  id: string,
  payload: DeviceProfilePatch,
  accessToken?: string,
): Promise<DeviceProfile> {
  return request<DeviceProfile>(
    "PATCH",
    `${API_ENDPOINTS.onboarding.devices}/${id}`,
    stripUndefined(payload),
    accessToken,
  );
}
