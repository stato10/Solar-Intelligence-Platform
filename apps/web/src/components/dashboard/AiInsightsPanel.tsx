"use client";

import { Sparkles, Terminal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { AiInsightContractOutputV3, InsightItem, EnergyDecisionItem, ProductRecommendationItem } from "@/lib/contracts";
import { formatBenefitRangeIlsMonthly, formatSourceRefsForDisplay } from "@/lib/view-models/ai-insights";

interface AiInsightsPanelProps {
  data: AiInsightContractOutputV3 | null;
  errorMessage: string | null;
}

function InsightList({ items }: { items: InsightItem[] | EnergyDecisionItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No insights in this category.</p>;
  
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border/80 bg-card/60 px-4 py-3">
          <div className="flex items-start justify-between">
            <p className="font-semibold text-sm">{item.title}</p>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70 bg-muted px-2 py-0.5 rounded-full">
              {item.severity} severity
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
          <div className="mt-3 text-xs opacity-80 border-l-2 border-primary/20 pl-2">
            <p className="font-medium text-foreground">Why this was flagged:</p>
            <p>{item.reason.text}</p>
            <p className="mt-1 text-[10px] opacity-70">
              Sources: {formatSourceRefsForDisplay(item.reason.sourceRefs)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProductList({ items }: { items: ProductRecommendationItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No products suggested at this time.</p>;
  
  return (
    <ul className="space-y-3">
      {items.map((p) => {
        const rangeText = formatBenefitRangeIlsMonthly(p.expectedBenefitRangeIlsMonthly);
        return (
          <li key={p.id} className="rounded-xl border border-border/80 bg-card/60 px-4 py-3">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-sm">{p.name}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{p.useCase}</p>
            <div className="mt-3 text-xs opacity-80 border-l-2 border-primary/20 pl-2">
              <p className="font-medium text-foreground">Why relevant:</p>
              <p>{p.whyRelevant.text}</p>
              {rangeText && <p className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">Est. benefit: {rangeText}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AiInsightsPanel({ data, errorMessage }: AiInsightsPanelProps) {
  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <Terminal className="h-5 w-5" />
          <p className="font-semibold text-sm">AI insights unavailable</p>
        </div>
        <p className="mt-2 text-xs opacity-80">{errorMessage}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <article className="glass-card rounded-2xl border-primary/20 overflow-hidden">
      <div className="p-4 md:p-5 border-b border-border/50 flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/15 p-2 text-primary shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold">AI Explanations & Deep Dive</p>
            <p className="text-xs text-muted-foreground">
              Expand to read the full context behind the dashboard recommendations
            </p>
          </div>
        </div>
      </div>

      <Accordion type="single" className="px-2 py-2">
        <AccordionItem value="current" className="border-0 bg-transparent">
          <AccordionTrigger className="hover:bg-transparent px-3 py-3 data-[state=open]:text-primary">
            1. Current State Insights
          </AccordionTrigger>
          <AccordionContent className="px-3">
            <InsightList items={data.currentStateInsights} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="maintenance" className="border-0 bg-transparent">
          <AccordionTrigger className="hover:bg-transparent px-3 py-3 data-[state=open]:text-primary">
            2. Maintenance Analysis
          </AccordionTrigger>
          <AccordionContent className="px-3">
            <InsightList items={data.maintenanceInsights} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="optimization" className="border-0 bg-transparent">
          <AccordionTrigger className="hover:bg-transparent px-3 py-3 data-[state=open]:text-primary">
            3. Optimization Analysis
          </AccordionTrigger>
          <AccordionContent className="px-3">
            <InsightList items={data.optimizationInsights} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="products" className="border-0 bg-transparent">
          <AccordionTrigger className="hover:bg-transparent px-3 py-3 data-[state=open]:text-primary">
            4. Product Recommendations
          </AccordionTrigger>
          <AccordionContent className="px-3">
            <ProductList items={data.productRecommendations} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="px-5 pb-4 pt-2 text-[10px] text-muted-foreground border-t border-border/50">
        AI Generated at {data.meta.generatedAt} based on {data.meta.basedOnSource}
      </div>
    </article>
  );
}
