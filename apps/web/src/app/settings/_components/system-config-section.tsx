"use client";

/**
 * Your solar system — doc 08 §5.1.
 *
 * This is the surface a returning user lands on to **edit the physical
 * system they already have**. Controls are grouped by mental model:
 *
 *   1. Location    — address → lat/lng via OpenCage, plus country code
 *                    used by the Tariffs section to propose defaults.
 *   2. Panels      — size (kWp), count, type.
 *   3. Inverter    — brand / model string.
 *   4. Orientation — tilt, azimuth.
 *   5. Installation — install date.
 *
 * Downstream effect: drives baseline production forecasts, soiling
 * expectations, and heat thresholds. Editing any field here will
 * re-price every recommendation on the next dashboard refresh.
 *
 * Persistence: optimistic local state. No dedicated PATCH endpoint
 * exists in the backend today (onboarding only exposes POST). Values
 * are committed to an in-session override and surfaced via a callback
 * so higher levels can trigger `router.refresh()` once a real endpoint
 * lands.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { geocodeAddress } from "@/lib/api/geocoding";
import { getCountryName } from "@/lib/utils/tariff-defaults";
import { FormGroup, FormRow, NumberInput, Select, TextInput } from "./form-row";
import { SettingsSection } from "./settings-section";

const ACCESS_TOKEN_KEY = "sip.accessToken";

export interface SystemConfigFormValues {
  address: string;
  latitude: number | "";
  longitude: number | "";
  countryCode: string;
  systemSizeKw: number | "";
  panelCount: number | "";
  panelType: string;
  inverterModel: string;
  tiltDegrees: number | "";
  azimuthDegrees: number | "";
  installationDate: string; // YYYY-MM-DD
}

export interface SystemConfigSectionProps {
  initial: SystemConfigFormValues;
  /** When true, shows the first-run banner per doc 08 §8. */
  noData?: boolean;
  /** Displayed in the edit-mode banner so the user sees which system they're editing. */
  siteName?: string | null;
  onSave: (values: SystemConfigFormValues) => Promise<void>;
  /**
   * Called when the user resolves a new address. The settings shell
   * propagates the ISO country code to the Tariffs section so it can
   * propose typical rates.
   */
  onLocationResolved?: (countryCode: string) => void;
}

export function SystemConfigSection({
  initial,
  noData,
  siteName,
  onSave,
  onLocationResolved,
}: SystemConfigSectionProps) {
  const [values, setValues] = useState<SystemConfigFormValues>(initial);
  const [geocoding, setGeocoding] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);

  const update = <K extends keyof SystemConfigFormValues>(
    key: K,
    value: SystemConfigFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canResolve = values.address.trim().length >= 3 && !geocoding;

  async function handleResolveAddress() {
    setResolveError(null);
    setResolvedLabel(null);

    if (values.address.trim().length < 3) {
      setResolveError("Enter at least 3 characters before resolving.");
      return;
    }

    setGeocoding(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined
          : undefined;
      const result = await geocodeAddress(values.address, token);

      if (!result) {
        setResolveError("Could not resolve that address. Try adding the city or country.");
        return;
      }

      setValues((prev) => ({
        ...prev,
        latitude: Number(result.lat.toFixed(6)),
        longitude: Number(result.lon.toFixed(6)),
        countryCode: result.countryCode?.toUpperCase() ?? prev.countryCode,
      }));
      setResolvedLabel(result.formattedAddress);

      if (result.countryCode && onLocationResolved) {
        onLocationResolved(result.countryCode.toUpperCase());
      }
    } catch (err) {
      setResolveError(
        err instanceof Error ? err.message : "Address resolution failed unexpectedly.",
      );
    } finally {
      setGeocoding(false);
    }
  }

  const countryName = getCountryName(values.countryCode);

  // "Edit mode" = we already have some data to edit. Drives the header
  // copy so returning users see a welcoming "Your solar system" frame
  // and first-run users see "Set up your solar system" framing.
  const editMode = !noData;

  return (
    <SettingsSection
      id="system-configuration"
      title={editMode ? "Your solar system" : "Set up your solar system"}
      description={
        editMode
          ? "Edit the physical setup of your existing system. Changing any field here re-prices every recommendation on the next refresh — forecasts, soiling expectations, heat thresholds."
          : "Describe the system you have installed so the product can generate real forecasts instead of estimates."
      }
      onSave={() => onSave(values)}
      banner={
        noData ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <p className="font-medium">No system on file yet.</p>
            <p className="mt-0.5">
              Complete this section to unlock real recommendations. The rest of
              the product runs on estimates until the system is configured.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 p-3 text-xs md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-5 items-center rounded-full bg-emerald-500/10 px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Edit mode
              </span>
              <p className="text-muted-foreground">
                {siteName ? (
                  <>
                    Editing <span className="font-medium text-foreground">{siteName}</span>.
                  </>
                ) : (
                  <>Editing your existing system.</>
                )}{" "}
                Changes save to your profile and re-flow into the dashboard.
              </p>
            </div>
          </div>
        )
      }
    >
      {/* ── 1. Location ─────────────────────────────────────────────── */}
      <FormGroup
        title="Location"
        description="Used for solar forecasts and country-based tariff defaults."
      >
        <FormRow
          label="Address"
          htmlFor="sys-address"
          helper="Type your address, then Resolve. We'll fill lat/lng and remember the country."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <TextInput
              id="sys-address"
              value={values.address}
              onChange={(e) => {
                setResolvedLabel(null);
                setResolveError(null);
                update("address", e.target.value);
              }}
              placeholder="123 Solar St, Tel Aviv"
            />
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={!canResolve}
              onClick={handleResolveAddress}
              className="shrink-0"
            >
              {geocoding ? (
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Resolving…
                </span>
              ) : (
                "Resolve"
              )}
            </Button>
          </div>
          {resolveError ? (
            <p className="mt-2 text-xs text-rose-500">{resolveError}</p>
          ) : null}
          {resolvedLabel ? (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              Resolved: <span className="font-medium">{resolvedLabel}</span>
              {countryName ? ` · ${countryName}` : null}
            </p>
          ) : null}
        </FormRow>

        <FormRow
          label="Latitude"
          htmlFor="sys-lat"
          hint="°"
          helper="Auto-filled from Resolve; adjust if needed."
        >
          <NumberInput
            id="sys-lat"
            step={0.000001}
            min={-90}
            max={90}
            value={values.latitude === "" ? "" : values.latitude}
            onChange={(e) => update("latitude", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </FormRow>

        <FormRow label="Longitude" htmlFor="sys-lon" hint="°">
          <NumberInput
            id="sys-lon"
            step={0.000001}
            min={-180}
            max={180}
            value={values.longitude === "" ? "" : values.longitude}
            onChange={(e) => update("longitude", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </FormRow>
      </FormGroup>

      {/* ── 2. Panels ───────────────────────────────────────────────── */}
      <FormGroup
        title="Panels"
        description="Size and type of your array — drives the production forecast."
      >
        <FormRow label="System size" htmlFor="sys-size" hint="kWp" required>
          <NumberInput
            id="sys-size"
            min={0}
            step={0.1}
            value={values.systemSizeKw === "" ? "" : values.systemSizeKw}
            onChange={(e) => update("systemSizeKw", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </FormRow>

        <FormRow label="Panel count" htmlFor="panel-count" helper="Total panels installed.">
          <NumberInput
            id="panel-count"
            min={0}
            step={1}
            value={values.panelCount === "" ? "" : values.panelCount}
            onChange={(e) => update("panelCount", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </FormRow>

        <FormRow label="Panel type" htmlFor="panel-type" helper="Monocrystalline, polycrystalline, or bifacial.">
          <Select
            id="panel-type"
            title="Panel type"
            aria-label="Panel type"
            value={values.panelType}
            onChange={(e) => update("panelType", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="mono">Monocrystalline</option>
            <option value="poly">Polycrystalline</option>
            <option value="bifacial">Bifacial</option>
            <option value="other">Other</option>
          </Select>
        </FormRow>
      </FormGroup>

      {/* ── 3. Inverter ─────────────────────────────────────────────── */}
      <FormGroup title="Inverter" description="Used for integration matching and warranty context.">
        <FormRow label="Brand / model" htmlFor="inverter">
          <TextInput
            id="inverter"
            value={values.inverterModel}
            onChange={(e) => update("inverterModel", e.target.value)}
            placeholder="e.g. SolarEdge SE10K"
          />
        </FormRow>
      </FormGroup>

      {/* ── 4. Orientation ──────────────────────────────────────────── */}
      <FormGroup
        title="Orientation"
        description="Advanced — refines the sun-angle model. Leave blank to auto-derive from location."
      >
        <FormRow label="Tilt" htmlFor="tilt" hint="°">
          <NumberInput
            id="tilt"
            min={0}
            max={90}
            step={1}
            value={values.tiltDegrees === "" ? "" : values.tiltDegrees}
            onChange={(e) => update("tiltDegrees", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </FormRow>

        <FormRow label="Azimuth" htmlFor="azimuth" hint="°" helper="Compass direction panels face (180 = south).">
          <NumberInput
            id="azimuth"
            min={0}
            max={360}
            step={1}
            value={values.azimuthDegrees === "" ? "" : values.azimuthDegrees}
            onChange={(e) => update("azimuthDegrees", e.target.value === "" ? "" : Number(e.target.value))}
          />
        </FormRow>
      </FormGroup>

      {/* ── 5. Installation ─────────────────────────────────────────── */}
      <FormGroup
        title="Installation"
        description="Used to project panel aging and surface warranty reminders."
      >
        <FormRow label="Installation date" htmlFor="install-date">
          <TextInput
            id="install-date"
            type="date"
            value={values.installationDate}
            onChange={(e) => update("installationDate", e.target.value)}
          />
        </FormRow>
      </FormGroup>
    </SettingsSection>
  );
}
