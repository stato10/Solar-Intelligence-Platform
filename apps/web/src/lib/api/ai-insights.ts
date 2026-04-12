import type { AiInsightSuccessEnvelope, AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { API_ENDPOINTS } from "./endpoints";
import { postJson } from "./client";

export async function fetchAiInsights(
  aggregate: DashboardAggregateData,
  accessToken?: string
): Promise<AiInsightContractOutput> {
  const envelope = await postJson<DashboardAggregateData, AiInsightSuccessEnvelope>(
    API_ENDPOINTS.ai.insights,
    aggregate,
    { accessToken }
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("AI insights response payload is invalid");
  }

  return envelope.data;
}

export async function fetchAiInsightsV3(
  aggregate: DashboardAggregateData,
  accessToken?: string
): Promise<import("../contracts").AiInsightContractOutputV3> {
  const requestPayload: import("../contracts").CanonicalAiInsightRequestV3 = {
    aggregate,
    // TODO: Replace hardcoded userData with actual SiteDeviceProfile from DB
    // The SiteDeviceProfile table already exists in the schema — wire it through
    // a dedicated API endpoint (e.g. GET /api/v1/sites/:siteId/device-profile)
    userData: {
      hasBoiler: true,
      hasEv: true,
      hasSignificantAc: true,
      flexibleLoadShiftingPossible: true,
      hasBattery: false,
      openToUpgrades: true,
      homeOccupancyProfile: "mostly_evening" // Must match Prisma OccupancyProfile enum (underscore, not hyphen)
    },
    // TODO: Replace hardcoded apiData with actual tariff and weather context
    // from the user's site/tariff records and current weather snapshot
    apiData: {
      tariffs: {
        importRateIlsPerKwh: 0.61,
        exportRateIlsPerKwh: 0.16
      },
      peakProductionWindow: {
        start: "10:00",
        end: "14:30"
      },
      weatherContext: "Clear sunny skies, occasional passing clouds.",
      radiationForecastSummary: "High radiation expected. Optimal for self-consumption."
    }
  };

  const envelope = await postJson<import("../contracts").CanonicalAiInsightRequestV3, { success: boolean; data: import("../contracts").AiInsightContractOutputV3 }>(
    API_ENDPOINTS.ai.insightsV3,
    requestPayload,
    { accessToken }
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("AI insights v3 response payload is invalid");
  }

  return envelope.data;
}
