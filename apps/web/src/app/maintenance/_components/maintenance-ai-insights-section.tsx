"use client";

import type { AiInsightContractOutput } from "@/lib/contracts/ai-insight-v2";
import { AiInlineEmpty, AiInlineError, AiStateCard } from "@/components/ai/ai-inline-error";
import { AiContractInsightCard } from "@/components/ai/AiContractInsightCard";
import { Wrench } from "lucide-react";

interface MaintenanceAiInsightsSectionProps {
  data: AiInsightContractOutput | null;
  errorMessage: string | null;
}

export function MaintenanceAiInsightsSection({ data, errorMessage }: MaintenanceAiInsightsSectionProps) {
  if (errorMessage) {
    return (
      <AiStateCard title="AI maintenance explanation">
        <AiInlineError message={errorMessage} />
      </AiStateCard>
    );
  }

  if (!data) {
    return null;
  }

  const items = data.maintenanceInsights;

  if (!items.length) {
    return (
      <AiStateCard title="AI maintenance explanation">
        <AiInlineEmpty message="No maintenance-specific AI insights for this snapshot." />
      </AiStateCard>
    );
  }

  return (
    <article className="space-y-3">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          AI maintenance explanation
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Generated {data.meta.generatedAt}</p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <AiContractInsightCard item={item} icon={Wrench} />
          </li>
        ))}
      </ul>
    </article>
  );
}
