"use client";

import { Sparkles, Terminal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { AiInsightContractOutputV3, InsightItem, EnergyDecisionItem, ProductRecommendationItem } from "@/lib/contracts";
import { AiContractInsightCard, type ContractInsightLike } from "@/components/ai/AiContractInsightCard";

interface AiInsightsPanelProps {
  data: AiInsightContractOutputV3 | null;
  errorMessage: string | null;
}

/** Both v3 item unions fit `ContractInsightLike` structurally; energy
 *  decisions name their benefit range `estimated…` instead of `expected…`. */
function toContractInsight(item: InsightItem | EnergyDecisionItem): ContractInsightLike {
  // Both range props are optional, so `in`-narrowing cannot discriminate the
  // union — read each side through a Partial view instead.
  const asInsight = item as Partial<InsightItem>;
  const asDecision = item as Partial<EnergyDecisionItem>;
  return {
    ...item,
    expectedBenefitRangeIlsMonthly:
      asInsight.expectedBenefitRangeIlsMonthly ??
      asDecision.estimatedBenefitRangeIlsMonthly,
  };
}

function InsightList({ items }: { items: InsightItem[] | EnergyDecisionItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No insights in this category.</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <AiContractInsightCard item={toContractInsight(item)} />
        </li>
      ))}
    </ul>
  );
}

function ProductList({ items }: { items: ProductRecommendationItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No products suggested at this time.</p>;

  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <li key={p.id}>
          <AiContractInsightCard
            item={{
              id: p.id,
              title: p.name,
              message: p.useCase,
              severity: p.severity,
              confidence: p.confidence,
              actionability: p.actionability,
              reason: p.reason,
              expectedBenefitRangeIlsMonthly: p.expectedBenefitRangeIlsMonthly,
            }}
            extraWhy={p.whyRelevant.text}
          />
        </li>
      ))}
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
