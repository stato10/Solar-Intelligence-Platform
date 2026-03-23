import type {
  AuthLoginRequest,
  AuthLoginResponseData,
  AuthRegisterRequest,
  AuthRegisterResponseData
} from "@/lib/contracts";
import { API_ENDPOINTS } from "./endpoints";
import { getApiBaseUrl } from "./env";

interface ApiEnvelopeLike<TData> {
  success?: boolean;
  data?: TData | { message?: string };
  message?: string | string[];
}

export class AuthApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  const directMessage = payload.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }
  if (Array.isArray(directMessage) && directMessage.length > 0) {
    const first = directMessage[0];
    if (typeof first === "string" && first.trim()) {
      return first;
    }
  }

  const data = payload.data;
  if (isRecord(data) && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallback;
}

async function postAuth<TReq, TData>(path: string, body: TReq): Promise<TData> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new AuthApiError(
      response.status,
      extractMessage(payload, `Auth request failed with status ${response.status}`)
    );
  }

  const envelope = payload as ApiEnvelopeLike<TData>;
  if (envelope?.success !== true) {
    throw new AuthApiError(
      response.status,
      extractMessage(payload, "Authentication request was not successful")
    );
  }

  if (!envelope.data) {
    throw new AuthApiError(response.status, "Authentication response payload is invalid");
  }

  return envelope.data as TData;
}

export async function registerAuth(
  payload: AuthRegisterRequest
): Promise<AuthRegisterResponseData> {
  return postAuth<AuthRegisterRequest, AuthRegisterResponseData>(API_ENDPOINTS.auth.register, payload);
}

export async function loginAuth(payload: AuthLoginRequest): Promise<AuthLoginResponseData> {
  return postAuth<AuthLoginRequest, AuthLoginResponseData>(API_ENDPOINTS.auth.login, payload);
}
