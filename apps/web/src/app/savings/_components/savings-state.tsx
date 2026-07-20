import { AlertTriangle, Inbox } from "lucide-react";

interface SavingsErrorStateProps {
  message: string;
}

interface SavingsEmptyStateProps {
  message?: string;
}

export function SavingsErrorState({ message }: SavingsErrorStateProps) {
  return (
    <article className="glass-card state-danger rounded-2xl p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">
        Failed to load savings data
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </article>
  );
}

export function SavingsEmptyState({
  message = "Savings data is currently unavailable. Please try again shortly.",
}: SavingsEmptyStateProps) {
  return (
    <article className="glass-card rounded-2xl p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </article>
  );
}
