/**
 * Canonical formatters for the Solar Intelligence Platform.
 *
 * All UI components must use these instead of raw `.toFixed()` calls or
 * hand-rolled strings like `"N.IS 18 / month"`. Locale + currency is
 * sourced from the user's Tariff (`hooks/use-currency.ts`); callers that
 * cannot reach the hook (server components, pure view-models) may pass
 * the currency explicitly.
 *
 * Currency policy:
 *   - Default currency is `ILS` to match the launch market. Pass
 *     `{ currency }` to render any ISO-4217 code supported by the
 *     runtime `Intl.NumberFormat`.
 *   - Default locale for `ILS` is `en-IL` so the symbol renders as `₪`
 *     before the number (matches product copy throughout the app).
 */

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------
export type CurrencyCode = "ILS" | "USD" | "EUR" | "GBP" | "CAD" | "AUD";

/** Reasonable default locale per supported currency. */
export function defaultLocaleForCurrency(currency: CurrencyCode): string {
  switch (currency) {
    case "ILS":
      return "en-IL";
    case "USD":
      return "en-US";
    case "EUR":
      return "en-IE";
    case "GBP":
      return "en-GB";
    case "CAD":
      return "en-CA";
    case "AUD":
      return "en-AU";
  }
}

/**
 * Coerce an arbitrary ISO-4217 string (e.g. from a server Tariff row) into
 * a `CurrencyCode` we explicitly support. Unknown codes fall back to ILS so
 * the UI never throws. Pure — safe for server components and view-models.
 */
export function toSupportedCurrencyCode(
  raw: string | null | undefined,
): CurrencyCode {
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

/**
 * Resolve the currency + locale a dashboard aggregate should be rendered
 * in, from the tariff block the backend echoes on the response. Falls back
 * to ILS for older cached snapshots that lack the tariff block.
 */
export function resolveAggregateCurrency(aggregate?: {
  tariff?: { currency?: string };
}): { currency: CurrencyCode; locale: string } {
  const currency = toSupportedCurrencyCode(aggregate?.tariff?.currency);
  return { currency, locale: defaultLocaleForCurrency(currency) };
}

export interface CurrencyFormatOptions {
  currency?: CurrencyCode;
  locale?: string;
  decimals?: number;
}

/**
 * Format a number as localized currency. Backwards-compatible with the
 * legacy `formatCurrency(value, decimals)` signature.
 *
 * formatCurrency(87.6)                       → "₪87.60"
 * formatCurrency(1615, 0)                    → "₪1,615"
 * formatCurrency(1615, { currency: "USD" })  → "$1,615.00"
 * formatCurrency(1615, { currency: "EUR", decimals: 0 }) → "€1,615"
 */
export function formatCurrency(
  value: number,
  decimalsOrOptions: number | CurrencyFormatOptions = 2,
): string {
  const opts: CurrencyFormatOptions =
    typeof decimalsOrOptions === "number"
      ? { decimals: decimalsOrOptions }
      : decimalsOrOptions;

  const currency = opts.currency ?? "ILS";
  const locale = opts.locale ?? defaultLocaleForCurrency(currency);
  const decimals = opts.decimals ?? 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    // Defensive fallback — should only happen if an unsupported currency
    // code is passed at runtime. Renders a readable string so the UI
    // never surfaces NaN or a broken symbol.
    const formatted = value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${currency} ${formatted}`;
  }
}

// ---------------------------------------------------------------------------
// Money per period — "₪18 / month", "$210 / year"
// ---------------------------------------------------------------------------
export type MoneyPeriod = "month" | "year" | "week" | "day" | "visit" | "hour";

export function formatMoneyPerPeriod(
  value: number,
  period: MoneyPeriod,
  options: CurrencyFormatOptions = {},
): string {
  const decimals = options.decimals ?? 0;
  const money = formatCurrency(value, { ...options, decimals });
  return `${money} / ${period}`;
}

// ---------------------------------------------------------------------------
// Price band — shared by every marketplace surface. The catalog stores
// structured bands so each user sees their own currency.
// ---------------------------------------------------------------------------
/**
 * A pre-formatted, free-form price line (e.g. "Quote on request").
 * Use this when the value isn't a number we can localize.
 */
export interface PriceBandLiteral {
  kind: "literal";
  text: string;
}

/**
 * A numeric price band. `max` optional for single-value prices.
 * `unit` optional for per-unit pricing ("/ visit", "/ hour").
 * `prefix: "from"` renders "From ₪250".
 */
export interface PriceBandNumeric {
  kind: "numeric";
  min: number;
  max?: number;
  currency: CurrencyCode;
  unit?: MoneyPeriod | "session" | "install";
  prefix?: "from" | "up-to";
}

export type PriceBand = PriceBandNumeric | PriceBandLiteral;

/**
 * Render a price band for display. If `displayCurrency` is passed AND
 * differs from the band's source currency, a "Local price" disclaimer
 * is appended so users in other markets can still read the number in
 * their own currency without the UI fabricating a fake conversion.
 */
export function formatPriceBand(
  band: PriceBand,
  displayCurrency?: CurrencyCode,
): string {
  if (band.kind === "literal") {
    return band.text;
  }

  const sourceCurrency = band.currency;
  const targetCurrency = displayCurrency ?? sourceCurrency;
  const sameCurrency = targetCurrency === sourceCurrency;

  // We never invent FX rates; when the user's currency differs, we
  // render the band in its native currency and flag it.
  const currency = sourceCurrency;
  const min = formatCurrency(band.min, { currency, decimals: 0 });
  const max =
    typeof band.max === "number"
      ? formatCurrency(band.max, { currency, decimals: 0 })
      : undefined;

  let body: string;
  if (max && max !== min) {
    body = `${min} – ${max}`;
  } else if (band.prefix === "from") {
    body = `From ${min}`;
  } else if (band.prefix === "up-to") {
    body = `Up to ${min}`;
  } else {
    body = min;
  }

  if (band.unit) {
    body = `${body} / ${band.unit}`;
  }

  if (!sameCurrency) {
    body = `${body} (local)`;
  }

  return body;
}

// ---------------------------------------------------------------------------
// Non-money formatters (unchanged).
// ---------------------------------------------------------------------------
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatKwh(value: number, decimals = 1): string {
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} kWh`;
}

export function formatScore(value: number, max = 100): string {
  return `${Math.round(value)} / ${max}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function formatDate(value: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Semantic status
// ---------------------------------------------------------------------------
export type SemanticStatus = "good" | "warning" | "critical";

export function deviationToStatus(deviationPercent: number): SemanticStatus {
  const abs = Math.abs(deviationPercent);
  if (abs <= 5) return "good";
  if (abs <= 15) return "warning";
  return "critical";
}

export function statusLabel(status: SemanticStatus): string {
  switch (status) {
    case "good":
      return "On Track";
    case "warning":
      return "Attention Needed";
    case "critical":
      return "Action Required";
  }
}
