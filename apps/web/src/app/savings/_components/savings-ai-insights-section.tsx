"use client";

import type { AiInsightContractOutput, SavingsLineItem } from "@/lib/contracts/ai-insight-v2";
import { AiInlineEmpty, AiInlineError, AiStateCard } from "@/components/ai/ai-inline-error";
import { AiContractInsightCard } from "@/components/ai/AiContractInsightCard";
import { PiggyBank, ShoppingBag } from "lucide-react";

interface SavingsAiInsightsSectionProps {
  data: AiInsightContractOutput | null;
  errorMessage: string | null;
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
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{title}</p>
      <p className="mt-2 text-sm text-foreground/80">{summary}</p>
      {items.length ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            // Savings items phrase `message` as the action ("Shift the
            // dishwasher to 11:00–15:00"), so the adapter maps message →
            // Recommended Action and reason → Impact.
            <AiContractInsightCard
              key={item.id}
              item={item}
              actionFromMessage
              icon={PiggyBank}
            />
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
            {products.map((p) => (
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
                  icon={ShoppingBag}
                />
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  );
}
