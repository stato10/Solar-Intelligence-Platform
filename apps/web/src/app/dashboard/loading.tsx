import { Skeleton } from "@/components/ui/skeleton";

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 md:p-6" aria-hidden="true">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section className="space-y-6 pb-12" aria-busy="true" aria-live="polite">
      {/* 1. Hero */}
      <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
        <Skeleton className="h-6 w-32 mb-6 rounded-md" />
        <Skeleton className="h-10 w-3/4 max-w-xl mb-4" />
        <Skeleton className="h-4 w-2/3 max-w-md mb-8" />
        <div className="mt-8">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>

      {/* 2. Performance Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>

      {/* 3 & 4. Maintenance and Savings */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/60 p-5 md:p-6 space-y-4">
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="flex gap-4"><Skeleton className="h-8 w-8 rounded-lg" /><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-32" /></div></div>
          <div className="flex gap-4"><Skeleton className="h-8 w-8 rounded-lg" /><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-32" /></div></div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-5 md:p-6 space-y-4">
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
          <div className="mt-8 pt-4 border-t border-border/50"><Skeleton className="h-8 w-full" /></div>
        </div>
      </div>

      {/* 5. Usage Window Card */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 md:p-6 space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* 6. AI Insights */}
      <div className="pt-2 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </section>
  );
}
