function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-border bg-card/60 animate-pulse ${className ?? "h-32"}`}
      aria-hidden="true"
    />
  );
}

export default function MaintenanceLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="h-8 w-52 rounded bg-muted animate-pulse" aria-hidden="true" />
        <div className="mt-3 h-4 w-96 rounded bg-muted animate-pulse" aria-hidden="true" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LoadingCard />
        <LoadingCard />
      </div>

      <LoadingCard className="h-48" />
      <div className="grid gap-4 md:grid-cols-2">
        <LoadingCard className="h-52" />
        <LoadingCard className="h-52" />
      </div>
    </section>
  );
}
