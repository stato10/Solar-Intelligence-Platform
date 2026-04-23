"use client";

/**
 * Integrations section — doc 08 §5.5.
 *
 * Connected hardware list + "Connect new" CTA + third-party services.
 * Determines which data is real vs estimated throughout the product.
 */

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Cable,
  Sun,
  CloudSun,
  Plug,
  BatteryCharging,
} from "lucide-react";
import { FormRow } from "./form-row";
import { SettingsSection } from "./settings-section";
import { track } from "@/lib/analytics/client";

export type IntegrationStatus = "connected" | "disconnected" | "error";
export type IntegrationKind =
  | "inverter"
  | "battery"
  | "smart-device"
  | "weather"
  | "tariff";

export interface IntegrationItem {
  id: string;
  kind: IntegrationKind;
  name: string;
  detail?: string;
  status: IntegrationStatus;
}

export interface IntegrationsSectionProps {
  hardware: IntegrationItem[];
  services: IntegrationItem[];
  onConnect: (kind: IntegrationKind) => Promise<void>;
}

const ICON_BY_KIND = {
  inverter: Sun,
  battery: BatteryCharging,
  "smart-device": Plug,
  weather: CloudSun,
  tariff: Cable,
} as const;

const STATUS_STYLE: Record<IntegrationStatus, { chip: string; icon: typeof CheckCircle2; label: string }> = {
  connected: {
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    icon: CheckCircle2,
    label: "Connected",
  },
  disconnected: {
    chip: "bg-muted text-muted-foreground border-border/60",
    icon: XCircle,
    label: "Not connected",
  },
  error: {
    chip: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    icon: AlertCircle,
    label: "Needs attention",
  },
};

export function IntegrationsSection({
  hardware,
  services,
  onConnect,
}: IntegrationsSectionProps) {
  const [connectingKind, setConnectingKind] = useState<IntegrationKind | null>(null);

  const handleConnect = async (kind: IntegrationKind) => {
    track("settings_control_change", { section: "integrations", controlId: `connect:${kind}` }, { surface: "settings" });
    setConnectingKind(kind);
    try {
      await onConnect(kind);
    } finally {
      setConnectingKind(null);
    }
  };

  return (
    <SettingsSection
      id="integrations"
      title="Integrations"
      description="Connected hardware and third-party services. Determines which data is real vs estimated."
      hideSave
    >
      <FormRow label="Hardware" helper="Connect your inverter, battery, or smart switches for live data.">
        <ul className="divide-y divide-border/40">
          {hardware.map((item) => (
            <IntegrationRow key={item.id} item={item} />
          ))}
          {hardware.length === 0 ? (
            <li className="py-2 text-xs text-muted-foreground">No hardware connected yet.</li>
          ) : null}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <ConnectButton kind="inverter" onClick={handleConnect} busyKind={connectingKind} label="Connect inverter" />
          <ConnectButton kind="battery" onClick={handleConnect} busyKind={connectingKind} label="Connect battery" />
          <ConnectButton kind="smart-device" onClick={handleConnect} busyKind={connectingKind} label="Connect smart device" />
        </div>
      </FormRow>

      <FormRow label="Third-party services" helper="Weather and tariff providers that feed the engine.">
        <ul className="divide-y divide-border/40">
          {services.map((item) => (
            <IntegrationRow key={item.id} item={item} />
          ))}
          {services.length === 0 ? (
            <li className="py-2 text-xs text-muted-foreground">No third-party services configured.</li>
          ) : null}
        </ul>
      </FormRow>
    </SettingsSection>
  );
}

function IntegrationRow({ item }: { item: IntegrationItem }) {
  const Icon = ICON_BY_KIND[item.kind];
  const style = STATUS_STYLE[item.status];
  const StatusIcon = style.icon;
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground shrink-0">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          {item.detail ? (
            <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
          ) : null}
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.chip}`}
      >
        <StatusIcon className="h-3 w-3" aria-hidden />
        {style.label}
      </span>
    </li>
  );
}

function ConnectButton({
  kind,
  onClick,
  busyKind,
  label,
}: {
  kind: IntegrationKind;
  onClick: (kind: IntegrationKind) => void;
  busyKind: IntegrationKind | null;
  label: string;
}) {
  const busy = busyKind === kind;
  return (
    <button
      type="button"
      onClick={() => onClick(kind)}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Opening…" : label}
    </button>
  );
}
