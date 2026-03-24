import {
  AiInsightContractInput,
  CANONICAL_SOURCE_REFS,
  CanonicalAggregateAiSource,
  SmartProductCatalogItem
} from "./contracts/ai-insight-v2";
import { SMART_DEVICE_CATALOG } from "./product-catalog";

export function mapAggregateToAiInsightInput(
  aggregate: CanonicalAggregateAiSource,
  productCatalog: SmartProductCatalogItem[] = SMART_DEVICE_CATALOG
): AiInsightContractInput {
  return {
    contractVersion: "ai-insight-v2",
    context: {
      siteId: aggregate.siteId,
      generatedAt: aggregate.generatedAt,
      source: aggregate.source,
      providers: {
        weather: aggregate.providers.weather,
        solar: aggregate.providers.solar,
        engine: aggregate.providers.engine
      }
    },
    aggregate: {
      soiling: aggregate.soiling,
      heat: aggregate.heat,
      risks: aggregate.risks,
      optimization: aggregate.optimization,
      financial: aggregate.financial,
      benchmark: aggregate.benchmark,
      selfConsumption: aggregate.selfConsumption
    },
    productCatalog,
    guardrails: {
      allowOnlySourceRefs: CANONICAL_SOURCE_REFS,
      severityEnum: ["low", "moderate", "high"],
      confidenceEnum: ["low", "moderate", "high"],
      noMetricRecompute: true,
      noHallucinatedNumbers: true
    }
  };
}
