"use client";

/**
 * OpportunityMarketplaceCard — the spec-compliant card used by every
 * section on the Opportunities page.
 *
 * Spec: docs/redesign/07-opportunities.md §6 (card contract) and §8
 * (sort-driven muted state for low-priority/low-confidence items).
 *
 * The card is intentionally presentational. CTA behaviour is owned by
 * the page via `onCtaClick`, so the same component works for:
 *   - the legacy createLeadIntent path (today), and
 *   - the shared useConversionFlow hook (Sprint 2 follow-up).
 *
 * Data comes in as a `CatalogItem` straight from the typed catalog
 * (data/marketplace/catalog.json + providers.json).
 */

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Battery,
  Car,
  CircuitBoard,
  Droplets,
  Loader2,
  MapPin,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type CatalogCategory,
  type CatalogConfidence,
  type CatalogCtaKind,
  type CatalogItem,
} from "@/data/marketplace/types";

// ---------------------------------------------------------------------------
// Styling tables — kept at module scope so React doesn't re-create them.
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

const CONFIDENCE_STYLE: Record<
  CatalogConfidence,
  { label: string; className: string }
> = {
  high: {
    label: "High confidence",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  medium: {
    label: "Medium confidence",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  low: {
    label: "Low confidence",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  },
};

const CTA_TONE: Record<CatalogCtaKind, string> = {
  // Strong, action-forward: booking is the fastest revenue path.
  book: "bg-primary text-primary-foreground hover:bg-primary/90",
  quote: "bg-primary text-primary-foreground hover:bg-primary/90",
  // Configure is lower-intent: keep an outline.
  configure:
    "bg-transparent border border-border text-foreground hover:bg-muted/40",
  external:
    "bg-transparent border border-border text-foreground hover:bg-muted/40",
};

// ---------------------------------------------------------------------------
// Money formatting
// ---------------------------------------------------------------------------
/** Formats the gain line: prefers monthly, falls back to yearly. */
function formatGainLine(item: CatalogItem): string | null {
  if (typeof item.estimatedMonthlyGain === "number") {
    return `N.IS ${Math.round(item.estimatedMonthlyGain).toLocaleString()} / month`;
  }
  if (typeof item.estimatedYearlyGain === "number") {
    return `N.IS ${Math.round(item.estimatedYearlyGain).toLocaleString()} / year`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface OpportunityMarketplaceCardProps {
  item: CatalogItem;
  /**
   * CTA handler. When omitted, the CTA renders as a disabled-looking
   * button — the page is expected to always pass a handler, but we
   * never throw on missing wiring.
   */
  onCtaClick?: (item: CatalogItem) => Promise<void> | void;
  /**
   * When true, renders the card in a muted style per doc 07 §8. The
   * caller decides the condition (low-priority + low-confidence).
   */
  muted?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OpportunityMarketplaceCard({
  item,
  onCtaClick,
  muted = false,
  className,
}: OpportunityMarketplaceCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  const Icon = CATEGORY_ICON[item.category] ?? Sparkles;
  const confidence = CONFIDENCE_STYLE[item.confidence];
  const ctaTone = CTA_TONE[item.ctaKind] ?? CTA_TONE.external;
  const gainLine = formatGainLine(item);

  const handleClick = async () => {
    if (!onCtaClick || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCtaClick(item);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article
      aria-label={item.title}
      data-catalog-item-id={item.id}
      data-confidence={item.confidence}
      data-category={item.category}
      className={cn(
        "glass-card flex flex-col overflow-hidden rounded-2xl border border-border/60",
        "transition-all hover:border-border hover:shadow-lg",
        muted && "opacity-70 hover:opacity-100",
        className,
      )}
    >
      {/* Thumbnail ---------------------------------------------------- */}
      <div className="relative h-40 w-full overflow-hidden bg-muted/40">
        {imgBroken ? (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Icon className="h-10 w-10 opacity-40" aria-hidden />
          </div>
        ) : (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover"
            onError={() => setImgBroken(true)}
            // The seeded URLs are placeholders; we don't want Next to
            // eagerly optimize missing assets during dev.
            unoptimized
          />
        )}
        {item.verified ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
            <BadgeCheck className="h-3 w-3 text-emerald-500" aria-hidden />
            Verified
          </span>
        ) : null}
      </div>

      {/* Body --------------------------------------------------------- */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="space-y-1">
          <h3 className="text-lg font-semibold leading-snug tracking-tight">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground">{item.brand}</p>
        </header>

        {/* Why tags — always render at least one (catalog validation
            guarantees 1..3). */}
        {item.whyRecommendedTags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Why recommended">
            {item.whyRecommendedTags.map((tag) => (
              <li key={tag}>
                <span className="inline-block rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Metrics block — monospace for money alignment. */}
        <dl className="grid grid-cols-1 gap-2 rounded-xl border border-border/50 bg-card/40 p-3">
          {gainLine ? (
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Estimated gain
              </dt>
              <dd className="font-mono text-base tabular-nums text-emerald-600 dark:text-emerald-400">
                {gainLine}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Price
            </dt>
            <dd className="font-mono text-sm tabular-nums text-foreground">
              {item.priceRange}
            </dd>
          </div>
          {item.serviceArea ? (
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                Service area
              </dt>
              <dd className="text-sm text-foreground">{item.serviceArea}</dd>
            </div>
          ) : null}
        </dl>

        {/* CTA row + confidence chip ---------------------------------- */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClick}
            disabled={isSubmitting || !onCtaClick}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
              "transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100",
              ctaTone,
            )}
            aria-label={`${item.ctaLabel} — ${item.title}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Sending…</span>
              </>
            ) : (
              <>
                <span>{item.ctaLabel}</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>

          <Badge
            variant="outline"
            className={cn(
              "border px-2 py-0.5 text-[10px] uppercase tracking-wider",
              confidence.className,
            )}
            aria-label={confidence.label}
          >
            {confidence.label.replace(" confidence", "")}
          </Badge>
        </div>
      </div>
    </article>
  );
}
