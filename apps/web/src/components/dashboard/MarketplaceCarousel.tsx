"use client";

/**
 * MarketplaceCarousel — horizontal scroller that lives in the dashboard's
 * right rail (doc 10 §10 — "horizontal scroll with snap on all breakpoints;
 * no vertical stacking").
 *
 * Spec: docs/redesign/07-opportunities.md §7 and §9,
 *       docs/redesign/14-marketplace-catalog.md §6 (carousel items come
 *       from the typed catalog, not a hardcoded constant).
 *
 * Every item this renders is a `CatalogItem` picked by
 * `selectCarouselItems`. The component does not import `catalog.json`
 * directly; that dependency is owned by the view-model so test harnesses
 * and future fetch-backed variants can pass pre-selected items.
 */

import { useRef } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Battery,
  Car,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Droplets,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";
import type {
  CatalogCategory,
  CatalogItem,
} from "@/data/marketplace/types";
import { selectCarouselItems } from "@/lib/view-models/marketplace-catalog";

// ---------------------------------------------------------------------------
// Category → icon map (kept in sync with OpportunityMarketplaceCard).
// ---------------------------------------------------------------------------
const CATEGORY_ICON: Record<CatalogCategory, LucideIcon> = {
  cleaning: Droplets,
  "robotic-cleaner": Sparkles,
  battery: Battery,
  "ev-charger": Car,
  "smart-switch": Zap,
  "boiler-controller": CircuitBoard,
  "provider-service": ShoppingBag,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface MarketplaceCarouselProps {
  /**
   * Engine-emitted opportunities. The component passes them through
   * `selectCarouselItems`, which in turn derives the
   * `RecommendationType` set and picks a curated cross-section.
   * When `items` is provided, it takes precedence.
   */
  opportunities?: readonly MarketplaceOpportunity[];
  /** Pre-selected catalog items. Use this in tests or when a caller
   *  already owns the selection logic. */
  items?: readonly CatalogItem[];
  /** Max cards rendered. Ignored when `items` is provided. */
  limit?: number;
  /** Optional section heading override. */
  title?: string;
  /** Optional subtitle override. */
  subtitle?: string;
  /** Shown next to the title as a muted link. Default "View all". */
  viewAllHref?: string;

  // Legacy props preserved for callers not yet migrated. They do not
  // drive any behaviour but keep compile-time compatibility.
  siteId?: string;
  accessToken?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MarketplaceCarousel({
  opportunities,
  items,
  limit = 6,
  title = "Marketplace",
  subtitle = "Verified products and professionals matched to your system.",
  viewAllHref = "/opportunities",
}: MarketplaceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefer caller-provided items; fall back to catalog selection.
  const displayItems: readonly CatalogItem[] = items
    ? items
    : selectCarouselItems(opportunities ?? [], limit);

  if (displayItems.length === 0) return null;

  const scrollAction = (direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;
    const delta = direction === "left" ? -320 : 320;
    node.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="marketplace-carousel-title"
      className="mt-12"
      data-surface="marketplace-carousel"
    >
      {/* Header ------------------------------------------------------ */}
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            id="marketplace-carousel-title"
            className="text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={viewAllHref}
            className="hidden text-sm font-semibold text-primary hover:text-primary/80 sm:block"
          >
            View all
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollAction("left")}
              aria-label="Scroll carousel left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollAction("right")}
              aria-label="Scroll carousel right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Track ------------------------------------------------------- */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayItems.map((item) => (
          <CarouselCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Compact card — visually aligned with OpportunityMarketplaceCard but
// sized for horizontal scrolling. CTA is a link to /opportunities so
// the actual lead flow happens on the grid page. This keeps the carousel
// free of submission state and consistent with its "discovery" role.
// ---------------------------------------------------------------------------
function CarouselCard({ item }: { item: CatalogItem }) {
  const Icon = CATEGORY_ICON[item.category] ?? Sparkles;
  const gain =
    typeof item.estimatedMonthlyGain === "number"
      ? `N.IS ${Math.round(item.estimatedMonthlyGain).toLocaleString()} / month`
      : typeof item.estimatedYearlyGain === "number"
      ? `N.IS ${Math.round(item.estimatedYearlyGain).toLocaleString()} / year`
      : null;

  return (
    <article
      data-catalog-item-id={item.id}
      className={cn(
        "flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50",
        "transition-all hover:border-border hover:bg-card/80 sm:w-[320px]",
      )}
    >
      <div className="relative h-36 w-full overflow-hidden bg-muted/40">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="320px"
          className="object-cover"
          unoptimized
          onError={(e) => {
            // Hide broken image; the Icon fallback below fills the space.
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground/40">
          <Icon className="h-10 w-10" aria-hidden />
        </div>
        <span className="absolute left-3 top-3 rounded-md bg-background/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur">
          {item.category === "provider-service" ? "Service" : "Product"}
        </span>
        {item.verified ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
            <BadgeCheck className="h-3 w-3 text-emerald-500" aria-hidden />
            Verified
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold leading-snug">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground">{item.brand}</p>
        </div>

        <div className="space-y-1">
          {gain ? (
            <p className="font-mono text-sm tabular-nums text-emerald-500">
              {gain}
            </p>
          ) : null}
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {item.priceRange}
          </p>
        </div>

        <a
          href="/opportunities"
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          aria-label={`${item.ctaLabel} — ${item.title}`}
        >
          {item.ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}
