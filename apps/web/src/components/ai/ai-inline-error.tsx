interface AiInlineErrorProps {
  message: string;
}

export function AiInlineError({ message }: AiInlineErrorProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      AI insights unavailable: {message}
    </div>
  );
}
