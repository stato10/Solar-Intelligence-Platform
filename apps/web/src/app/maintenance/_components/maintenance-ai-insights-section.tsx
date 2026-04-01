import type { AiInsightContractOutput } from "@/lib/contracts/ai-insight-v2";
import { AiInlineEmpty, AiInlineError, AiStateCard } from "@/components/ai/ai-inline-error";
import { formatSourceRefsForDisplay } from "@/lib/view-models/ai-insights";

interface MaintenanceAiInsightsSectionProps {
  data: AiInsightContractOutput | null;
  errorMessage: string | null;
}

function severityTone(severity: string): string {
  if (severity === "high") return "state-danger";
  if (severity === "medium" || severity === "moderate") return "state-warning";
  return "state-good";
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
    <article className="glass-card rounded-2xl p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        AI maintenance explanation
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Generated {data.meta.generatedAt}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border/80 bg-card/60 px-3 py-2.5">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.message}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className={`rounded-full border px-2 py-0.5 ${severityTone(item.severity)}`}>
                Severity: {item.severity}
              </span>
              <span className="rounded-full border border-border/80 px-2 py-0.5 text-muted-foreground">
                Confidence: {item.confidence}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{item.reason.text}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Sources: {formatSourceRefsForDisplay(item.reason.sourceRefs)}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
