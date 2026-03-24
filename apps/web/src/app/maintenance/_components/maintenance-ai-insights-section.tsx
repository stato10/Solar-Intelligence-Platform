import type { AiInsightContractOutput } from "@/lib/contracts/ai-insight-v2";
import { AiInlineError } from "@/components/ai/ai-inline-error";
import { formatSourceRefsForDisplay } from "@/lib/view-models/ai-insights";

interface MaintenanceAiInsightsSectionProps {
  data: AiInsightContractOutput | null;
  errorMessage: string | null;
}

export function MaintenanceAiInsightsSection({ data, errorMessage }: MaintenanceAiInsightsSectionProps) {
  if (errorMessage) {
    return (
      <article className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">AI maintenance explanation</p>
        <div className="mt-2">
          <AiInlineError message={errorMessage} />
        </div>
      </article>
    );
  }

  if (!data) {
    return null;
  }

  const items = data.maintenanceInsights;

  if (!items.length) {
    return (
      <article className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">AI maintenance explanation</p>
        <p className="mt-2 text-sm text-muted-foreground">No maintenance-specific AI insights for this snapshot.</p>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">AI maintenance explanation</p>
      <p className="mt-1 text-xs text-muted-foreground">Generated {data.meta.generatedAt}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-border px-3 py-2">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Severity: {item.severity} · Confidence: {item.confidence}
            </p>
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
