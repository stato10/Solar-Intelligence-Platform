"use client";

/**
 * AutomationDayTimeline — doc 06 §6.
 *
 * Horizontal 24-hour strip with three shaded bands (Morning 06–10,
 * Peak solar 10–16, Evening 16–22) and overlay segments per
 * recommended device window. Legend row below lists each device with
 * a colored dot; hovering an overlay reveals a tooltip with the
 * device name, window, and monthly gain.
 *
 * Implemented as a plain responsive CSS grid so it scales from a
 * 360px phone viewport up to the 1280-wide page container without
 * a 3rd-party charting dep.
 */

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/lib/utils/formatters";
import { track } from "@/lib/analytics/client";
import type {
  AutomationDeviceTarget,
  SmartDeviceRecommendationVm,
} from "@/lib/view-models/automation";

// Device palette — 4 distinct bands that read on dark or light
// backgrounds. Keyed off `deviceTarget` so every lane is stable across
// re-renders even when the engine reorders the actions array.
const DEVICE_COLOR: Record<AutomationDeviceTarget, { bg: string; ring: string; dot: string }> = {
  boiler: {
    bg: "bg-amber-500/70 hover:bg-amber-500/85",
    ring: "ring-amber-500/50",
    dot: "bg-amber-500",
  },
  dishwasher: {
    bg: "bg-sky-500/70 hover:bg-sky-500/85",
    ring: "ring-sky-500/50",
    dot: "bg-sky-500",
  },
  "ev-charger": {
    bg: "bg-emerald-500/70 hover:bg-emerald-500/85",
    ring: "ring-emerald-500/50",
    dot: "bg-emerald-500",
  },
  "smart-switch": {
    bg: "bg-violet-500/70 hover:bg-violet-500/85",
    ring: "ring-violet-500/50",
    dot: "bg-violet-500",
  },
};

function hourToPercent(label: string): number {
  const [h, m = "0"] = label.split(":");
  const hours = parseInt(h, 10);
  const mins = parseInt(m, 10);
  const total = Math.max(0, Math.min(24, hours + (isFinite(mins) ? mins / 60 : 0)));
  return (total / 24) * 100;
}

export interface AutomationDayTimelineProps {
  devices: SmartDeviceRecommendationVm[];
  siteId: string;
}

export function AutomationDayTimeline({ devices, siteId }: AutomationDayTimelineProps) {
  const { currency, locale } = useCurrency();
  const [hovered, setHovered] = useState<string | null>(null);

  const deviceLanes = useMemo(
    () =>
      devices.map((device, idx) => ({
        device,
        idx,
        startPct: hourToPercent(device.windowStart),
        endPct: hourToPercent(device.windowEnd),
      })),
    [devices],
  );

  const handleHover = (device: SmartDeviceRecommendationVm) => {
    setHovered(device.id);
    track(
      "automation_timeline_hover",
      {
        deviceTarget: device.deviceTarget,
        windowStart: device.windowStart,
        windowEnd: device.windowEnd,
      },
      { surface: "automation_device", siteId },
    );
  };

  const hourTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  // 3 bands: Morning (06–10), Peak solar (10–16), Evening (16–22).
  const bands = [
    { label: "Morning", start: 6, end: 10, tone: "bg-sky-400/10 border-sky-400/30" },
    { label: "Peak solar", start: 10, end: 16, tone: "bg-amber-400/15 border-amber-400/40" },
    { label: "Evening", start: 16, end: 22, tone: "bg-indigo-400/10 border-indigo-400/30" },
  ];

  return (
    <article className="glass-card rounded-2xl p-5 md:p-8">
      <header className="mb-5 flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-500" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight">Your day, shifted to solar</h2>
      </header>

      {/* Band row */}
      <div className="relative h-6">
        {bands.map((band) => {
          const left = (band.start / 24) * 100;
          const width = ((band.end - band.start) / 24) * 100;
          return (
            <div
              key={band.label}
              className={`absolute inset-y-0 rounded-md border text-[10px] font-medium uppercase tracking-wider text-foreground/70 flex items-center justify-center ${band.tone}`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="px-2 truncate">{band.label}</span>
            </div>
          );
        })}
      </div>

      {/* Device lanes — one row per device so overlays never visually collide. */}
      <div className="mt-3 space-y-2">
        {deviceLanes.length === 0 ? (
          <div className="relative h-10 rounded-md border border-dashed border-border/60 bg-muted/40" />
        ) : (
          deviceLanes.map(({ device, startPct, endPct }) => {
            const color = DEVICE_COLOR[device.deviceTarget];
            const width = Math.max(2, endPct - startPct);
            const isHovered = hovered === device.id;
            return (
              <div
                key={device.id}
                className="relative h-10 rounded-md border border-border/40 bg-muted/30"
              >
                <button
                  type="button"
                  onMouseEnter={() => handleHover(device)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => handleHover(device)}
                  onBlur={() => setHovered(null)}
                  className={`absolute inset-y-1 rounded-md shadow-sm transition-all ${color.bg} ${isHovered ? `ring-2 ${color.ring}` : ""}`}
                  style={{ left: `${startPct}%`, width: `${width}%` }}
                  aria-label={`${device.deviceName} window ${device.windowLabel}, estimated gain ${formatCurrency(device.monthlyGainNis, { currency, locale, decimals: 0 })} per month`}
                >
                  <span className="sr-only">
                    {device.deviceName} — {device.windowLabel}
                  </span>
                </button>
                {isHovered ? (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute -top-12 z-10 rounded-lg border border-border/60 bg-background/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur"
                    style={{
                      left: `${Math.min(85, Math.max(0, startPct + width / 2 - 8))}%`,
                    }}
                  >
                    <p className="font-semibold">{device.deviceName}</p>
                    <p className="text-muted-foreground">
                      {device.windowLabel} ·{" "}
                      {formatCurrency(device.monthlyGainNis, { currency, locale, decimals: 0 })} / mo
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Tick row */}
      <div className="relative mt-3 h-4">
        {hourTicks.map((h) => {
          const left = (h / 24) * 100;
          return (
            <span
              key={h}
              className="absolute top-0 -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground"
              style={{ left: `${left}%` }}
            >
              {String(h).padStart(2, "0")}:00
            </span>
          );
        })}
      </div>

      {/* Legend */}
      {deviceLanes.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-xs">
          {deviceLanes.map(({ device }) => {
            const color = DEVICE_COLOR[device.deviceTarget];
            return (
              <li key={device.id} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${color.dot}`}
                  aria-hidden
                />
                <span className="font-medium">{device.deviceName}</span>
                <span className="text-muted-foreground">
                  {device.windowLabel}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
