import type {
  DashboardAggregateData,
  DashboardAggregateRequest,
  DashboardAggregateSuccessEnvelope
} from "@/lib/contracts";
import { API_ENDPOINTS } from "./endpoints";
import { postJson } from "./client";

export function getDefaultDashboardAggregateRequest(): DashboardAggregateRequest {
  return {
    siteId: "site-demo-001",
    latitude: 32.0853,
    longitude: 34.7818,
    systemSizeKw: 8.5,
    lossPercent: 14,
    generatedAt: "2026-03-20T10:00:00Z",
    tariff: {
      currency: "ILS",
      importRate: 0.62,
      exportRate: 0.28
    }
  };
}

export async function fetchDashboardAggregate(
  request: DashboardAggregateRequest = getDefaultDashboardAggregateRequest()
): Promise<DashboardAggregateData> {
  const envelope = await postJson<DashboardAggregateRequest, DashboardAggregateSuccessEnvelope>(
    API_ENDPOINTS.dashboard.aggregate,
    request
  );

  if (!envelope.success || !envelope.data) {
    throw new Error("Dashboard response payload is invalid");
  }

  return envelope.data;
}
