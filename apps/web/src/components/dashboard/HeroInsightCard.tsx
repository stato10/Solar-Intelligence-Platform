import { AlertTriangle, CheckCircle2, Flame, Sparkles } from "lucide-react";
import type { HeroInsightVm } from "@/lib/view-models/dashboard";
import type { SemanticStatus } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import { MarketplaceActionCard } from "./MarketplaceActionCard";

interface HeroInsightCardProps {
  hero: HeroInsightVm;
  opportunities?: MarketplaceOpportunity[];
  siteId?: string;
  siteName?: string;
  accessToken?: string;
}

const STATUS_CONFIG: Record<SemanticStatus, {
  icon: React.ElementType;
  gradient: string;
  badgeClass: string;
  accentClass: string;
}> = {
  good: {
    icon: CheckCircle2,
    gradient: "from-emerald-500/20 via-emerald-400/5 to-transparent",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    accentClass: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    gradient: "from-amber-500/20 via-amber-400/5 to-transparent",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    accentClass: "text-amber-600 dark:text-amber-400",
  },
  critical: {
    icon: Flame,
    gradient: "from-rose-500/20 via-rose-400/5 to-transparent",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25",
    accentClass: "text-rose-600 dark:text-rose-400",
  },
};

export function HeroInsightCard({ hero, opportunities = [], siteId, siteName, accessToken }: HeroInsightCardProps) {
  const config = STATUS_CONFIG[hero.status];
  const StatusIcon = config.icon;

  return (
    <article
      id="hero-insight"
      className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10"
    >
      {/* Gradient background accent */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          config.gradient
        )}
      />

      <div className="relative">
        {/* Status badge and Site Name */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={cn("gap-1.5 border px-3 py-1", config.badgeClass)}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {hero.statusLabel}
          </Badge>
          
          {siteName && (
            <span className="text-sm font-medium text-muted-foreground">
              Currently viewing: <span className="text-foreground">{siteName}</span>
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mt-2 text-white">
          {hero.status === "good" ? hero.headline : `💸 You are losing ${hero.moneyImpact}/month`}
        </h1>

        {/* Explanation */}
        <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg font-medium">
          {hero.status === "good" 
            ? hero.explanation 
            : `Most of it is caused by ${hero.explanation || "dust buildup and environmental factors"}.`}
        </p>

        {/* Secondary context / Sub-Headline if not good */}
        {hero.status !== "good" && (
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wider text-slate-400">
                AI Detected Financial Leakage
              </p>
              <p className={cn("mt-1 text-4xl font-black tracking-tight", config.accentClass)}>
                {hero.moneyImpact}
              </p>
            </div>
          </div>
        )}

        {/* Primary CTA placeholder or action card */}
        <div className="mt-6">
          {hero.ctaType === "cleaning" && opportunities.find(o => o.topic === "cleaning") ? (
            <MarketplaceActionCard
              title="Panel Cleaning Required"
              cause="dust buildup on your panels"
              monthlyLossIls={parseFloat(hero.moneyImpact.replace(/[^\d.]/g, '')) || 96}
              type="cleaning"
              actionLabel="Show Cleaning Providers"
              payload={{
                siteId: siteId ?? "",
                sourceType: "cleaning_recommendation",
                title: "Cleaning Request from Dashboard Hero",
                estimatedValue: parseFloat(hero.moneyImpact.replace(/[^\d.]/g, '')) || undefined,
              }}
              accessToken={accessToken}
            />
          ) : (
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  hero.status === "good"
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/85"
                    : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md"
                )}
              >
                <Sparkles className="h-4 w-4" />
                {hero.ctaLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
