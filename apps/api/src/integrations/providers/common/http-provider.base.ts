import { AdapterErrorPayload, ProviderName, ProviderRequestMeta } from "./provider.types";

interface RequestInitWithTimeout extends RequestInit {
  timeoutMs?: number;
}

export abstract class HttpProviderBase {
  protected constructor(
    protected readonly providerName: ProviderName,
    protected readonly baseUrl: string
  ) {}

  protected buildUrl(path: string, searchParams?: URLSearchParams) {
    const url = new URL(path, this.baseUrl);
    if (searchParams) {
      url.search = searchParams.toString();
    }
    return url.toString();
  }

  protected async getJson<T>(
    path: string,
    searchParams?: URLSearchParams,
    meta?: ProviderRequestMeta,
    init?: RequestInitWithTimeout
  ): Promise<T> {
    const timeoutMs = init?.timeoutMs ?? meta?.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.buildUrl(path, searchParams), {
        ...init,
        method: "GET",
        signal: controller.signal
      });

      if (!response.ok) {
        const rawText = await response.text();
        let raw: unknown = rawText;
        if (rawText) {
          try {
            raw = JSON.parse(rawText);
          } catch {
            raw = rawText;
          }
        }
        throw this.createAdapterError(
          response.status,
          `Provider ${this.providerName} request failed`,
          raw
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.createAdapterError(503, `${this.providerName} request timed out`, {
          timeoutMs
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  protected createAdapterError(
    statusCode: number,
    message: string,
    raw?: unknown
  ): AdapterErrorPayload {
    return {
      provider: this.providerName,
      statusCode,
      message,
      retryable: statusCode === 429 || statusCode >= 500,
      raw
    };
  }
}
