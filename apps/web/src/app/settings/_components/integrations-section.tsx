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

export type InverterVendorOption = "solaredge" | "mock";

export interface ConnectInverterInput {
  vendor: InverterVendorOption;
  apiKey: string;
  externalSystemId?: string;
}

export interface IntegrationsSectionProps {
  hardware: IntegrationItem[];
  services: IntegrationItem[];
  onConnect: (kind: IntegrationKind) => Promise<void>;
  /** Real inverter connect flow (Phase 9). Absent → button stays a stub. */
  onConnectInverter?: (input: ConnectInverterInput) => Promise<void>;
  /** Present only when an inverter connection exists. */
  onDisconnectInverter?: () => Promise<void>;
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
  onConnectInverter,
  onDisconnectInverter,
}: IntegrationsSectionProps) {
  const [connectingKind, setConnectingKind] = useState<IntegrationKind | null>(null);
  const [showInverterForm, setShowInverterForm] = useState(false);

  const handleConnect = async (kind: IntegrationKind) => {
    track("settings_control_change", { section: "integrations", controlId: `connect:${kind}` }, { surface: "settings" });
    if (kind === "inverter" && onConnectInverter) {
      setShowInverterForm((v) => !v);
      return;
    }
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
          {onDisconnectInverter ? (
            <button
              type="button"
              onClick={() => void onDisconnectInverter()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-background/60 px-3 py-1.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
            >
              Disconnect inverter
            </button>
          ) : null}
        </div>
        {showInverterForm && onConnectInverter ? (
          <InverterConnectForm
            onSubmit={async (input) => {
              await onConnectInverter(input);
              setShowInverterForm(false);
            }}
            onCancel={() => setShowInverterForm(false)}
          />
        ) : null}
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

function InverterConnectForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: ConnectInverterInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [vendor, setVendor] = useState<InverterVendorOption>("solaredge");
  const [apiKey, setApiKey] = useState("");
  const [externalSystemId, setExternalSystemId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSystemId = vendor === "solaredge";
  const canSubmit = apiKey.trim().length > 0 && (!needsSystemId || externalSystemId.trim().length > 0);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        vendor,
        apiKey: apiKey.trim(),
        externalSystemId: externalSystemId.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect the inverter.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Connect inverter
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs">
          <span className="font-medium">Vendor</span>
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value as InverterVendorOption)}
            className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
          >
            <option value="solaredge">SolarEdge</option>
            <option value="mock">Simulated (demo)</option>
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">
            API key{vendor === "mock" ? " (any value)" : ""}
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={vendor === "solaredge" ? "From monitoring portal → Admin → API access" : "demo"}
            className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
          />
        </label>
        {needsSystemId ? (
          <label className="space-y-1 text-xs sm:col-span-2">
            <span className="font-medium">SolarEdge site id</span>
            <input
              value={externalSystemId}
              onChange={(e) => setExternalSystemId(e.target.value)}
              placeholder="e.g. 1234567"
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit || busy}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {busy ? "Verifying…" : "Verify and connect"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg border border-border/70 px-4 py-2 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Read-only access. Your key is encrypted at rest and never shown again.
      </p>
    </div>
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
