interface DashboardErrorStateProps {
  message: string;
}

interface DashboardEmptyStateProps {
  message?: string;
}

export function DashboardErrorState({ message }: DashboardErrorStateProps) {
  return (
    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Failed to load dashboard: {message}
    </div>
  );
}

export function DashboardEmptyState({
  message = "Dashboard data is currently unavailable. Please try again shortly."
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
