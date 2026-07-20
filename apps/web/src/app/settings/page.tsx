import type { DashboardAggregateData } from "@/lib/contracts";
import type {
  DeviceProfile,
  Site,
  SolarSystem,
  Tariff,
} from "@/lib/contracts/onboarding";
import { getSessionCookies, getSessionDashboard, getSessionTariff } from "@/lib/api/session-data";
import {
  fetchDeviceProfileBySite,
  fetchSite,
  fetchSolarSystemBySite,
} from "@/lib/api/settings-persist";
import { SettingsShell, type SettingsShellInitialValues } from "./_components/settings-shell";
import { deriveNavBadgeCounts } from "@/lib/view-models/nav-badges";
import { NavBadgesBridge } from "@/components/layout/NavBadgesBridge";
import { PageHeader } from "@/components/layout/PageHeader";
import type { CurrencyCode } from "@/lib/utils/formatters";
import { Settings } from "lucide-react";

/** ISO timestamp → `<input type="date">` value (yyyy-MM-dd). */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function clampFlexibility(raw: number | undefined): 1 | 2 | 3 | 4 | 5 {
  if (raw == null) return 3;
  const rounded = Math.round(raw);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as 2 | 3 | 4;
}

function normalizeCurrency(raw: string | null | undefined): CurrencyCode {
  if (!raw) return "ILS";
  const upper = raw.toUpperCase();
  switch (upper) {
    case "ILS":
    case "USD":
    case "EUR":
    case "GBP":
    case "CAD":
    case "AUD":
      return upper;
    default:
      return "ILS";
  }
}

interface LoadedRecords {
  site: Site | null;
  solarSystem: SolarSystem | null;
  tariff: Tariff | null;
  deviceProfile: DeviceProfile | null;
}

async function loadSettingsRecords(
  siteId: string | undefined,
  accessToken: string | undefined,
): Promise<LoadedRecords> {
  if (!siteId) {
    return { site: null, solarSystem: null, tariff: null, deviceProfile: null };
  }
  // Fire reads in parallel; tolerate individual failures so a stale
  // tariff row doesn't nuke the whole page.
  // Tariff is request-cached with the root layout CurrencyProvider.
  const [siteR, systemR, tariffR, deviceR] = await Promise.allSettled([
    fetchSite(siteId, accessToken),
    fetchSolarSystemBySite(siteId, accessToken),
    getSessionTariff(),
    fetchDeviceProfileBySite(siteId, accessToken),
  ]);
  return {
    site: siteR.status === "fulfilled" ? siteR.value : null,
    solarSystem: systemR.status === "fulfilled" ? systemR.value : null,
    tariff: tariffR.status === "fulfilled" ? tariffR.value : null,
    deviceProfile: deviceR.status === "fulfilled" ? deviceR.value : null,
  };
}

export default async function SettingsPage() {
  let aggregate: DashboardAggregateData | null = null;
  let errorMessage: string | null = null;
  let records: LoadedRecords = {
    site: null,
    solarSystem: null,
    tariff: null,
    deviceProfile: null,
  };

  try {
    const { accessToken, activeSiteId } = await getSessionCookies();

    // Aggregate (for nav badges) and settings records in parallel —
    // settings no longer waits on the heavy dashboard round-trip.
    const [aggregateResult, recordsResult] = await Promise.allSettled([
      getSessionDashboard(),
      loadSettingsRecords(activeSiteId, accessToken),
    ]);

    if (aggregateResult.status === "fulfilled") {
      aggregate = aggregateResult.value;
    }
    if (recordsResult.status === "fulfilled") {
      records = recordsResult.value;
    } else if (!activeSiteId && aggregate) {
      records = await loadSettingsRecords(aggregate.siteId, accessToken);
    }

    if (aggregateResult.status === "rejected" && recordsResult.status === "rejected") {
      throw aggregateResult.reason instanceof Error
        ? aggregateResult.reason
        : new Error("Failed to load settings");
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load settings";
  }

  const initial: SettingsShellInitialValues = buildInitialValues(aggregate, records);
  const providers = aggregate?.providers;

  return (
    <section className="space-y-6 pb-12">
      {aggregate ? <NavBadgesBridge {...deriveNavBadgeCounts(aggregate)} /> : null}
      <PageHeader
        eyebrow="Control center"
        title="Settings"
        subtitle="Every control here affects a visible outcome elsewhere in the product — recommendations, money math, automation, and alerts."
        icon={Settings}
        tone="primary"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-500">
          {errorMessage}. Settings will render with defaults; save to overwrite once the connection is restored.
        </div>
      ) : null}

      <SettingsShell initial={initial} />

      {providers ? (
        <footer className="mt-4 flex flex-col gap-1 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <p>
            Providers: {providers.weather} (Weather) · {providers.solar} (Solar) · {providers.engine} (Engine)
          </p>
        </footer>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Initial values builder — hydrate every form from the real record in the
// database when available. Falls back to sensible defaults for first-run
// or degraded-read scenarios.
// ---------------------------------------------------------------------------
function buildInitialValues(
  aggregate: DashboardAggregateData | null,
  records: LoadedRecords,
): SettingsShellInitialValues {
  const { site, solarSystem, tariff, deviceProfile } = records;

  const siteId = site?.id ?? aggregate?.siteId ?? null;
  const siteName = site?.siteName ?? aggregate?.siteName ?? null;
  const currency = normalizeCurrency(tariff?.currency);

  const hasSystem = Boolean(solarSystem);
  const providers = aggregate?.providers;

  return {
    noDataSystem: !hasSystem,
    siteName,
    ids: {
      siteId,
      solarSystemId: solarSystem?.id ?? null,
      tariffId: tariff?.id ?? null,
      deviceProfileId: deviceProfile?.id ?? null,
    },
    systemConfig: {
      address: site?.address ?? "",
      latitude: site?.latitude ?? "",
      longitude: site?.longitude ?? "",
      // Country code isn't in the Site record; Resolve fills it on edit.
      countryCode: "",
      systemSizeKw: solarSystem?.systemSizeKw ?? "",
      panelCount: solarSystem?.panelCount ?? "",
      panelType: solarSystem?.panelType ?? "",
      inverterModel: solarSystem?.inverterType ?? "",
      tiltDegrees: solarSystem?.tilt ?? "",
      azimuthDegrees: solarSystem?.azimuth ?? "",
      installationDate: toDateInputValue(solarSystem?.installationDate),
    },
    energyBehavior: {
      typicalAtHome: "evening",
      householdSize: "",
      hasEv: deviceProfile?.hasEv ?? false,
      hasElectricWaterHeater: deviceProfile?.hasBoiler ?? false,
      hasPool: false,
      flexibilityLevel: clampFlexibility(deviceProfile?.usageFlexibilityLevel),
      futurePlans: [],
    },
    tariffs: {
      countryCode: "",
      currency,
      importRate: tariff?.selfConsumptionRate ?? "",
      exportRate: tariff?.exportRate ?? "",
      touEnabled: false,
      peakStart: "17:00",
      peakEnd: "22:00",
      peakRate: "",
      offPeakRate: "",
    },
    automationPrefs: {
      deviceWindows: [
        {
          device: "boiler",
          label: "Water heater / boiler",
          start: aggregate?.selfConsumption.recommendedUsageWindow.start ?? "12:00",
          end: aggregate?.selfConsumption.recommendedUsageWindow.end ?? "14:00",
          enabled: true,
        },
        { device: "dishwasher", label: "Dishwasher", start: "12:00", end: "14:00", enabled: false },
        { device: "ev-charger", label: "EV charger", start: "10:00", end: "15:00", enabled: false },
        { device: "smart-switch", label: "Smart switch / pool pump", start: "11:00", end: "15:00", enabled: false },
      ],
      weatherOverride: true,
      notifyBeforeTrigger: true,
      quietHoursEnabled: false,
      quietStart: "22:00",
      quietEnd: "07:00",
    },
    hardware: [
      {
        id: "inverter-default",
        kind: "inverter",
        name: "Inverter",
        detail: providers ? `Live via ${providers.solar}` : "Not connected",
        status: providers ? "connected" : "disconnected",
      },
      {
        id: "battery-default",
        kind: "battery",
        name: "Battery",
        detail: "No battery detected",
        status: "disconnected",
      },
      {
        id: "smart-device-default",
        kind: "smart-device",
        name: "Smart devices",
        detail: "No smart switches connected",
        status: "disconnected",
      },
    ],
    services: [
      {
        id: "weather-default",
        kind: "weather",
        name: "Weather provider",
        detail: providers?.weather ?? "Default (Open-Meteo)",
        status: providers ? "connected" : "disconnected",
      },
      {
        id: "tariff-default",
        kind: "tariff",
        name: "Tariff provider",
        detail: tariff ? `Stored · ${tariff.currency}` : "Manual entry",
        status: tariff ? "connected" : "disconnected",
      },
    ],
    notifications: {
      channels: { "in-app": true, email: true, sms: false },
      categories: {
        critical: { "in-app": true, email: true, sms: false },
        warning: { "in-app": true, email: false, sms: false },
        informational: { "in-app": true, email: false, sms: false },
      },
      weeklyDigest: true,
      digestDay: "Mon",
      quietHoursEnabled: false,
      quietStart: "22:00",
      quietEnd: "07:00",
    },
  };
}
