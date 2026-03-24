interface SavingsErrorStateProps {
  message: string;
}

interface SavingsEmptyStateProps {
  message?: string;
}

export function SavingsErrorState({ message }: SavingsErrorStateProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      Failed to load savings data: {message}
    </div>
  );
}

export function SavingsEmptyState({
  message = "Savings data is currently unavailable. Please try again shortly."
}: SavingsEmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
