/**
 * Legacy onboarding-only tariff helper. New surfaces (Settings → Tariffs)
 * should use `tariff-defaults.ts` directly so they get country names,
 * richer metadata, and a typed `CurrencyCode`.
 *
 * We keep this thin shim so onboarding step-2 continues to work and the
 * two surfaces stay in sync.
 */

import {
  getTariffDefaultsForCountry,
  type CountryTariffDefaults,
} from "./tariff-defaults";

export interface TariffDefaults {
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
}

const GLOBAL_FALLBACK: TariffDefaults = {
  selfConsumptionRate: 0.2,
  exportRate: 0.05,
  currency: "USD",
};

export function getDefaultTariff(countryCode?: string | null): TariffDefaults {
  const entry: CountryTariffDefaults | null = getTariffDefaultsForCountry(countryCode);
  if (!entry) return GLOBAL_FALLBACK;
  return {
    selfConsumptionRate: entry.importRate,
    exportRate: entry.exportRate,
    currency: entry.currency,
  };
}
