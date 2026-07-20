import type { AiInsightContractOutput, SavingsLineItem } from "@/lib/contracts/ai-insight-v2";
import { AiInlineEmpty, AiInlineError, AiStateCard } from "@/components/ai/ai-inline-error";
import { formatBenefitRangeIlsMonthly } from "@/lib/view-models/ai-insights";

interface SavingsAiInsightsSectionProps {
  data: AiInsightContractOutput | null;
  errorMessage: string | null;
}

import { Sparkles, ArrowRight, Zap, Target } from "lucide-react";

function SavingsLineItemRow({ item }: { item: SavingsLineItem }) {
  const rangeText = formatBenefitRangeIlsMonthly(item.expectedBenefitRangeIlsMonthly);
  
  // Decide on an icon dynamically based on the title context
  const getIcon = () => {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('behavioral') || titleLower.includes('usage')) return <Zap className="h-4 w-4 text-amber-400" />;
    if (titleLower.includes('maintenance') || titleLower.includes('soiling')) return <Sparkles className="h-4 w-4 text-sky-400" />;
    return <Target className="h-4 w-4 text-indigo-400" />;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center rounded-lg bg-slate-800 p-2.5 shadow-inner">
          {getIcon()}
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Issue & Impact */}
          <div>
            <h4 className="text-base font-bold text-slate-100">{item.title}</h4>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{item.reason.text}</p>
          </div>
          
          {/* Action & Value Box */}
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3" /> Recommended Action
              </span>
              <span className="text-sm font-medium text-slate-300">{item.message}</span>
            </div>
            
            {rangeText && (
              <div className="sm:border-l sm:border-slate-800 pl-0 sm:pl-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Est. Financial Gain
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {rangeText} / month
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExplanationBlock({
  title,
  summary,
  items
}: {
  title: string;
  summary: string;
  items: SavingsLineItem[];
}) {
  return (
    <article className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{summary}</p>
      {items.length ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <SavingsLineItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground italic">No active items for this section.</p>
      )}
    </article>
  );
}

export function SavingsAiInsightsSection({ data, errorMessage }: SavingsAiInsightsSectionProps) {
  if (errorMessage) {
    return (
      <div className="space-y-4">
        <AiStateCard title="AI savings explanation">
          <AiInlineError message={errorMessage} />
        </AiStateCard>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { withoutUpgrades, withUpgrades } = data.savingsExplanation;
  const products = data.productRecommendations;

  const hasSavingsContent =
    Boolean(withoutUpgrades.summary.trim()) ||
    withoutUpgrades.items.length > 0 ||
    Boolean(withUpgrades.summary.trim()) ||
    withUpgrades.items.length > 0;

  if (!hasSavingsContent && !products.length) {
    return (
      <AiStateCard title="AI savings explanation">
        <AiInlineEmpty message="No AI savings narrative for this snapshot." />
      </AiStateCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        AI savings explanation
      </p>
      {hasSavingsContent ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ExplanationBlock
            title="Without upgrades"
            summary={withoutUpgrades.summary}
            items={withoutUpgrades.items}
          />
          <ExplanationBlock
            title="With upgrades"
            summary={withUpgrades.summary}
            items={withUpgrades.items}
          />
        </div>
      ) : null}

      {products.length ? (
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            AI product ideas (informational)
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {products.map((p) => {
              const rangeText = formatBenefitRangeIlsMonthly(p.expectedBenefitRangeIlsMonthly);
              return (
                <li key={p.id} className="rounded-xl border border-border/80 bg-card/60 px-3 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.useCase}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{p.reason.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.whyRelevant.text}</p>
                  {rangeText ? (
                    <p className="mt-2 text-xs text-muted-foreground">Estimated benefit: {rangeText}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </article>
      ) : null}
    </div>
  );
}
