import { AlertTriangle, Inbox } from "lucide-react";

interface DashboardErrorStateProps {
  message: string;
}

interface DashboardEmptyStateProps {
  message?: string;
}

export function DashboardErrorState({ message }: DashboardErrorStateProps) {
  return (
    <article className="glass-card state-danger rounded-2xl p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">
        Failed to load dashboard
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </article>
  );
}

export function DashboardEmptyState({
  message = "Dashboard data is currently unavailable. Please try again shortly.",
}: DashboardEmptyStateProps) {
  return (
    <article className="glass-card rounded-2xl p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </article>
  );
}
