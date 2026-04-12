import { Droplets, Thermometer, AlertTriangle, CalendarCheck, ShieldAlert } from "lucide-react";
import type { MaintenanceSummaryVm } from "@/lib/view-models/dashboard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MaintenancePanelProps {
  maintenance: MaintenanceSummaryVm;
}

export function MaintenancePanel({ maintenance }: MaintenancePanelProps) {
  return (
    <article id="maintenance-panel" className="glass-card rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Maintenance & Risks
        </p>
        {maintenance.alertCount > 0 && (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400"
          >
            <ShieldAlert className="h-3 w-3" />
            {maintenance.alertCount} alert{maintenance.alertCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {/* Soiling */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-0.5 rounded-lg p-2",
            maintenance.cleaningRecommended
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}>
            <Droplets className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Soiling</p>
              <span className="text-xs text-muted-foreground">{maintenance.soilingScore}</span>
            </div>
            <p className="text-xs text-muted-foreground">Loss: {maintenance.soilingLoss}</p>
            {maintenance.cleaningRecommended && (
              <div className="mt-2 flex items-center gap-2 rounded-lg state-warning px-3 py-2">
                <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                <p className="text-xs font-medium">
                  Cleaning recommended {maintenance.cleaningDate !== "--" ? `by ${maintenance.cleaningDate}` : ""}
                </p>
              </div>
            )}
            {!maintenance.cleaningRecommended && (
              <p className="mt-1 text-xs text-muted-foreground">Soiling is under control</p>
            )}
          </div>
        </div>

        {/* Heat */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400">
            <Thermometer className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Heat Impact</p>
              <span className="text-xs text-muted-foreground">{maintenance.heatScore}</span>
            </div>
            <p className="text-xs text-muted-foreground">Loss: {maintenance.heatLoss}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Peak window: {maintenance.heatWindow}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {maintenance.alerts.length > 0 && (
          <div className="space-y-2 border-t border-border/80 pt-3">
            {maintenance.alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs",
                  alert.severity === "high" ? "state-danger" :
                  alert.severity === "moderate" ? "state-warning" : "state-good"
                )}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-medium capitalize">{alert.type}</p>
                  <p className="text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
