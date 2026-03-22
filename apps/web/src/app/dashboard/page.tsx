import { BarChart3, TriangleAlert, Zap } from "lucide-react";

interface RecommendationItem {
  id: string;
  title: string;
  message: string;
  severity: string;
}

interface DashboardPayload {
  soiling: { score: number };
  risks: { alerts: unknown[] };
  optimization: {
    estimatedValue: number;
    recommendations: RecommendationItem[];
  };
  financial: {
    dailyEstimatedSavings: number;
    monthlyEstimatedSavings: number;
  };
  providers: {
    weather: string;
    solar: string;
  };
}

async function loadDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api/v1";
  const response = await fetch(`${apiBase}/dashboard/demo/seed`, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed with status ${response.status}`);
  }

  const envelope = (await response.json()) as {
    success: boolean;
    data?: {
      dashboard: DashboardPayload;
    };
  };

  if (!envelope.success || !envelope.data?.dashboard) {
    throw new Error("Dashboard response payload is invalid");
  }

  return envelope.data.dashboard;
}

export default async function DashboardPage() {
  let dashboard: DashboardPayload | null = null;
  let errorMessage: string | null = null;

  try {
    dashboard = await loadDashboard();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown dashboard error";
  }

  const cards = [
    {
      title: "Solar Health Score",
      value: dashboard ? `${dashboard.soiling.score.toFixed(2)} / 100` : "--",
      hint: "Deterministic soiling score from engine.",
      icon: Zap
    },
    {
      title: "Risk Alerts",
      value: dashboard ? String(dashboard.risks.alerts.length) : "--",
      hint: "Weather, heat, and soiling alerts from risk module.",
      icon: TriangleAlert
    },
    {
      title: "Opportunity Value",
      value: dashboard ? `${dashboard.optimization.estimatedValue.toFixed(2)} ILS` : "--",
      hint: "Estimated optimization value from opportunity module.",
      icon: BarChart3
    }
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Solar Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Live data is pulled from the aggregated backend endpoint.
        </p>
        {errorMessage ? (
          <p className="mt-3 text-sm text-red-500">Failed to load dashboard: {errorMessage}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <card.icon className="mb-3 h-5 w-5 text-primary" />
            <p className="text-xs text-muted-foreground">{card.title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Financial Snapshot</p>
          <p className="mt-2 text-sm">
            Daily savings:{" "}
            <span className="font-semibold">
              {dashboard ? `${dashboard.financial.dailyEstimatedSavings.toFixed(2)} ILS` : "--"}
            </span>
          </p>
          <p className="mt-1 text-sm">
            Monthly savings:{" "}
            <span className="font-semibold">
              {dashboard ? `${dashboard.financial.monthlyEstimatedSavings.toFixed(2)} ILS` : "--"}
            </span>
          </p>
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Recommendations</p>
          <ul className="mt-2 space-y-2 text-sm">
            {dashboard?.optimization.recommendations?.length ? (
              dashboard.optimization.recommendations.map((item) => (
                <li key={item.id} className="rounded-md border border-border px-3 py-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">No recommendations available.</li>
            )}
          </ul>
        </article>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-xs text-muted-foreground">
        Data providers: weather={dashboard?.providers.weather ?? "--"}, solar=
        {dashboard?.providers.solar ?? "--"}
      </div>
    </section>
  );
}
