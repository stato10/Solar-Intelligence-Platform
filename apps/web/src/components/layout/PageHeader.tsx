import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageHeaderTone = "primary" | "success" | "warning" | "danger" | "muted";

const TONE_GRADIENT: Record<PageHeaderTone, string> = {
  primary: "from-primary/15 via-primary/5 to-transparent",
  success: "from-emerald-500/15 via-emerald-400/5 to-transparent",
  warning: "from-amber-500/15 via-amber-400/5 to-transparent",
  danger: "from-rose-500/15 via-rose-400/5 to-transparent",
  muted: "from-muted/40 via-muted/10 to-transparent",
};

const TONE_ICON: Record<PageHeaderTone, string> = {
  primary: "bg-primary/15 text-primary ring-primary/25",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  muted: "bg-muted text-muted-foreground ring-border",
};

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: PageHeaderTone;
  /** Optional right-side slot (stats chips, actions). */
  aside?: React.ReactNode;
  className?: string;
}

/**
 * Shared secondary-page hero. Keeps Alerts / Savings / Settings / etc.
 * visually aligned with the product shell without each page inventing
 * its own glass-card gradient block.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  tone = "primary",
  aside,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-6 sm:p-8",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          TONE_GRADIENT[tone],
        )}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
                TONE_ICON[tone],
              )}
            >
              <Icon className="size-5" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {aside ? <div className="shrink-0 sm:pt-1">{aside}</div> : null}
      </div>
    </header>
  );
}
