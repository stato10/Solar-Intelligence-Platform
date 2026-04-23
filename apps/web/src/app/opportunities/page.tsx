import { cookies } from "next/headers";
import { ShoppingBag, Sparkles, PlugZap } from "lucide-react";
import {
  fetchDashboardAggregate,
  fetchDashboardBySiteId,
} from "@/lib/api/dashboard";
import { fetchMarketplaceOpportunities } from "@/lib/api/marketplace";
import { toOpportunitiesCatalogViewModel } from "@/lib/view-models/marketplace-catalog";
import { MarketplaceCarousel } from "@/components/dashboard/MarketplaceCarousel";
import { OpportunitySection } from "./_components/opportunity-section";
import type { DashboardAggregateData } from "@/lib/contracts";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";

/**
 * Opportunities / Marketplace page.
 *
 * Spec: docs/redesign/07-opportunities.md.
 * Key rules:
 *   - Four sections (Recommended now, Products, Providers, Automation),
 *     rendered in order, each hidden when empty.
 *   - Hero copy + summary sub-line with dynamic counts (§4).
 *   - Card contract enforced by OpportunityMarketplaceCard (§6).
 *   - Sort order enforced by the catalog view-model (§8).
 *   - When every section is empty, render the zero-data marketplace
 *     block from doc 12 §3.
 */
export default async function OpportunitiesPage() {
  let errorMessage: string | null = null;
  let aggregate: DashboardAggregateData | null = null;
  let rawOpportunities: MarketplaceOpportunity[] = [];
  let accessToken: string | undefined;
  let serviceArea: string | undefined;

  try {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;
    serviceArea = cookieStore.get("sip.serviceArea")?.value;

    aggregate = activeSiteId
      ? await fetchDashboardBySiteId(activeSiteId, accessToken)
      : await fetchDashboardAggregate();

    rawOpportunities = await fetchMarketplaceOpportunities(
      aggregate,
      undefined,
      accessToken,
    );
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load marketplace data";
  }

  if (errorMessage || !aggregate) {
    return (
      <section className="space-y-6">
        <article className="glass-card rounded-2xl p-8 text-center text-rose-500">
          <PlugZap className="mx-auto mb-3 h-8 w-8" aria-hidden />
          <p>{errorMessage ?? "No marketplace data available"}</p>
        </article>
      </section>
    );
  }

  const vm = toOpportunitiesCatalogViewModel(rawOpportunities, serviceArea);
  const hasRecommendations = rawOpportunities.length > 0;

  // Hero summary counts (§4): "N recommended now · M products · K providers"
  const summaryCounts = [
    `${vm.totals.recommendedNowCount} recommended now`,
    `${vm.totals.productCount} products`,
    `${vm.totals.providerCount} providers`,
  ].join(" · ");

  return (
    <section className="space-y-8 pb-12">
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/15 via-blue-400/5 to-transparent" />
        <div className="relative max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShoppingBag className="h-4 w-4 text-blue-500" aria-hidden />
            Marketplace & Upgrades
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Verified opportunities to improve your solar return.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Selected based on your system profile, usage pattern, and estimated ROI.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" aria-hidden />
            {summaryCounts}
          </p>
        </div>
      </article>

      {/* ─── Grouped sections ─────────────────────────────────────── */}
      {vm.isEmpty ? (
        <ZeroDataMarketplaceBlock hasRecommendations={hasRecommendations} />
      ) : (
        vm.sections.map((section) => (
          <OpportunitySection
            key={section.id}
            id={section.id}
            title={section.title}
            subtitle={section.subtitle}
            items={section.items}
            siteId={aggregate!.siteId}
            accessToken={accessToken}
          />
        ))
      )}

      {/* ─── Dashboard-style carousel as a discovery tail ─────────── */}
      {!vm.isEmpty ? (
        <MarketplaceCarousel
          opportunities={rawOpportunities}
          siteId={aggregate.siteId}
          accessToken={accessToken}
        />
      ) : null}

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
        <p>
          Site: {aggregate.siteId} · Generated: {aggregate.generatedAt}
        </p>
        <p>Quotes are provided by verified regional solar technicians.</p>
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Zero-data marketplace block (doc 12 §3, used when every section is empty)
// ---------------------------------------------------------------------------
function ZeroDataMarketplaceBlock({
  hasRecommendations,
}: {
  hasRecommendations: boolean;
}) {
  return (
    <article className="glass-card rounded-2xl p-8 md:p-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
          <PlugZap className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          {hasRecommendations
            ? "Nothing to recommend in your area yet"
            : "Connect your system to unlock tailored offers"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasRecommendations
            ? "We couldn't match your current recommendations to a verified provider near you. New partners are added weekly."
            : "Once your inverter or battery is linked we'll surface the offers that actually fit your roof, usage pattern, and evening demand."}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <a
            href="/settings/integrations"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Connect system
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/40"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </article>
  );
}
