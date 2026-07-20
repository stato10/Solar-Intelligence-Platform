import type {
  AuthUser,
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  Site,
  SolarSystem,
  Tariff
} from "@/lib/contracts";
import type {
  OnboardingStep1CreateSiteRequest,
  OnboardingStep1CreateSolarSystemRequest
} from "@/lib/contracts/onboarding-step1";
import type {
  OnboardingStep2CreateDeviceProfileRequest,
  OnboardingStep2CreateTariffRequest,
  OnboardingStep2DeviceProfile
} from "@/lib/contracts/onboarding-step2";
import { API_ENDPOINTS } from "./endpoints";
import { getApiBaseUrl } from "./env";

export class OnboardingApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OnboardingApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildHeaders(accessToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  const envelope = payload as Partial<ApiErrorEnvelope> & { data?: unknown };
  if (typeof envelope.message === "string" && envelope.message.trim()) {
    return envelope.message;
  }
  if (Array.isArray(envelope.message) && envelope.message.length > 0) {
    const first = envelope.message[0];
    if (typeof first === "string" && first.trim()) {
      return first;
    }
  }
  if (isRecord(envelope.data) && typeof envelope.data.message === "string") {
    return envelope.data.message;
  }

  return fallback;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postEnvelopeData<TReq, TData>(
  path: string,
  body: TReq,
  accessToken?: string
): Promise<TData> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new OnboardingApiError(
      response.status,
      extractErrorMessage(payload, `Request failed with status ${response.status}`)
    );
  }

  const envelope = payload as Partial<ApiSuccessEnvelope<TData>>;
  if (envelope.success !== true || envelope.data === undefined) {
    throw new OnboardingApiError(
      response.status,
      extractErrorMessage(payload, "Onboarding request was not successful")
    );
  }

  return envelope.data;
}

/**
 * Auth users and domain users share the same database table, so the
 * authenticated user IS the domain user. The historical search/create
 * roundtrip against /users is gone — the API also derives site ownership
 * from the JWT now, so the id is informational only.
 */
export async function resolveDomainUserId(authUser: AuthUser): Promise<string> {
  return authUser.id;
}

export async function createSite(
  payload: OnboardingStep1CreateSiteRequest,
  accessToken?: string
): Promise<Site> {
  return postEnvelopeData<OnboardingStep1CreateSiteRequest, Site>(
    API_ENDPOINTS.onboarding.sites,
    payload,
    accessToken
  );
}

export async function createSolarSystem(
  payload: OnboardingStep1CreateSolarSystemRequest,
  accessToken?: string
): Promise<SolarSystem> {
  return postEnvelopeData<OnboardingStep1CreateSolarSystemRequest, SolarSystem>(
    API_ENDPOINTS.onboarding.solarSystems,
    payload,
    accessToken
  );
}

export async function createTariff(
  payload: OnboardingStep2CreateTariffRequest,
  accessToken?: string
): Promise<Tariff> {
  return postEnvelopeData<OnboardingStep2CreateTariffRequest, Tariff>(
    API_ENDPOINTS.onboarding.tariffs,
    payload,
    accessToken
  );
}

export async function createDeviceProfile(
  payload: OnboardingStep2CreateDeviceProfileRequest,
  accessToken?: string
): Promise<OnboardingStep2DeviceProfile> {
  return postEnvelopeData<OnboardingStep2CreateDeviceProfileRequest, OnboardingStep2DeviceProfile>(
    API_ENDPOINTS.onboarding.devices,
    payload,
    accessToken
  );
}
