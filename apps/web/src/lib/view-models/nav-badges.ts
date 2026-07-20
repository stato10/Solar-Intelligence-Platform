import type { DashboardAggregateData } from "@/lib/contracts";
import type { NavBadgeCounts } from "@/components/layout/NavBadgesBridge";

/**
 * Sidebar urgency badge counts (docs/redesign/09-sidebar-shell.md §5),
 * derived from the dashboard aggregate every page already has in hand.
 * Shared so any page that fetches the aggregate can mirror fresh counts
 * through `NavBadgesBridge` — not just the dashboard.
 */
export function deriveNavBadgeCounts(
  dashboard: DashboardAggregateData | null | undefined,
): NavBadgeCounts {
  const riskAlerts = dashboard?.risks?.alerts ?? [];
  const alertCount = riskAlerts.filter(
    (a) => a.severity === "high" || a.severity === "moderate",
  ).length;
  const maintenanceCount =
    (dashboard?.soiling?.cleaningRecommended ? 1 : 0) +
    ((dashboard?.heat?.estimatedLossPercent ?? 0) >= 5 ? 1 : 0);
  // "New" opportunity = high-priority recommendation surfaced today.
  const hasNewOpportunity =
    (dashboard?.optimization?.opportunityScore ?? 0) >= 70 &&
    (dashboard?.optimization?.recommendations?.length ?? 0) > 0;

  return { alertCount, maintenanceCount, hasNewOpportunity };
}
