import type { AiInsightContractOutput, SavingsLineItem } from "@/lib/contracts/ai-insight-v2";
import { AiInlineEmpty, AiInlineError, AiStateCard } from "@/components/ai/ai-inline-error";
import { formatBenefitRangeIlsMonthly, formatSourceRefsForDisplay } from "@/lib/view-models/ai-insights";

interface SavingsAiInsightsSectionProps {
  data: AiInsightContractOutput | null;
  errorMessage: string | null;
}

function SavingsLineItemRow({ item }: { item: SavingsLineItem }) {
  const rangeText = formatBenefitRangeIlsMonthly(item.expectedBenefitRangeIlsMonthly);
  return (
    <li className="rounded-xl border border-border/80 bg-card/60 px-3 py-2.5">
      <p className="font-medium">{item.title}</p>
      <p className="text-xs text-muted-foreground">{item.message}</p>
      {rangeText ? <p className="mt-1 text-xs text-muted-foreground">Estimated benefit: {rangeText}</p> : null}
      <p className="mt-1 text-xs text-muted-foreground">{item.reason.text}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Sources: {formatSourceRefsForDisplay(item.reason.sourceRefs)}
      </p>
    </li>
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
    <article className="glass-card rounded-2xl p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <p className="mt-2 text-sm">{summary}</p>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <SavingsLineItemRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No line items in this section.</p>
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
