"use client";

/**
 * MaintenanceAiAccordion — doc 03 §5 (AI section wrap).
 *
 * Wraps the existing `MaintenanceAiInsightsSection` in a collapsible
 * shell. Default state is tied to the page's system status: expanded
 * on `warning` / `critical`, collapsed on `good`.
 *
 * Emits `maintenance_ai_accordion_toggle` per doc 03 §9.
 */

import { useCallback, useState, type ReactNode } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics/client";

interface Props {
  statusLevel: "good" | "warning" | "critical";
  siteId: string;
  children: ReactNode;
}

export function MaintenanceAiAccordion({ statusLevel, siteId, children }: Props) {
  const [open, setOpen] = useState(
    statusLevel === "warning" || statusLevel === "critical",
  );

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      track(
        "maintenance_ai_accordion_toggle",
        { opened: next },
        { surface: "maintenance_concern", siteId },
      );
      return next;
    });
  }, [siteId]);

  return (
    <section
      data-state={open ? "open" : "closed"}
      className="glass-card rounded-2xl border border-border/60 overflow-hidden"
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold">AI deep-dive</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Per-signal explanation from the engine
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-border/60 p-5 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      ) : null}
    </section>
  );
}
