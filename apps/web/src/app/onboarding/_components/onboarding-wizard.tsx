"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, Zap, Home, Receipt, CheckCircle2,
  ChevronRight, ChevronLeft, Info, Loader2, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/contracts";
import type { OnboardingStep1Snapshot } from "@/lib/contracts/onboarding-step1";
import { getDefaultTariff } from "@/lib/utils/tariff";
import {
  COUNTRY_TARIFF_DEFAULTS,
  SUPPORTED_TARIFF_COUNTRY_CODES,
  getTariffDefaultsForCountry,
} from "@/lib/utils/tariff-defaults";
import {
  OnboardingApiError,
  createSite,
  createSolarSystem,
  createDeviceProfile,
  createTariff,
  resolveDomainUserId,
} from "@/lib/api/onboarding";
import { geocodeAddress } from "@/lib/api/geocoding";
import { setActiveSite } from "@/app/actions";
import {
  generateSolarSetupExplanation,
  isValidIanaTimezone,
  type SolarSetupRecommendation,
} from "@/lib/utils/solar-setup";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "sip.accessToken";
const AUTH_USER_KEY = "sip.authUser";
const STEP1_SNAPSHOT_KEY = "sip.onboarding.step1";
const STEP2_SNAPSHOT_KEY = "sip.onboarding.step2";

const TOTAL_DATA_STEPS = 5; // Steps 2–6 (step 1 is welcome)
const STEPS = [
  { id: 1, label: "Welcome", icon: Sun },
  { id: 2, label: "Site", icon: MapPin },
  { id: 3, label: "System", icon: Zap },
  { id: 4, label: "Devices", icon: Home },
  { id: 5, label: "Tariff", icon: Receipt },
  { id: 6, label: "Done", icon: CheckCircle2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: string) { return Number(v.trim()); }

function parseAuthUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof p.id === "string" && typeof p.fullName === "string" && typeof p.email === "string" && typeof p.role === "string") {
      return p as AuthUser;
    }
  } catch { return null; }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldTooltip({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground">{children}</p>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
      {message}
    </div>
  );
}

type DeviceKey = "hasBoiler" | "hasEv" | "hasBattery" | "hasDishwasher" | "hasWashingMachine" | "hasAc";

interface DeviceCardProps {
  keyName: DeviceKey;
  label: string;
  description: string;
  emoji: string;
  checked: boolean;
  onChange: (key: DeviceKey, value: boolean) => void;
  disabled: boolean;
}

function DeviceCard({ keyName, label, description, emoji, checked, onChange, disabled }: DeviceCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(keyName, !checked)}
      aria-pressed={checked}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked
          ? "border-primary bg-primary/8 shadow-sm"
          : "border-border bg-card/60 hover:bg-muted/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl" role="img" aria-label={label}>{emoji}</span>
        <div className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
          checked ? "border-primary bg-primary" : "border-border"
        )}>
          {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {STEPS.map((s) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              active ? "w-8 bg-primary" : done ? "w-4 bg-primary/40" : "w-4 bg-border"
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 — Site
  const [siteName, setSiteName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jerusalem");
  const [geocoding, setGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  // Location-based setup recommendation, regenerated on every resolve.
  const [setupRec, setSetupRec] = useState<SolarSetupRecommendation | null>(null);

  // Step 3 — Solar System
  const [systemSizeKw, setSystemSizeKw] = useState("8.5");
  const [tilt, setTilt] = useState("20");
  const [azimuth, setAzimuth] = useState("180");
  const [panelWattage, setPanelWattage] = useState("400");
  const [panelEfficiency, setPanelEfficiency] = useState("20");
  const [inverterType, setInverterType] = useState("");
  const [lastCleaningDate, setLastCleaningDate] = useState("");

  // Step 4 — Devices
  const [devices, setDevices] = useState<Record<DeviceKey, boolean>>({
    hasBoiler: false, hasEv: false, hasBattery: false,
    hasDishwasher: false, hasWashingMachine: false, hasAc: false,
  });
  const [flexLevel, setFlexLevel] = useState(3);

  // Step 5 — Tariff
  const [selfConsumptionRate, setSelfConsumptionRate] = useState("0.62");
  const [exportRate, setExportRate] = useState("0.28");
  const [currency, setCurrency] = useState("ILS");
  // Country the tariff defaults come from ("" = Other / manual entry).
  const [tariffCountry, setTariffCountry] = useState("IL");

  // Derived snapshot holder
  const [step1Snapshot, setStep1Snapshot] = useState<OnboardingStep1Snapshot | null>(null);

  const todayDateValue = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ── Apply country defaults when address is resolved or the user picks
  //    a country in the tariff step. Currency + typical rates follow the
  //    chosen country automatically; the user can still edit everything.
  const applyCountryDefaults = (code: string | null) => {
    const defaults = getDefaultTariff(code ?? undefined);
    setSelfConsumptionRate(String(defaults.selfConsumptionRate));
    setExportRate(String(defaults.exportRate));
    setCurrency(defaults.currency);
    if (code && getTariffDefaultsForCountry(code)) {
      setTariffCountry(code.toUpperCase());
    }
  };

  // ── Location-based setup recommendation ──
  // Generates dynamic suggestions (tilt/azimuth/efficiency) for the resolved
  // coordinates and pre-fills the editable step-3 fields. Real installation
  // data (system size, panel wattage, inverter) is never guessed.
  function applyLocationRecommendation(params: {
    resolvedAddress: string;
    latitude: number;
    longitude: number;
    timezone: string;
    country?: string;
  }) {
    const rec = generateSolarSetupExplanation(params);
    setSetupRec(rec);
    setTilt(String(rec.recommendedTilt));
    setAzimuth(String(rec.recommendedAzimuth));
    setPanelEfficiency(String(rec.recommendedEfficiency));
  }

  // ── Use the browser's real location ──
  const [locating, setLocating] = useState(false);
  function handleUseMyLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat.toFixed(4));
        setLongitude(lon.toFixed(4));
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setTimezone(tz);
        setResolvedAddress(null);
        applyLocationRecommendation({
          resolvedAddress: "your current location",
          latitude: lat,
          longitude: lon,
          timezone: tz ?? timezone,
        });
        setLocating(false);
      },
      () => {
        setError("Could not read your location. Allow location access or enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Geocode address ──
  async function handleGeocode() {
    if (address.trim().length < 3) return;
    setGeocoding(true);
    setError(null);
    setResolvedAddress(null);
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
      const result = await geocodeAddress(address, token);
      if (!result) {
        setError("Could not resolve address. Enter coordinates manually or try a different address.");
        return;
      }
      setLatitude(String(result.lat));
      setLongitude(String(result.lon));
      // Only accept real IANA timezones (e.g. "Asia/Jerusalem"), never vague
      // values like a country name. Fall back to the browser's IANA zone.
      const resolvedTz =
        result.timezone && isValidIanaTimezone(result.timezone)
          ? result.timezone
          : Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolvedTz) setTimezone(resolvedTz);
      setResolvedAddress(result.formattedAddress);
      if (result.countryCode) {
        setCountryCode(result.countryCode);
        applyCountryDefaults(result.countryCode);
      }
      applyLocationRecommendation({
        resolvedAddress: result.formattedAddress,
        latitude: result.lat,
        longitude: result.lon,
        timezone: resolvedTz ?? timezone,
        country: result.countryCode ?? undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Address resolution failed.");
    } finally {
      setGeocoding(false);
    }
  }

  // ── Validation per step ──
  function validateStep(): string | null {
    if (step === 2) {
      if (siteName.trim().length < 2) return "Site name must be at least 2 characters.";
      if (address.trim().length < 3) return "Address must be at least 3 characters.";
      const lat = toNum(latitude);
      const lon = toNum(longitude);
      if (!isFinite(lat) || lat < -90 || lat > 90) return "Valid latitude required (−90 to 90).";
      if (!isFinite(lon) || lon < -180 || lon > 180) return "Valid longitude required (−180 to 180).";
      if (!timezone.trim()) return "Timezone is required.";
      if (!isValidIanaTimezone(timezone.trim())) {
        return "Timezone must be a valid IANA identifier like Asia/Jerusalem or America/Chicago — not a country name.";
      }
    }
    if (step === 3) {
      if (!isFinite(toNum(systemSizeKw)) || toNum(systemSizeKw) < 0.1) return "System size must be ≥ 0.1 kW.";
      const tv = toNum(tilt);
      if (!isFinite(tv) || tv < 0 || tv > 90) return "Tilt must be 0–90°.";
      const av = toNum(azimuth);
      if (!isFinite(av) || av < 0 || av > 360) return "Azimuth must be 0–360°.";
      if (!isFinite(toNum(panelWattage)) || toNum(panelWattage) < 1) return "Panel wattage must be ≥ 1 W.";
      const pev = toNum(panelEfficiency);
      if (!isFinite(pev) || pev < 0 || pev > 100) return "Panel efficiency must be 0–100%.";
      if (!lastCleaningDate) return "Last cleaning date is required.";
    }
    if (step === 5) {
      const sc = toNum(selfConsumptionRate);
      const ex = toNum(exportRate);
      if (!isFinite(sc) || sc < 0) return "Self-consumption rate must be ≥ 0.";
      if (!isFinite(ex) || ex < 0) return "Export rate must be ≥ 0.";
      if (!currency.trim()) return "Currency is required.";
      if (sc === 0 && ex === 0) return "At least one rate must be greater than 0.";
    }
    return null;
  }

  // ── Submit steps that hit the API ──
  async function handleNext() {
    setError(null);
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }

    // Steps 3 & 5 make API calls
    if (step === 3) {
      setPending(true);
      try {
        const authUser = parseAuthUser(localStorage.getItem(AUTH_USER_KEY));
        if (!authUser) throw new Error("Not authenticated. Please sign in again.");
        const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
        const domainUserId = await resolveDomainUserId(authUser);
        const createdSite = await createSite({
          userId: domainUserId, siteName: siteName.trim(),
          address: address.trim(), latitude: toNum(latitude),
          longitude: toNum(longitude), timezone: timezone.trim(),
        }, token);
        const createdSystem = await createSolarSystem({
          siteId: createdSite.id, systemSizeKw: toNum(systemSizeKw),
          tilt: toNum(tilt), azimuth: toNum(azimuth),
          panelWattage: toNum(panelWattage), panelEfficiency: toNum(panelEfficiency),
          lastCleaningDate: new Date(lastCleaningDate).toISOString(),
          ...(inverterType.trim() ? { inverterType: inverterType.trim() } : {}),
        }, token);
        const snapshot: OnboardingStep1Snapshot = {
          siteId: createdSite.id, solarSystemId: createdSystem.id,
          createdAt: new Date().toISOString(),
          ...(countryCode ? { countryCode } : {}),
        };
        localStorage.setItem(STEP1_SNAPSHOT_KEY, JSON.stringify(snapshot));
        setStep1Snapshot(snapshot);
        // Make the freshly created site the active one so the dashboard
        // aggregates its real data instead of falling back to demo mode.
        await setActiveSite(createdSite.id).catch(() => {});
        setStep(step + 1);
      } catch (e) {
        setError(e instanceof OnboardingApiError ? e.message : e instanceof Error ? e.message : "Setup failed. Please try again.");
      } finally { setPending(false); }
      return;
    }

    if (step === 5) {
      setPending(true);
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
        const siteId = step1Snapshot?.siteId;
        if (!siteId) throw new Error("Site data missing. Please restart from step 2.");
        const effectiveFrom = new Date().toISOString();
        const createdTariff = await createTariff({
          siteId, selfConsumptionRate: toNum(selfConsumptionRate),
          exportRate: toNum(exportRate), currency: currency.trim(), effectiveFrom,
        }, token);
        const createdDevice = await createDeviceProfile({
          siteId,
          hasBoiler: devices.hasBoiler, hasEv: devices.hasEv,
          hasDishwasher: devices.hasDishwasher, hasWashingMachine: devices.hasWashingMachine,
          hasAc: devices.hasAc, usageFlexibilityLevel: flexLevel,
        }, token);
        localStorage.setItem(STEP2_SNAPSHOT_KEY, JSON.stringify({
          siteId, tariffId: createdTariff.id,
          deviceProfileId: createdDevice.id, createdAt: new Date().toISOString(),
        }));
        setStep(6);
      } catch (e) {
        setError(e instanceof OnboardingApiError ? e.message : e instanceof Error ? e.message : "Setup failed. Please try again.");
      } finally { setPending(false); }
      return;
    }

    setStep(step + 1);
  }

  // ─── Step Renders ─────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {

      // ── Step 1: Welcome ──────────────────────────────────────────────────
      case 1:
        return (
          <div className="flex flex-col items-center gap-8 py-4 text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sun className="h-10 w-10" />
              </div>
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white shadow">
                AI
              </div>
            </div>
            <div className="max-w-md space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Understand your solar system.<br />
                <span className="text-primary">Maximize your savings.</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Solar Intelligence compares what your system should produce against what it actually does — then tells you exactly what it means for your money.
              </p>
              <ul className="space-y-2 pt-2 text-sm text-muted-foreground">
                {[
                  "📊 Expected vs. actual production comparison",
                  "💰 Real-time savings and loss calculation",
                  "⚡ Clear, actionable recommendations",
                ].map((item) => (
                  <li key={item} className="flex items-center justify-center gap-2">{item}</li>
                ))}
              </ul>
            </div>
            <Button size="lg" onClick={() => setStep(2)} className="w-full max-w-xs gap-2">
              Set up your solar site
              <ChevronRight className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Skip — go to dashboard
            </button>
          </div>
        );

      // ── Step 2: Site Setup ────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Tell us about your site</h2>
              <p className="mt-1 text-sm text-muted-foreground">We use this to model your local energy context.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup>
                <Label htmlFor="siteName">Site name</Label>
                <Input id="siteName" value={siteName} onChange={e => setSiteName(e.target.value)}
                  placeholder="Home Rooftop" disabled={pending} />
                <HelperText>A name to identify this solar installation.</HelperText>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={timezone} onChange={e => setTimezone(e.target.value)}
                  placeholder="Asia/Jerusalem" disabled={pending} />
                <HelperText>Used for production window calculations.</HelperText>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Label htmlFor="address">Address</Label>
              <div className="flex gap-2">
                <Input id="address" value={address}
                  onChange={e => { setAddress(e.target.value); setResolvedAddress(null); }}
                  placeholder="123 Solar St, Tel Aviv" disabled={pending || geocoding}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="default"
                  disabled={address.trim().length < 3 || pending || geocoding}
                  onClick={handleGeocode} className="shrink-0 gap-1.5">
                  {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {geocoding ? "Resolving…" : "Resolve"}
                </Button>
                <Button type="button" variant="outline" size="default"
                  disabled={pending || locating}
                  onClick={handleUseMyLocation} className="shrink-0 gap-1.5">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {locating ? "Locating…" : "Use my location"}
                </Button>
              </div>
              {resolvedAddress && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Resolved: <strong>{resolvedAddress}</strong> — Lat {latitude}, Lon {longitude}{timezone !== "UTC" ? `, TZ: ${timezone}` : ""}</span>
                </div>
              )}
              <HelperText>Click Resolve to auto-fill coordinates from your address.</HelperText>
            </FieldGroup>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup>
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" type="number" step="any" value={latitude}
                  onChange={e => setLatitude(e.target.value)} placeholder="32.0853" disabled={pending} />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="lon">Longitude</Label>
                <Input id="lon" type="number" step="any" value={longitude}
                  onChange={e => setLongitude(e.target.value)} placeholder="34.7818" disabled={pending} />
              </FieldGroup>
            </div>

            {setupRec && (
              <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div>
                  <h3 className="text-sm font-semibold">Recommended setup for this location</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    We detected your site location and suggested default solar settings.
                    Use real installer values when available.
                  </p>
                </div>
                <div className="grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                  {resolvedAddress && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Resolved address: </span>
                      <strong>{resolvedAddress}</strong>
                    </div>
                  )}
                  <div><span className="text-muted-foreground">Timezone: </span><strong>{timezone}</strong></div>
                  <div>
                    <span className="text-muted-foreground">Coordinates: </span>
                    <strong>{latitude}, {longitude}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suggested tilt: </span>
                    <strong>{setupRec.recommendedTilt}&deg;</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suggested azimuth: </span>
                    <strong>{setupRec.recommendedAzimuth}&deg; ({setupRec.preferredDirection})</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suggested efficiency: </span>
                    <strong>{setupRec.recommendedEfficiency}%</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suggested loss percent: </span>
                    <strong>{setupRec.recommendedLossPercent}%</strong>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  We use this location to calculate your local sunlight hours, sunrise and sunset
                  times, weather impact, air quality, expected solar production, and production
                  windows. The suggested tilt, azimuth, and efficiency have been pre-filled in the
                  next step — you can edit them there.
                </p>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  These are location-based estimates. Real installation data is always more accurate.
                  System size and panel wattage must come from your real installation — we never
                  guess them from the address.
                </p>
              </div>
            )}
          </div>
        );

      // ── Step 3: Solar System ──────────────────────────────────────────────
      case 3:
        return (
          <TooltipProvider>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Your solar system specs</h2>
                <p className="mt-1 text-sm text-muted-foreground">Used to calculate expected production and detect deviations.</p>
                {setupRec && (
                  <p className="mt-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                    Tilt, azimuth, and efficiency below were pre-filled with location-based
                    estimates for your site. Replace them with real values from your installer,
                    roof plans, inverter app, or solar proposal if you know them.
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup>
                  <Label htmlFor="size">
                    <FieldTooltip label="System size (kW)"
                      tip={setupRec?.fieldHelp.systemSize ?? "Total installed capacity of your solar panels in kilowatts."} />
                  </Label>
                  <Input id="size" type="number" step="any" min="0.1" value={systemSizeKw}
                    onChange={e => setSystemSizeKw(e.target.value)} placeholder="8.5" disabled={pending} />
                  <HelperText>Real installation value — enter your actual installed capacity.</HelperText>
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="tilt">
                    <FieldTooltip label="Tilt (°)"
                      tip={setupRec?.fieldHelp.tilt ?? "The angle of your panels from horizontal. 0° = flat, 90° = vertical."} />
                  </Label>
                  <Input id="tilt" type="number" step="any" min="0" max="90" value={tilt}
                    onChange={e => setTilt(e.target.value)} placeholder="20" disabled={pending} />
                  {setupRec && (
                    <HelperText>Suggested for your latitude: {setupRec.recommendedTilt}&deg; (editable).</HelperText>
                  )}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="azimuth">
                    <FieldTooltip label="Azimuth (°)"
                      tip={setupRec?.fieldHelp.azimuth ?? "Direction panels face. 180° = south, 90° = east, 270° = west, 0° = north."} />
                  </Label>
                  <Input id="azimuth" type="number" step="any" min="0" max="360" value={azimuth}
                    onChange={e => setAzimuth(e.target.value)} placeholder="180" disabled={pending} />
                  {setupRec && (
                    <HelperText>
                      Suggested for your hemisphere: {setupRec.recommendedAzimuth}&deg; ({setupRec.preferredDirection}).
                    </HelperText>
                  )}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="wattage">
                    <FieldTooltip label="Panel wattage (W)"
                      tip={setupRec?.fieldHelp.panelWattage ?? "Rated output per panel under standard test conditions."} />
                  </Label>
                  <Input id="wattage" type="number" step="any" min="1" value={panelWattage}
                    onChange={e => setPanelWattage(e.target.value)} placeholder="400" disabled={pending} />
                  <HelperText>Real installation value — from your panel model or solar proposal.</HelperText>
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="efficiency">
                    <FieldTooltip label="Panel efficiency (%)"
                      tip={setupRec?.fieldHelp.panelEfficiency ?? "Percentage of sunlight converted to electricity. Typical range: 17–23%."} />
                  </Label>
                  <Input id="efficiency" type="number" step="any" min="0" max="100" value={panelEfficiency}
                    onChange={e => setPanelEfficiency(e.target.value)} placeholder="20" disabled={pending} />
                  {setupRec && (
                    <HelperText>If unknown, {setupRec.recommendedEfficiency}% is a reasonable default.</HelperText>
                  )}
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="cleaning">
                    <FieldTooltip label="Last cleaning date"
                      tip={setupRec?.fieldHelp.lastCleaningDate ?? "Used to calculate soiling loss since last maintenance."} />
                  </Label>
                  <Input id="cleaning" type="date" value={lastCleaningDate}
                    onChange={e => setLastCleaningDate(e.target.value)} max={todayDateValue} disabled={pending} />
                  <HelperText>Optional — used to estimate soiling loss. Leave empty if unknown.</HelperText>
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="inverter">
                    <FieldTooltip label="Inverter type (optional)"
                      tip={setupRec?.fieldHelp.inverterType ?? "e.g. String inverter, Hybrid inverter, Microinverter."} />
                  </Label>
                  <Input id="inverter" value={inverterType}
                    onChange={e => setInverterType(e.target.value)}
                    placeholder="Hybrid inverter" disabled={pending} />
                </FieldGroup>
              </div>
            </div>
          </TooltipProvider>
        );

      // ── Step 4: Device Profile ────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">What do you have at home?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This lets us show you how to shift energy-heavy tasks to peak production windows.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {([
                { keyName: "hasBoiler", label: "Hot water boiler", description: "Electric or solar-assisted", emoji: "🚿" },
                { keyName: "hasEv", label: "Electric vehicle", description: "EV or plug-in hybrid", emoji: "🚗" },
                { keyName: "hasBattery", label: "Battery storage", description: "Home battery system", emoji: "🔋" },
                { keyName: "hasDishwasher", label: "Dishwasher", description: "Automatic dishwasher", emoji: "🍽️" },
                { keyName: "hasWashingMachine", label: "Washing machine", description: "Clothes washer", emoji: "👕" },
                { keyName: "hasAc", label: "Air conditioning", description: "Split or central AC", emoji: "❄️" },
              ] as Array<{ keyName: DeviceKey; label: string; description: string; emoji: string }>).map(d => (
                <DeviceCard
                  key={d.keyName}
                  keyName={d.keyName}
                  label={d.label}
                  description={d.description}
                  emoji={d.emoji}
                  checked={devices[d.keyName]}
                  onChange={(k, v) => setDevices(prev => ({ ...prev, [k]: v }))}
                  disabled={pending}
                />
              ))}
            </div>

            <FieldGroup>
              <Label>How flexible is your daily schedule?</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Can you shift appliance usage to match solar production? (1 = not at all, 5 = very flexible)
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFlexLevel(n)}
                    className={cn(
                      "flex h-10 w-10 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-all",
                      flexLevel === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Fixed routine</span>
                <span>Very flexible</span>
              </div>
            </FieldGroup>
          </div>
        );

      // ── Step 5: Tariff ────────────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your energy tariff</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These values turn your production data into real money figures.
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Why does this matter?</p>
              <p className="mt-1">
                We use your tariff rates to calculate the financial value of every kWh you produce,
                consume, or export. Without accurate rates, savings estimates won&apos;t reflect your real situation.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup>
                <Label htmlFor="tariffCountry">Country / region</Label>
                <select
                  id="tariffCountry"
                  value={tariffCountry}
                  onChange={e => {
                    const code = e.target.value;
                    setTariffCountry(code);
                    if (code) {
                      const defaults = getTariffDefaultsForCountry(code);
                      if (defaults) {
                        setCurrency(defaults.currency);
                        setSelfConsumptionRate(String(defaults.importRate));
                        setExportRate(String(defaults.exportRate));
                      }
                    }
                  }}
                  disabled={pending}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  {SUPPORTED_TARIFF_COUNTRY_CODES.map(code => {
                    const entry = COUNTRY_TARIFF_DEFAULTS[code];
                    return (
                      <option key={code} value={code}>
                        {entry.name} ({entry.currency})
                      </option>
                    );
                  })}
                  <option value="">Other — set manually</option>
                </select>
                <HelperText>
                  Picking a country auto-fills currency and typical residential rates. You can edit them.
                </HelperText>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  disabled={pending}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  {["ILS", "USD", "EUR", "GBP", "CAD", "AUD"].map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                <HelperText>Every money figure in the product is shown in this currency.</HelperText>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="selfRate">Self-consumption rate ({currency}/kWh)</Label>
                <Input id="selfRate" type="number" step="any" min="0"
                  value={selfConsumptionRate}
                  onChange={e => setSelfConsumptionRate(e.target.value)}
                  placeholder="0.62" disabled={pending} />
                <HelperText>Rate you save per kWh used from your own production.</HelperText>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="exportRate">Export rate ({currency}/kWh)</Label>
                <Input id="exportRate" type="number" step="any" min="0"
                  value={exportRate}
                  onChange={e => setExportRate(e.target.value)}
                  placeholder="0.28" disabled={pending} />
                <HelperText>Rate you receive per kWh fed back to the grid.</HelperText>
              </FieldGroup>
            </div>

            {(toNum(selfConsumptionRate) === 0 && toNum(exportRate) === 0) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
                ⚠️ Both rates are 0 — your savings estimates will show 0 {currency}. Please enter your tariff rates.
              </div>
            )}
          </div>
        );

      // ── Step 6: Complete ──────────────────────────────────────────────────
      case 6:
        return (
          <div className="flex flex-col items-center gap-8 py-4 text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            </div>
            <div className="max-w-md space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Your solar profile is ready. 🎉
              </h1>
              <p className="text-base text-muted-foreground">
                We have everything we need to analyze your system, track savings, and give you clear recommendations.
              </p>
            </div>
            <Button size="lg" onClick={() => router.push("/dashboard")} className="w-full max-w-xs gap-2">
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Layout ───────────────────────────────────────────────────────────────

  const isWelcomeOrDone = step === 1 || step === 6;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <StepProgress current={step} />
        {!isWelcomeOrDone && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Step {step - 1} of {TOTAL_DATA_STEPS}
          </p>
        )}
      </div>

      {/* Card */}
      <Card className="glass-card rounded-3xl border-0 shadow-lg">
        <CardContent className="p-8 md:p-10">
          {renderStep()}

          {/* Error */}
          {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

          {/* Navigation buttons */}
          {!isWelcomeOrDone && (
            <div className="mt-8 flex items-center justify-between gap-4">
              <Button
                type="button" variant="ghost" size="default"
                onClick={() => { setError(null); setStep(s => s - 1); }}
                disabled={pending}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="button" size="lg"
                onClick={handleNext}
                disabled={pending}
                className="gap-2 min-w-[140px]"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending
                  ? "Saving…"
                  : step === 5
                    ? "Finish Setup"
                    : "Continue"}
                {!pending && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
