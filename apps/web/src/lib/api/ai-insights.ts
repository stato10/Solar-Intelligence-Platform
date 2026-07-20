import type { AiInsightSuccessEnvelope, AiInsightContractOutput, DashboardAggregateData } from "@/lib/contracts";
import type { DeviceProfile, Tariff } from "@/lib/contracts/onboarding";
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

/** Optional real site context; when omitted, demo-grade defaults apply. */
export interface AiInsightsV3Context {
  deviceProfile?: DeviceProfile | null;
  tariff?: Tariff | null;
}

/** "2026-03-20T10:00:00Z" → "10:00"; passes through already-short values. */
function toHourMinute(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return `${String(parsed.getUTCHours()).padStart(2, "0")}:${String(parsed.getUTCMinutes()).padStart(2, "0")}`;
}

export async function fetchAiInsightsV3(
  aggregate: DashboardAggregateData,
  accessToken?: string,
  context?: AiInsightsV3Context
): Promise<import("../contracts").AiInsightContractOutputV3> {
  const profile = context?.deviceProfile ?? null;
  const tariff = context?.tariff ?? null;
  const usageWindow = aggregate.selfConsumption?.recommendedUsageWindow;

  const requestPayload: import("../contracts").CanonicalAiInsightRequestV3 = {
    aggregate,
    // Real SiteDeviceProfile when the caller provides it; otherwise the
    // established demo defaults keep the anonymous experience working.
    userData: profile
      ? {
          hasBoiler: profile.hasBoiler,
          hasEv: profile.hasEv,
          hasSignificantAc: profile.hasAc,
          flexibleLoadShiftingPossible: profile.usageFlexibilityLevel >= 2,
          hasBattery: false, // not yet captured by the v1 device profile DTO
          openToUpgrades: true,
          homeOccupancyProfile: "mostly_evening" // Prisma OccupancyProfile enum default
        }
      : {
          hasBoiler: true,
          hasEv: true,
          hasSignificantAc: true,
          flexibleLoadShiftingPossible: true,
          hasBattery: false,
          openToUpgrades: true,
          homeOccupancyProfile: "mostly_evening"
        },
    apiData: {
      tariffs: tariff
        ? {
            importRateIlsPerKwh: tariff.selfConsumptionRate,
            exportRateIlsPerKwh: tariff.exportRate
          }
        : {
            importRateIlsPerKwh: 0.61,
            exportRateIlsPerKwh: 0.16
          },
      peakProductionWindow: usageWindow
        ? {
            start: toHourMinute(usageWindow.start),
            end: toHourMinute(usageWindow.end)
          }
        : { start: "10:00", end: "14:30" },
      weatherContext: aggregate.soiling?.explanation ?? "No weather context available.",
      radiationForecastSummary:
        aggregate.benchmark?.insight ?? "No radiation forecast summary available."
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
