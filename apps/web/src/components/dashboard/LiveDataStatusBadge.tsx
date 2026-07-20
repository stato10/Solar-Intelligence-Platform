import { Radio, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveDataStatusBadgeProps {
  providers?: {
    weather: string;
    solar: string;
    engine: string;
  };
  className?: string;
}

function isLiveSource(source: string): boolean {
  const normalized = source.toLowerCase();
  return normalized !== "fallback" && !normalized.includes("mock");
}

/**
 * Shows whether the current dashboard numbers are backed by live provider
 * data (Open-Meteo / PVGIS at the site's real coordinates) or by
 * conservative fallback estimates after a provider failure.
 */
export function LiveDataStatusBadge({ providers, className }: LiveDataStatusBadgeProps) {
  if (!providers) return null;

  const live = isLiveSource(providers.weather) && isLiveSource(providers.solar);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        live
          ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-400",
        className
      )}
      role="status"
    >
      {live ? (
        <Radio className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>
        {live
          ? "Live local data is being used for this site."
          : "Live data is currently unavailable. The system is using conservative fallback estimates."}
      </span>
    </div>
  );
}
