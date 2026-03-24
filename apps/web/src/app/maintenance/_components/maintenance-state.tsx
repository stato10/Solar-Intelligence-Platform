interface MaintenanceErrorStateProps {
  message: string;
}

interface MaintenanceEmptyStateProps {
  message?: string;
}

export function MaintenanceErrorState({ message }: MaintenanceErrorStateProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Failed to load maintenance data: {message}
    </div>
  );
}

export function MaintenanceEmptyState({
  message = "Maintenance data is currently unavailable. Please try again shortly."
}: MaintenanceEmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
