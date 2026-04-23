/**
 * Country-based tariff defaults.
 *
 * Gives the user a sensible starting point for import ("buy") and export
 * ("feed-in") rates so they're never stuck at a blank form. All values
 * are **residential, single-tariff averages** in the country's local
 * currency and are intended as editable suggestions — not a substitute
 * for the real contract rate.
 *
 * Sources (2025 rough averages, rounded):
 *   - IL: Israel Electric Corp. high-voltage residential, ₪ ≈ 0.62 /kWh.
 *         Net-metering credit ≈ same as import (non-cash).
 *   - US: EIA residential average 2025, $ ≈ 0.17 /kWh. Export varies by
 *         state; 0.08 is a conservative net-billing floor.
 *   - GB: Ofgem price-cap 2025, £ ≈ 0.27 /kWh. SEG average ≈ 0.075.
 *   - DE/FR/ES/IT/NL/IE/PT: Eurostat 2025 band D household averages,
 *         € /kWh. Feed-in tariffs vary heavily; use a country-appropriate
 *         avg between the lowest support floor and market price.
 *   - AU: AER default-market-offer 2025 single-rate, A$ ≈ 0.33. Feed-in
 *         ≈ 0.05 (common mid-market retailer rate).
 *   - CA: NEB provincial residential avg, C$ ≈ 0.13. Export ≈ same under
 *         Ontario/BC/QC net-metering (credit, not cash).
 *
 * Keep this list tight: adding a row implies we're willing to display
 * the country name in the Tariffs selector. Non-listed countries fall
 * back to "Other" and the user sets rates manually.
 */

import type { CurrencyCode } from "./formatters";

export interface CountryTariffDefaults {
  /** ISO-3166-1 alpha-2 uppercase. */
  code: string;
  name: string;
  currency: CurrencyCode;
  /** Residential import (buy) rate per kWh, in currency units. */
  importRate: number;
  /** Export / feed-in rate per kWh. 0 means no cash export; credit-only. */
  exportRate: number;
  /** Short footnote for the UI — where the default came from. */
  source: string;
}

// Ordered roughly by launch-market priority.
export const COUNTRY_TARIFF_DEFAULTS: Record<string, CountryTariffDefaults> = {
  IL: {
    code: "IL",
    name: "Israel",
    currency: "ILS",
    importRate: 0.62,
    exportRate: 0.48,
    source: "IEC residential avg · 2025",
  },
  US: {
    code: "US",
    name: "United States",
    currency: "USD",
    importRate: 0.17,
    exportRate: 0.08,
    source: "EIA residential avg · 2025",
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    importRate: 0.27,
    exportRate: 0.075,
    source: "Ofgem cap + SEG avg · 2025",
  },
  IE: {
    code: "IE",
    name: "Ireland",
    currency: "EUR",
    importRate: 0.36,
    exportRate: 0.2,
    source: "CRU avg + CEG · 2025",
  },
  DE: {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    importRate: 0.37,
    exportRate: 0.082,
    source: "Eurostat DE-D + EEG · 2025",
  },
  FR: {
    code: "FR",
    name: "France",
    currency: "EUR",
    importRate: 0.25,
    exportRate: 0.13,
    source: "CRE regulated + obligation · 2025",
  },
  ES: {
    code: "ES",
    name: "Spain",
    currency: "EUR",
    importRate: 0.17,
    exportRate: 0.07,
    source: "CNMC PVPC + compensacion · 2025",
  },
  IT: {
    code: "IT",
    name: "Italy",
    currency: "EUR",
    importRate: 0.32,
    exportRate: 0.11,
    source: "ARERA avg + RID · 2025",
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    currency: "EUR",
    importRate: 0.3,
    exportRate: 0.12,
    source: "CBS avg + salderen · 2025",
  },
  PT: {
    code: "PT",
    name: "Portugal",
    currency: "EUR",
    importRate: 0.18,
    exportRate: 0.06,
    source: "ERSE regulated · 2025",
  },
  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    importRate: 0.33,
    exportRate: 0.05,
    source: "AER DMO single-rate · 2025",
  },
  CA: {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    importRate: 0.13,
    exportRate: 0.1,
    source: "Provincial avg + net-metering · 2025",
  },
  NZ: {
    code: "NZ",
    name: "New Zealand",
    currency: "AUD", // closest supported; displayed as "Suggested"
    importRate: 0.32,
    exportRate: 0.12,
    source: "EA residential avg · 2025",
  },
};

export const SUPPORTED_TARIFF_COUNTRY_CODES = Object.keys(COUNTRY_TARIFF_DEFAULTS);

export function getTariffDefaultsForCountry(
  code: string | null | undefined,
): CountryTariffDefaults | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return COUNTRY_TARIFF_DEFAULTS[upper] ?? null;
}

export function getCountryName(code: string | null | undefined): string | null {
  return getTariffDefaultsForCountry(code)?.name ?? null;
}
