import { 
  AiInsightContractInputV3,
  CANONICAL_SOURCE_REFS,
  CanonicalAiInsightRequestV3,
  SmartProductCatalogItem 
} from "./contracts/ai-insight-v3";
import { SMART_DEVICE_CATALOG } from "./product-catalog";

export function mapRequestToAiInsightInputV3(
  payload: CanonicalAiInsightRequestV3,
  productCatalog: SmartProductCatalogItem[] = SMART_DEVICE_CATALOG
): AiInsightContractInputV3 {
  return {
    contractVersion: "ai-insight-v3",
    context: {
      siteId: payload.aggregate.siteId,
      generatedAt: payload.aggregate.generatedAt,
      source: payload.aggregate.source,
      providers: {
        weather: payload.aggregate.providers.weather,
        solar: payload.aggregate.providers.solar,
        engine: payload.aggregate.providers.engine
      }
    },
    userData: payload.userData,
    apiData: payload.apiData,
    aggregate: {
      soiling: payload.aggregate.soiling,
      heat: payload.aggregate.heat,
      risks: payload.aggregate.risks,
      optimization: payload.aggregate.optimization,
      financial: payload.aggregate.financial,
      benchmark: payload.aggregate.benchmark,
      selfConsumption: payload.aggregate.selfConsumption
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
