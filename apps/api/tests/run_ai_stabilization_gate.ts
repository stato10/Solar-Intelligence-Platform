import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";
import { mapAggregateToAiInsightInput } from "../src/ai/aggregate-to-ai-input.mapper";
import { mapRequestToAiInsightInputV3 } from "../src/ai/aggregate-to-ai-input-v3.mapper";
import { AiService } from "../src/ai/ai.service";
import { isValidAiInsightOutput } from "../src/ai/contracts/ai-insight-v2";
import {
  CanonicalAiInsightRequestV3,
  isValidAiInsightOutputV3
} from "../src/ai/contracts/ai-insight-v3";
import { AiInsightsFallbackService } from "../src/ai/fallback/ai-insights-fallback.service";

const CWD = process.cwd().replace(/\\/g, "/");
const WORKSPACE_ROOT = CWD.endsWith("/apps/api")
  ? resolve(process.cwd(), "../..")
  : process.cwd();

loadDotEnv({ path: resolve(WORKSPACE_ROOT, ".env") });

const API_BASE = "http://localhost:3002/api/v1";
const DASHBOARD_AGGREGATE_URL = `${API_BASE}/dashboard/aggregate`;
const FIXTURE_PATH = resolve(
  WORKSPACE_ROOT,
  "apps/api/tests/fixtures/dashboard/v1/input-baseline.json"
);

type FetchType = typeof globalThis.fetch;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeForComparison<T extends { meta?: { generatedAt?: string } }>(value: T): T {
  const clone = structuredClone(value);
  if (clone.meta?.generatedAt) {
    clone.meta.generatedAt = "__normalized__";
  }
  return clone;
}

async function fetchCanonicalAggregatePayload(): Promise<unknown> {
  const payload = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as unknown;
  const response = await fetch(DASHBOARD_AGGREGATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const envelope = (await response.json()) as { success?: boolean; data?: unknown };
  assert(response.status === 201, `dashboard aggregate expected 201, got ${response.status}`);
  assert(envelope.success === true, "dashboard aggregate must return success=true");
  return envelope.data;
}

function buildV3Request(aggregate: unknown): CanonicalAiInsightRequestV3 {
  return {
    aggregate: aggregate as CanonicalAiInsightRequestV3["aggregate"],
    userData: {
      hasBoiler: true,
      hasEv: false,
      hasSignificantAc: true,
      flexibleLoadShiftingPossible: true,
      hasBattery: false,
      openToUpgrades: true,
      homeOccupancyProfile: "mixed"
    },
    apiData: {
      tariffs: {
        importRateIlsPerKwh: 0.62,
        exportRateIlsPerKwh: 0.28
      },
      peakProductionWindow: {
        start: "11:00",
        end: "15:00"
      },
      weatherContext: "clear",
      radiationForecastSummary: "high"
    }
  };
}

function installMockOpenAiFetch(jsonContents: string[]): () => void {
  const originalFetch = globalThis.fetch;
  let index = 0;

  const mocked: FetchType = (async (input: Parameters<FetchType>[0], init?: Parameters<FetchType>[1]) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("api.openai.com")) {
      const content = jsonContents[Math.min(index, jsonContents.length - 1)];
      index += 1;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return originalFetch(input, init);
  }) as FetchType;

  globalThis.fetch = mocked;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function main(): Promise<void> {
  const fallbackService = new AiInsightsFallbackService();
  const aiService = new AiService(fallbackService);
  const originalApiKey = process.env.OPENAI_API_KEY;
  const aggregate = await fetchCanonicalAggregatePayload();
  const v3Request = buildV3Request(aggregate);

  const v2Input = mapAggregateToAiInsightInput(aggregate as never);
  const v3Input = mapRequestToAiInsightInputV3(v3Request);
  const fallbackV2 = fallbackService.generate(v2Input);
  const fallbackV3 = fallbackService.generateV3(v3Input);

  // 1) Missing key -> deterministic fallback returned.
  process.env.OPENAI_API_KEY = "";
  const noKeyV2 = await aiService.generateInsights(aggregate);
  const noKeyV3 = await aiService.generateInsightsV3(v3Request);
  assert(isValidAiInsightOutput(noKeyV2), "missing key v2 must return valid contract output");
  assert(isValidAiInsightOutputV3(noKeyV3), "missing key v3 must return valid contract output");

  // 2) Invalid OpenAI output -> deterministic fallback returned (no throw/500 path).
  process.env.OPENAI_API_KEY = "dummy-openai-key";
  const restoreInvalidFetch = installMockOpenAiFetch([
    JSON.stringify({ invalid: true }),
    JSON.stringify({ invalid: true })
  ]);
  const invalidV2 = await aiService.generateInsights(aggregate);
  const invalidV3 = await aiService.generateInsightsV3(v3Request);
  restoreInvalidFetch();
  assert(
    JSON.stringify(normalizeForComparison(invalidV2)) ===
      JSON.stringify(normalizeForComparison(fallbackV2)),
    "invalid OpenAI output v2 must degrade to deterministic fallback"
  );
  assert(
    JSON.stringify(normalizeForComparison(invalidV3)) ===
      JSON.stringify(normalizeForComparison(fallbackV3)),
    "invalid OpenAI output v3 must degrade to deterministic fallback"
  );

  // 3) Valid OpenAI output -> returned as-is.
  const openAiValidV2 = {
    ...fallbackV2,
    currentStateInsights: fallbackV2.currentStateInsights.map((item, idx) =>
      idx === 0 ? { ...item, title: "OPENAI_SENTINEL_V2" } : item
    )
  };
  const openAiValidV3 = {
    ...fallbackV3,
    energyDecisions: fallbackV3.energyDecisions.map((item, idx) =>
      idx === 0 ? { ...item, title: "OPENAI_SENTINEL_V3" } : item
    )
  };
  const restoreValidFetch = installMockOpenAiFetch([
    JSON.stringify(openAiValidV2),
    JSON.stringify(openAiValidV3)
  ]);
  const validV2 = await aiService.generateInsights(aggregate);
  const validV3 = await aiService.generateInsightsV3(v3Request);
  restoreValidFetch();
  assert(validV2.currentStateInsights[0]?.title === "OPENAI_SENTINEL_V2", "valid OpenAI v2 should pass through");
  assert(validV3.energyDecisions[0]?.title === "OPENAI_SENTINEL_V3", "valid OpenAI v3 should pass through");

  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }

  console.log(
    "AI stabilization gate smoke passed (OpenAI valid passthrough + invalid/missing fallback for v2/v3)."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
