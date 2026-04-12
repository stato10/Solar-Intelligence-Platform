/**
 * Canonical formatters for the Solar Intelligence Platform.
 * All UI components must use these instead of raw .toFixed() calls.
 */

/**
 * Format currency with ₪ symbol.
 * formatCurrency(87.6)      → "₪87.60"
 * formatCurrency(1615)      → "₪1,615"
 * formatCurrency(87.6, 0)   → "₪88"
 */
export function formatCurrency(value: number, decimals = 2): string {
  const formatted = value.toLocaleString("en-IL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `₪${formatted}`;
}

/**
 * Format percentage with sign.
 * formatPercent(-7.3)  → "-7.3%"
 * formatPercent(92.5)  → "92.5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format kilowatt-hours.
 * formatKwh(35.2)  → "35.2 kWh"
 * formatKwh(1200)  → "1,200.0 kWh"
 */
export function formatKwh(value: number, decimals = 1): string {
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} kWh`;
}

/**
 * Format a score out of a maximum.
 * formatScore(72, 100) → "72 / 100"
 */
export function formatScore(value: number, max = 100): string {
  return `${Math.round(value)} / ${max}`;
}

/**
 * Format a time range.
 * formatTimeRange("10:00", "14:30") → "10:00 – 14:30"
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/**
 * Format an ISO date string to a short localized date.
 * formatDate("2026-03-20T10:00:00Z") → "Mar 20, 2026"
 */
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

/**
 * Format an ISO date string to a relative short description.
 * formatRelativeDate("2026-03-20T10:00:00Z") → "Mar 20, 10:00"
 */
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

/**
 * Derive a semantic status from a deviation value.
 */
export type SemanticStatus = "good" | "warning" | "critical";

export function deviationToStatus(deviationPercent: number): SemanticStatus {
  const abs = Math.abs(deviationPercent);
  if (abs <= 5) return "good";
  if (abs <= 15) return "warning";
  return "critical";
}

/**
 * Map semantic status to display text.
 */
export function statusLabel(status: SemanticStatus): string {
  switch (status) {
    case "good": return "On Track";
    case "warning": return "Attention Needed";
    case "critical": return "Action Required";
  }
}
