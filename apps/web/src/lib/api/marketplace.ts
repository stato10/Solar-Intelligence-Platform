import { postJson } from "./client";
import { getApiBaseUrl } from "./env";
import type { CreateLeadIntentPayload, LeadIntent, MarketplaceOpportunity } from "../contracts/marketplace";

export async function fetchMarketplaceOpportunities(
  aggregate: unknown,
  aiInsights?: unknown,
  accessToken?: string
): Promise<MarketplaceOpportunity[]> {
  try {
    // Opportunities require authentication
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
    // Log message only to avoid Next.js dev overlay catching the full Error object
    console.warn("Failed to load opportunities dynamically (e.g. not logged in)");
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
