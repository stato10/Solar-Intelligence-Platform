"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OnboardingStep1Snapshot } from "@/lib/contracts/onboarding-step1";
import type { OnboardingStep2Snapshot } from "@/lib/contracts/onboarding-step2";
import {
  OnboardingApiError,
  createDeviceProfile,
  createTariff
} from "@/lib/api/onboarding";

const ACCESS_TOKEN_KEY = "sip.accessToken";
const STEP1_SNAPSHOT_KEY = "sip.onboarding.step1";
const STEP2_SNAPSHOT_KEY = "sip.onboarding.step2";

function parseStep1Snapshot(raw: string | null): OnboardingStep1Snapshot | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingStep1Snapshot>;
    if (
      typeof parsed.siteId === "string" &&
      parsed.siteId.trim() &&
      typeof parsed.solarSystemId === "string" &&
      typeof parsed.createdAt === "string"
    ) {
      return {
        siteId: parsed.siteId,
        solarSystemId: parsed.solarSystemId,
        createdAt: parsed.createdAt
      };
    }
  } catch {
    return null;
  }

  return null;
}

function toNumber(value: string): number {
  return Number(value.trim());
}

function toInteger(value: string): number {
  return Number.parseInt(value, 10);
}

export function OnboardingStep2Form() {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [selfConsumptionRate, setSelfConsumptionRate] = useState("");
  const [exportRate, setExportRate] = useState("");
  const [currency, setCurrency] = useState("ILS");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [hasBoiler, setHasBoiler] = useState(false);
  const [hasEv, setHasEv] = useState(false);
  const [hasDishwasher, setHasDishwasher] = useState(false);
  const [hasWashingMachine, setHasWashingMachine] = useState(false);
  const [hasAc, setHasAc] = useState(false);
  const [usageFlexibilityLevel, setUsageFlexibilityLevel] = useState("3");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = parseStep1Snapshot(localStorage.getItem(STEP1_SNAPSHOT_KEY));
    if (!snapshot?.siteId) {
      setSnapshotError(
        "Step 1 data missing or stale. Please complete step 1 again. This can happen after a backend restart."
      );
      setSiteId(null);
      return;
    }
    setSnapshotError(null);
    setSiteId(snapshot.siteId);
  }, []);

  function clearMessages() {
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  function validateFields(): string | null {
    if (!siteId) {
      return "Step 1 data missing or stale. Please complete step 1 again.";
    }
    const selfRate = toNumber(selfConsumptionRate);
    if (!Number.isFinite(selfRate) || selfRate < 0) {
      return "Self-consumption rate must be a number greater than or equal to 0.";
    }
    const exportRateNumber = toNumber(exportRate);
    if (!Number.isFinite(exportRateNumber) || exportRateNumber < 0) {
      return "Export rate must be a number greater than or equal to 0.";
    }
    if (!currency.trim()) {
      return "Currency is required.";
    }
    if (!effectiveFrom.trim()) {
      return "Effective-from date is required.";
    }
    const dateCheck = new Date(effectiveFrom);
    if (Number.isNaN(dateCheck.getTime())) {
      return "Effective-from must be a valid date.";
    }
    const flexibility = toInteger(usageFlexibilityLevel);
    if (!Number.isInteger(flexibility) || flexibility < 1 || flexibility > 5) {
      return "Usage flexibility level must be an integer between 1 and 5.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateFields();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!siteId) {
      setErrorMessage("Step 1 data missing or stale. Please complete step 1 again.");
      return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
    setPending(true);

    let createdTariffId: string | null = null;

    try {
      const createdTariff = await createTariff(
        {
          siteId,
          selfConsumptionRate: toNumber(selfConsumptionRate),
          exportRate: toNumber(exportRate),
          currency: currency.trim(),
          effectiveFrom: new Date(effectiveFrom).toISOString()
        },
        accessToken
      );
      createdTariffId = createdTariff.id;

      const createdDeviceProfile = await createDeviceProfile(
        {
          siteId,
          hasBoiler,
          hasEv,
          hasDishwasher,
          hasWashingMachine,
          hasAc,
          usageFlexibilityLevel: toInteger(usageFlexibilityLevel)
        },
        accessToken
      );

      const snapshot: OnboardingStep2Snapshot = {
        siteId,
        tariffId: createdTariff.id,
        deviceProfileId: createdDeviceProfile.id,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STEP2_SNAPSHOT_KEY, JSON.stringify(snapshot));
      setSuccessMessage("Step 2 completed. Tariff and device profile were created successfully.");
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof OnboardingApiError) {
        const staleSnapshotHint =
          error.status === 404
            ? " If this happened after a backend restart, repeat step 1 to refresh the site snapshot."
            : "";
        if (createdTariffId) {
          setErrorMessage(
            `Tariff was created successfully, but device profile creation failed: ${error.message}. Retry may require updating existing data if a conflict is returned.${staleSnapshotHint}`
          );
        } else {
          setErrorMessage(`${error.message}${staleSnapshotHint}`);
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unknown onboarding step 2 error");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Onboarding Step 2: Tariff and Devices</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Configure tariff rates and household device profile for the site created in step 1.
      </p>

      {snapshotError ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>{snapshotError}</p>
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/onboarding/step-1">Go to onboarding step 1</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Tariff</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Self-consumption rate</span>
              <input
                type="number"
                step="any"
                min="0"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={selfConsumptionRate}
                onChange={(event) => {
                  clearMessages();
                  setSelfConsumptionRate(event.target.value);
                }}
                disabled={pending}
                placeholder="0.62"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Export rate</span>
              <input
                type="number"
                step="any"
                min="0"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={exportRate}
                onChange={(event) => {
                  clearMessages();
                  setExportRate(event.target.value);
                }}
                disabled={pending}
                placeholder="0.28"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Currency</span>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={currency}
                onChange={(event) => {
                  clearMessages();
                  setCurrency(event.target.value);
                }}
                disabled={pending}
                placeholder="ILS"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Effective from</span>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={effectiveFrom}
                onChange={(event) => {
                  clearMessages();
                  setEffectiveFrom(event.target.value);
                }}
                disabled={pending}
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Device Profile</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasBoiler}
                onChange={(event) => {
                  clearMessages();
                  setHasBoiler(event.target.checked);
                }}
                disabled={pending}
              />
              <span>Has boiler</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasEv}
                onChange={(event) => {
                  clearMessages();
                  setHasEv(event.target.checked);
                }}
                disabled={pending}
              />
              <span>Has EV</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasDishwasher}
                onChange={(event) => {
                  clearMessages();
                  setHasDishwasher(event.target.checked);
                }}
                disabled={pending}
              />
              <span>Has dishwasher</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasWashingMachine}
                onChange={(event) => {
                  clearMessages();
                  setHasWashingMachine(event.target.checked);
                }}
                disabled={pending}
              />
              <span>Has washing machine</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasAc}
                onChange={(event) => {
                  clearMessages();
                  setHasAc(event.target.checked);
                }}
                disabled={pending}
              />
              <span>Has AC</span>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Usage flexibility level (1-5)</span>
            <input
              type="number"
              min="1"
              max="5"
              step="1"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={usageFlexibilityLevel}
              onChange={(event) => {
                clearMessages();
                setUsageFlexibilityLevel(event.target.value);
              }}
              disabled={pending}
            />
          </label>
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
          <Button type="submit" size="lg" disabled={pending || Boolean(snapshotError)}>
            {pending ? "Saving..." : "Save Step 2"}
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
