"use client";

import { Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AiInsightContractOutputV3 } from "@/lib/contracts";
import { AiInsightsPanel } from "./AiInsightsPanel";

interface AiDeepDiveAccordionProps {
  data: AiInsightContractOutputV3 | null;
  errorMessage: string | null;
}

/**
 * Thin wrapper that demotes the AI insights panel into a collapsed-by-default
 * accordion below the primary action lanes, per docs/redesign/02-dashboard.md §4.
 *
 * Keeps the existing AiInsightsPanel unchanged: the inner sub-accordion still
 * works, and rendering is still gated by the presence of `data` or an error.
 */
export function AiDeepDiveAccordion({ data, errorMessage }: AiDeepDiveAccordionProps) {
  if (!data && !errorMessage) return null;

  return (
    <Accordion type="single" className="space-y-0">
      <AccordionItem
        value="ai-deep-dive"
        className="rounded-2xl border border-border/70 bg-card/40"
      >
        <AccordionTrigger className="px-5 py-4">
          <span className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="flex flex-col text-left">
              <span className="text-sm font-semibold text-foreground">
                AI deep-dive
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Expand to read the full context behind today&apos;s recommendations
              </span>
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-4">
          <AiInsightsPanel data={data} errorMessage={errorMessage} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
