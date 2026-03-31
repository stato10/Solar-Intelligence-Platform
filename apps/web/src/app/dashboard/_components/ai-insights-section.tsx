import type { AiInsightContractOutput, AiInsightContractOutputV3 } from "@/lib/contracts";
import { AiInlineError } from "@/components/ai/ai-inline-error";
import { formatBenefitRangeIlsMonthly, formatSourceRefsForDisplay } from "@/lib/view-models/ai-insights";

const DASHBOARD_STATE_LIMIT = 3;
const PRODUCT_PREVIEW_LIMIT = 2;

interface DashboardAiInsightsSectionProps {
  data: Pick<AiInsightContractOutput | AiInsightContractOutputV3, "currentStateInsights" | "productRecommendations" | "meta"> | null;
  errorMessage: string | null;
}

export function DashboardAiInsightsSection({ data, errorMessage }: DashboardAiInsightsSectionProps) {
  if (errorMessage) {
    return (
      <article className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">AI insights</p>
        <div className="mt-2">
          <AiInlineError message={errorMessage} />
        </div>
      </article>
    );
  }

  if (!data) {
    return null;
  }

  const stateItems = data.currentStateInsights.slice(0, DASHBOARD_STATE_LIMIT);
  const productPreview = data.productRecommendations.slice(0, PRODUCT_PREVIEW_LIMIT);

  if (!stateItems.length && !productPreview.length) {
    return (
      <article className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">AI insights</p>
        <p className="mt-2 text-sm text-muted-foreground">No AI summary available for this snapshot.</p>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">AI insights</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Based on dashboard aggregate ({data.meta.basedOnSource}). Generated {data.meta.generatedAt}.
      </p>

      {stateItems.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {stateItems.map((item) => (
            <li key={item.id} className="rounded-md border border-border px-3 py-2">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.reason.text}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sources: {formatSourceRefsForDisplay(item.reason.sourceRefs)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {productPreview.length ? (
        <div className={stateItems.length ? "mt-4 border-t border-border pt-4" : "mt-3"}>
          <p className="text-xs font-medium text-muted-foreground">Suggested products (informational)</p>
          <ul className="mt-2 space-y-2 text-sm">
            {productPreview.map((p) => {
              const rangeText = formatBenefitRangeIlsMonthly(p.expectedBenefitRangeIlsMonthly);
              return (
                <li key={p.id} className="rounded-md border border-border px-3 py-2">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.useCase}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.whyRelevant.text}</p>
                  {rangeText ? <p className="mt-1 text-xs text-muted-foreground">Estimated benefit: {rangeText}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
