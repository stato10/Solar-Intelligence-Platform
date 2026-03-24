"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/contracts";
import type { OnboardingStep1Snapshot } from "@/lib/contracts/onboarding-step1";
import {
  OnboardingApiError,
  createSite,
  createSolarSystem,
  resolveDomainUserId
} from "@/lib/api/onboarding";

const ACCESS_TOKEN_KEY = "sip.accessToken";
const AUTH_USER_KEY = "sip.authUser";
const STEP1_SNAPSHOT_KEY = "sip.onboarding.step1";

function toNumber(value: string): number {
  return Number(value.trim());
}

function parseAuthUser(raw: string | null): AuthUser | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.fullName === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.role === "string"
    ) {
      return parsed as AuthUser;
    }
  } catch {
    return null;
  }
  return null;
}

export function OnboardingStep1Form() {
  const router = useRouter();
  const [siteName, setSiteName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [systemSizeKw, setSystemSizeKw] = useState("");
  const [tilt, setTilt] = useState("");
  const [azimuth, setAzimuth] = useState("");
  const [panelWattage, setPanelWattage] = useState("");
  const [panelEfficiency, setPanelEfficiency] = useState("");
  const [lastCleaningDate, setLastCleaningDate] = useState("");
  const [inverterType, setInverterType] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const todayDateValue = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function clearMessages() {
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  function validate(): string | null {
    if (siteName.trim().length < 2) {
      return "Site name must contain at least 2 characters.";
    }
    if (address.trim().length < 3) {
      return "Address must contain at least 3 characters.";
    }
    const lat = toNumber(latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return "Latitude must be a valid number between -90 and 90.";
    }
    const lon = toNumber(longitude);
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      return "Longitude must be a valid number between -180 and 180.";
    }
    if (!timezone.trim()) {
      return "Timezone is required.";
    }
    const size = toNumber(systemSizeKw);
    if (!Number.isFinite(size) || size < 0.1) {
      return "System size (kW) must be at least 0.1.";
    }
    const tiltValue = toNumber(tilt);
    if (!Number.isFinite(tiltValue) || tiltValue < 0 || tiltValue > 90) {
      return "Tilt must be between 0 and 90.";
    }
    const azimuthValue = toNumber(azimuth);
    if (!Number.isFinite(azimuthValue) || azimuthValue < 0 || azimuthValue > 360) {
      return "Azimuth must be between 0 and 360.";
    }
    const panelWattageValue = toNumber(panelWattage);
    if (!Number.isFinite(panelWattageValue) || panelWattageValue < 1) {
      return "Panel wattage must be at least 1.";
    }
    const panelEfficiencyValue = toNumber(panelEfficiency);
    if (!Number.isFinite(panelEfficiencyValue) || panelEfficiencyValue < 0 || panelEfficiencyValue > 100) {
      return "Panel efficiency must be between 0 and 100.";
    }
    if (!lastCleaningDate.trim()) {
      return "Last cleaning date is required.";
    }
    const parsedDate = new Date(lastCleaningDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return "Last cleaning date must be a valid date.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const authUser = parseAuthUser(localStorage.getItem(AUTH_USER_KEY));
    if (!authUser) {
      setErrorMessage("No authenticated user context found. Please sign in again.");
      return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
    setPending(true);

    try {
      const domainUserId = await resolveDomainUserId(authUser, accessToken);
      const createdSite = await createSite(
        {
          userId: domainUserId,
          siteName: siteName.trim(),
          address: address.trim(),
          latitude: toNumber(latitude),
          longitude: toNumber(longitude),
          timezone: timezone.trim()
        },
        accessToken
      );

      const createdSolarSystem = await createSolarSystem(
        {
          siteId: createdSite.id,
          systemSizeKw: toNumber(systemSizeKw),
          tilt: toNumber(tilt),
          azimuth: toNumber(azimuth),
          panelWattage: toNumber(panelWattage),
          panelEfficiency: toNumber(panelEfficiency),
          lastCleaningDate: new Date(lastCleaningDate).toISOString(),
          ...(inverterType.trim() ? { inverterType: inverterType.trim() } : {})
        },
        accessToken
      );

      const snapshot: OnboardingStep1Snapshot = {
        siteId: createdSite.id,
        solarSystemId: createdSolarSystem.id,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STEP1_SNAPSHOT_KEY, JSON.stringify(snapshot));
      setSuccessMessage(
        "Step 1 completed. Site and solar system were created successfully. Continue to step 2. If the backend was restarted, you may need to recreate step 1 before step 2."
      );
    } catch (error) {
      if (error instanceof OnboardingApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unknown onboarding error");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Onboarding Step 1: Site and System</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Provide site details first, then configure the solar system baseline.
      </p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Site Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Site name</span>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={siteName}
                onChange={(event) => {
                  clearMessages();
                  setSiteName(event.target.value);
                }}
                disabled={pending}
                placeholder="Home Rooftop"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Timezone</span>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={timezone}
                onChange={(event) => {
                  clearMessages();
                  setTimezone(event.target.value);
                }}
                disabled={pending}
                placeholder="Asia/Jerusalem"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Address</span>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={address}
              onChange={(event) => {
                clearMessages();
                setAddress(event.target.value);
              }}
              disabled={pending}
              placeholder="123 Solar St, Tel Aviv"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Latitude</span>
              <input
                type="number"
                step="any"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={latitude}
                onChange={(event) => {
                  clearMessages();
                  setLatitude(event.target.value);
                }}
                disabled={pending}
                placeholder="32.0853"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Longitude</span>
              <input
                type="number"
                step="any"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={longitude}
                onChange={(event) => {
                  clearMessages();
                  setLongitude(event.target.value);
                }}
                disabled={pending}
                placeholder="34.7818"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Solar System Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">System size (kW)</span>
              <input
                type="number"
                step="any"
                min="0.1"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={systemSizeKw}
                onChange={(event) => {
                  clearMessages();
                  setSystemSizeKw(event.target.value);
                }}
                disabled={pending}
                placeholder="8.5"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Tilt</span>
              <input
                type="number"
                step="any"
                min="0"
                max="90"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={tilt}
                onChange={(event) => {
                  clearMessages();
                  setTilt(event.target.value);
                }}
                disabled={pending}
                placeholder="20"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Azimuth</span>
              <input
                type="number"
                step="any"
                min="0"
                max="360"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={azimuth}
                onChange={(event) => {
                  clearMessages();
                  setAzimuth(event.target.value);
                }}
                disabled={pending}
                placeholder="180"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Panel wattage</span>
              <input
                type="number"
                step="any"
                min="1"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={panelWattage}
                onChange={(event) => {
                  clearMessages();
                  setPanelWattage(event.target.value);
                }}
                disabled={pending}
                placeholder="550"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Panel efficiency (%)</span>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={panelEfficiency}
                onChange={(event) => {
                  clearMessages();
                  setPanelEfficiency(event.target.value);
                }}
                disabled={pending}
                placeholder="21"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Last cleaning date</span>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={lastCleaningDate}
                onChange={(event) => {
                  clearMessages();
                  setLastCleaningDate(event.target.value);
                }}
                max={todayDateValue}
                disabled={pending}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Inverter type (optional)</span>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={inverterType}
                onChange={(event) => {
                  clearMessages();
                  setInverterType(event.target.value);
                }}
                disabled={pending}
                placeholder="Hybrid inverter"
              />
            </label>
          </div>
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {successMessage ? (
            <Button
              type="button"
              size="lg"
              disabled={pending}
              onClick={() => router.push("/onboarding/step-2")}
            >
              Continue to Step 2
            </Button>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving..." : "Save Step 1"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </form>
    </div>
  );
}
