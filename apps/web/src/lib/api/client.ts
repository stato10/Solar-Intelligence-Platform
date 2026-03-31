import { getApiBaseUrl } from "./env";

export class ApiHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

export async function postJson<TReq, TRes>(
  path: string,
  body: TReq,
  options?: { accessToken?: string }
): Promise<TRes> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new ApiHttpError(response.status, `Request failed with status ${response.status}`);
  }

  return (await response.json()) as TRes;
}
