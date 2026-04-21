import { cookies } from "next/headers";
import { fetchDashboardAggregate, fetchDashboardBySiteId } from "@/lib/api/dashboard";
import { fetchMarketplaceOpportunities } from "@/lib/api/marketplace";
import { toOpportunitiesPageViewModel } from "@/lib/view-models/opportunities";
import { OpportunityCard } from "./_components/opportunity-card";
import { ShoppingBag, Construction, Zap } from "lucide-react";
import type { DashboardAggregateData } from "@/lib/contracts";

export default async function OpportunitiesPage() {
  let errorMessage: string | null = null;
  let vm: ReturnType<typeof toOpportunitiesPageViewModel> | null = null;
  let accessToken: string | undefined;

  try {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;

    const data: DashboardAggregateData = activeSiteId
      ? await fetchDashboardBySiteId(activeSiteId, accessToken)
      : await fetchDashboardAggregate();

    // Call the dynamic marketplace engine to get the leads
    const rawOpportunities = await fetchMarketplaceOpportunities(data, undefined, accessToken);

    vm = toOpportunitiesPageViewModel(data, rawOpportunities);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load opportunities data";
  }

  if (errorMessage || !vm) {
    return (
      <section className="space-y-6">
        <article className="glass-card rounded-2xl p-8 text-center text-rose-500">
          <Construction className="mx-auto h-8 w-8 mb-3" />
          <p>{errorMessage ?? "No marketplace data available"}</p>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-12">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <article className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/15 via-blue-400/5 to-transparent" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-blue-500" />
            Marketplace & Upgrades
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {vm.header.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {vm.header.subtitle}
          </p>
        </div>
      </article>

      {/* ─── Opportunities Grid ───────────────────────────────────── */}
      {vm.opportunities.length === 0 ? (
        <article className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          <Zap className="mx-auto h-8 w-8 mb-3 opacity-50" />
          <p>Your system is fully optimized. There are no critical upgrades required at this time.</p>
        </article>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vm.opportunities.map((card) => (
            <OpportunityCard 
              key={card.id} 
              card={card} 
              siteId={vm!.context.siteId} 
              accessToken={accessToken} 
            />
          ))}
        </div>
      )}

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
        <p>Site: {vm.context.siteId} | Generated: {vm.context.generatedAt}</p>
        <p>Quotes are provided by verified regional solar technicians.</p>
      </div>
    </section>
  );
}
