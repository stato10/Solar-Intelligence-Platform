import { ApiHttpError, postJson } from "./client";
import type { CreateLeadIntentPayload, LeadIntent, MarketplaceOpportunity } from "../contracts/marketplace";

export async function fetchMarketplaceOpportunities(
  aggregate: unknown,
  aiInsights?: unknown,
  accessToken?: string
): Promise<MarketplaceOpportunity[]> {
  try {
    // Opportunities require authentication — silently no-op for anon users.
    if (!accessToken) return [];

    const res = await postJson<{ aggregate: unknown; aiInsights?: unknown }, { success: boolean; data: MarketplaceOpportunity[] }>(
      "/marketplace/opportunities/derive",
      { aggregate, aiInsights },
      { accessToken }
    );
    if (!res.success) {
      return [];
    }
    return res.data;
  } catch (error) {
    // Expected auth failures (expired/invalid token) are silent: the Next.js
    // dev overlay surfaces every `console.warn` as an error, so noisy logs
    // here pollute the developer experience for a non-issue. Other failures
    // still warn with a plain string (never the Error object, which would
    // also trip the overlay).
    if (error instanceof ApiHttpError && (error.status === 401 || error.status === 403)) {
      return [];
    }
    console.warn(
      `Failed to load opportunities dynamically: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
    return [];
  }
}

export async function createLeadIntent(
  payload: CreateLeadIntentPayload,
  accessToken?: string
): Promise<LeadIntent> {
  const res = await postJson<CreateLeadIntentPayload, { success: boolean; data: LeadIntent }>(
    "/leads/intents",
    payload,
    { accessToken }
  );

  if (!res.success) {
    throw new Error("Failed to create lead intent");
  }

  return res.data;
}
