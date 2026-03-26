import type { AiInsightSuccessEnvelope, AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import { API_ENDPOINTS } from "./endpoints";
import { postJson } from "./client";

export async function fetchAiInsights(aggregate: DashboardAggregateData): Promise<AiInsightContractOutput> {
  const envelope = await postJson<DashboardAggregateData, AiInsightSuccessEnvelope>(
    API_ENDPOINTS.ai.insights,
    aggregate
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("AI insights response payload is invalid");
  }

  return envelope.data;
}

export async function fetchAiInsightsV3(aggregate: DashboardAggregateData): Promise<import("../contracts").AiInsightContractOutputV3> {
  const requestPayload: import("../contracts").CanonicalAiInsightRequestV3 = {
    aggregate,
    userData: {
      hasBoiler: true, // Mocked for V3 prompt accuracy until DB table is implemented
      hasEv: true, // Mocked
      hasSignificantAc: true,
      flexibleLoadShiftingPossible: true,
      hasBattery: false, // Defaulting to false to test battery recommendations
      openToUpgrades: true,
      homeOccupancyProfile: "mostly-evening"
    },
    apiData: {
      tariffs: {
        importRateIlsPerKwh: 0.61, // Mocked typical import
        exportRateIlsPerKwh: 0.16 // Mocked typical export
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
    requestPayload
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("AI insights v3 response payload is invalid");
  }

  return envelope.data;
}
