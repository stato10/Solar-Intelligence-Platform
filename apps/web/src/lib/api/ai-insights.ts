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
