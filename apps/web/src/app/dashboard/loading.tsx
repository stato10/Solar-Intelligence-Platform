function LoadingCard() {
  return <div className="h-28 rounded-xl border border-border bg-card/60 animate-pulse" aria-hidden="true" />;
}

export default function DashboardLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="h-8 w-52 rounded bg-muted animate-pulse" aria-hidden="true" />
        <div className="mt-3 h-4 w-80 rounded bg-muted animate-pulse" aria-hidden="true" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 rounded-xl border border-border bg-card/60 animate-pulse" aria-hidden="true" />
        <div className="h-32 rounded-xl border border-border bg-card/60 animate-pulse" aria-hidden="true" />
      </div>

      <div className="h-10 rounded-xl border border-border bg-card/60 animate-pulse" aria-hidden="true" />
    </section>
  );
}
