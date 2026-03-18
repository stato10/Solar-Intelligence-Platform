import { BarChart3, TriangleAlert, Zap } from "lucide-react";

const cards = [
  {
    title: "Solar Health Score",
    value: "--",
    hint: "Connected in Phase 3/4 when engine outputs are integrated.",
    icon: Zap
  },
  {
    title: "Risk Alerts",
    value: "--",
    hint: "Weather and heat alerts will appear here.",
    icon: TriangleAlert
  },
  {
    title: "Opportunity Value",
    value: "--",
    hint: "Estimated financial opportunities will populate here.",
    icon: BarChart3
  }
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard Placeholder
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Structured shell for KPI cards and recommendation feed is ready.
        </p>
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
    </section>
  );
}
