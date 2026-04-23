import type { AggregateSourceRef, BenefitRange } from "@/lib/contracts/ai-insight-v2";
import { formatCurrency, type CurrencyCode } from "@/lib/utils/formatters";

const SOURCE_REF_LABELS: Partial<Record<AggregateSourceRef, string>> = {
  "soiling.score": "Soiling score",
  "soiling.estimatedLossPercent": "Estimated soiling loss",
  "soiling.cleaningRecommended": "Cleaning recommendation",
  "soiling.recommendedCleaningDate": "Recommended cleaning date",
  "soiling.explanation": "Soiling explanation",
  "heat.score": "Heat score",
  "heat.estimatedLossPercent": "Heat-related loss",
  "heat.peakHeatWindowStart": "Peak heat window start",
  "heat.peakHeatWindowEnd": "Peak heat window end",
  "optimization.opportunityScore": "Optimization opportunity score",
  "optimization.estimatedValue": "Optimization estimated value",
  "financial.dailyEstimatedSavings": "Daily estimated savings",
  "financial.monthlyEstimatedSavings": "Monthly estimated savings",
  "financial.yearlyOptimizationPotential": "Yearly optimization potential",
  "benchmark.expectedProductionKwh": "Expected production (kWh)",
  "benchmark.actualProductionKwh": "Actual production (kWh)",
  "benchmark.expectedExportKwh": "Expected export (kWh)",
  "benchmark.actualExportKwh": "Actual export (kWh)",
  "benchmark.productionDeviationPercent": "Production deviation",
  "benchmark.exportDeviationPercent": "Export deviation",
  "benchmark.performanceStatus": "Performance status",
  "benchmark.insight": "Benchmark insight",
  "selfConsumption.selfConsumptionScore": "Self-consumption score",
  "selfConsumption.estimatedSavingsIls": "Self-consumption savings (ILS)",
  "selfConsumption.recommendedUsageWindow.start": "Recommended usage window start",
  "selfConsumption.recommendedUsageWindow.end": "Recommended usage window end",
  "selfConsumption.actions[]": "Self-consumption actions",
  siteId: "Site ID",
  generatedAt: "Generated at",
  source: "Data source",
  "providers.weather": "Weather provider",
  "providers.solar": "Solar provider",
  "providers.engine": "Engine provider"
};

/**
 * Format an engine benefit range (stored in ILS today) for display.
 * Callers pass the user's active currency/locale so the range respects
 * `useCurrency()`. Omitting the options keeps legacy ILS rendering.
 */
export function formatBenefitRangeIlsMonthly(
  range: BenefitRange | undefined,
  options: { currency?: CurrencyCode; locale?: string } = {},
): string | null {
  if (!range) return null;
  const currency = options.currency ?? "ILS";
  const locale = options.locale;
  const min = formatCurrency(Math.round(range.min), { currency, locale, decimals: 0 });
  const max = formatCurrency(Math.round(range.max), { currency, locale, decimals: 0 });
  return `${min}–${max} / month`;
}

export function labelForSourceRef(ref: AggregateSourceRef): string {
  return SOURCE_REF_LABELS[ref] ?? ref;
}

export function formatSourceRefsForDisplay(refs: AggregateSourceRef[]): string {
  if (!refs.length) return "";
  return refs.map(labelForSourceRef).join(", ");
}
