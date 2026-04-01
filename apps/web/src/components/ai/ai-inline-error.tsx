interface AiInlineErrorProps {
  message: string;
}

interface AiInlineEmptyProps {
  message: string;
}

interface AiStateCardProps {
  title: string;
  children: React.ReactNode;
}

export function AiStateCard({ title, children }: AiStateCardProps) {
  return (
    <article className="glass-card rounded-2xl p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <div className="mt-2">{children}</div>
    </article>
  );
}

export function AiInlineError({ message }: AiInlineErrorProps) {
  return (
    <div className="state-danger rounded-xl border px-3 py-2 text-sm">
      AI insights unavailable: {message}
    </div>
  );
}

export function AiInlineEmpty({ message }: AiInlineEmptyProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-card/60 px-3 py-2 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
