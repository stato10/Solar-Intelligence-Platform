"use client";

/**
 * useCurrency — single source of truth for "what currency should this
 * user see money in?"
 *
 * The canonical answer is the user's active site Tariff (`tariff.currency`),
 * loaded during onboarding / dashboard fetch. Any screen that renders money
 * should wrap its computation in:
 *
 *   const { currency, locale } = useCurrency();
 *   formatCurrency(value, { currency, locale });
 *
 * Fallback is `ILS` so that server components and pre-auth surfaces (e.g.
 * the marketing carousel) never render a blank or broken money line.
 *
 * The provider lives at the root layout level and accepts an optional
 * `currency` prop. Components higher in the tree (e.g. `DashboardShell`,
 * `OpportunitiesLayout`) override the value once they've resolved the
 * active site's tariff.
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import {
  defaultLocaleForCurrency,
  type CurrencyCode,
} from "@/lib/utils/formatters";

interface CurrencyValue {
  currency: CurrencyCode;
  locale: string;
}

const CurrencyContext = createContext<CurrencyValue>({
  currency: "ILS",
  locale: defaultLocaleForCurrency("ILS"),
});

/**
 * Coerce an arbitrary ISO-4217 string (as stored on the server `Tariff`
 * row) into a `CurrencyCode` we explicitly support. Unknown codes fall
 * back to ILS so the UI never throws — the formatter can still render
 * the raw code via its own fallback path if needed.
 */
export function toSupportedCurrency(raw: string | null | undefined): CurrencyCode {
  if (!raw) return "ILS";
  const normalized = raw.toUpperCase();
  switch (normalized) {
    case "ILS":
    case "USD":
    case "EUR":
    case "GBP":
    case "CAD":
    case "AUD":
      return normalized;
    default:
      return "ILS";
  }
}

export function CurrencyProvider({
  currency,
  locale,
  children,
}: {
  currency?: CurrencyCode | string | null;
  locale?: string;
  children: ReactNode;
}) {
  const value = useMemo<CurrencyValue>(() => {
    const resolved = toSupportedCurrency(
      typeof currency === "string" ? currency : currency ?? undefined,
    );
    return {
      currency: resolved,
      locale: locale ?? defaultLocaleForCurrency(resolved),
    };
  }, [currency, locale]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyValue {
  return useContext(CurrencyContext);
}
