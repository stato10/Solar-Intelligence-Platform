"use client";

/**
 * Settings shell — client-side wrapper that owns the anchored sidebar
 * (xl+) and the stacked mobile layout, plus per-section save handlers.
 *
 * Why a client wrapper?
 *   - Forms need `useState` for each section.
 *   - The anchored sidebar uses `IntersectionObserver` to highlight
 *     the active section as the user scrolls.
 *   - Save handlers call the real PATCH endpoints against the domain
 *     IDs loaded server-side. Persistence is optimistic: we surface
 *     success/error inline via SettingsSection's built-in footer.
 *
 * Sections WITHOUT a backend endpoint yet (Automation preferences,
 * Notifications, Integrations connect flow) still use stubs and log
 * analytics so the funnel doesn't go dark; the stubs are marked with
 * explicit `// pending-backend` comments.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/client";
import {
  SettingsApiError,
  patchDeviceProfile,
  patchSite,
  patchSolarSystem,
  patchTariff,
} from "@/lib/api/settings-persist";
import { SystemConfigSection, type SystemConfigFormValues } from "./system-config-section";
import { EnergyBehaviorSection, type EnergyBehaviorFormValues } from "./energy-behavior-section";
import { TariffsSection, type TariffsFormValues } from "./tariffs-section";
import { AutomationPrefsSection, type AutomationPrefsFormValues } from "./automation-prefs-section";
import {
  IntegrationsSection,
  type ConnectInverterInput,
  type IntegrationItem,
  type IntegrationKind,
} from "./integrations-section";
import {
  createInverterConnection,
  deleteInverterConnection,
} from "@/lib/api/telemetry";
import { NotificationsSection, type NotificationsFormValues } from "./notifications-section";

const ACCESS_TOKEN_KEY = "sip.accessToken";

export interface SettingsResourceIds {
  siteId: string | null;
  solarSystemId: string | null;
  tariffId: string | null;
  deviceProfileId: string | null;
}

export interface SettingsShellInitialValues {
  noDataSystem: boolean;
  /** Site name of the currently-active system, used to label the edit-mode banner. */
  siteName: string | null;
  /** Domain IDs resolved server-side for the active site. */
  ids: SettingsResourceIds;
  systemConfig: SystemConfigFormValues;
  energyBehavior: EnergyBehaviorFormValues;
  tariffs: TariffsFormValues;
  automationPrefs: AutomationPrefsFormValues;
  hardware: IntegrationItem[];
  services: IntegrationItem[];
  notifications: NotificationsFormValues;
  /** True when the active site has an inverter connection (Phase 9). */
  inverterConnected: boolean;
}

const SECTIONS = [
  { id: "system-configuration", label: "System configuration" },
  { id: "energy-behavior", label: "Energy behavior" },
  { id: "tariffs", label: "Tariffs" },
  { id: "automation-preferences", label: "Automation preferences" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
] as const;

function getAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}

function formatPatchError(err: unknown, fallback: string): never {
  if (err instanceof SettingsApiError) {
    throw new Error(err.message || fallback);
  }
  if (err instanceof Error) throw new Error(err.message || fallback);
  throw new Error(fallback);
}

function valueOrUndefined<T>(v: T | ""): T | undefined {
  return v === "" ? undefined : v;
}

/**
 * `<input type="date">` returns yyyy-MM-dd. Convert to ISO-8601 (with
 * UTC midnight) so it satisfies the backend `@IsDateString()` validator,
 * or `undefined` if the field is empty / unparsable.
 */
function toIsoDateOrUndefined(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Already a full ISO timestamp → pass through.
  if (trimmed.includes("T")) return trimmed;
  const d = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function SettingsShell({ initial }: { initial: SettingsShellInitialValues }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [resolvedCountryCode, setResolvedCountryCode] = useState<string | null>(
    initial.systemConfig.countryCode || initial.tariffs.countryCode || null,
  );

  // Observe sections in the main column so the sidebar highlights
  // whichever is currently in view.
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).getAttribute("data-section-id");
            if (id) setActiveId(id);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    for (const section of SECTIONS) {
      const el = document.querySelector(`[data-section-id="${section.id}"]`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const logControlChange = useCallback((section: string, controlId: string) => {
    track(
      "settings_control_change",
      { section, controlId, newValueShape: "partial" },
      { surface: "settings" },
    );
  }, []);

  // ── System configuration — PATCH /sites + PATCH /solar-systems ─────
  const { siteId, solarSystemId, tariffId, deviceProfileId } = initial.ids;

  const saveSystem = useCallback(
    async (values: SystemConfigFormValues) => {
      logControlChange("system-configuration", "bulk-save");
      const token = getAccessToken();

      if (!siteId) {
        throw new Error(
          "No site on file yet. Finish onboarding before editing system configuration.",
        );
      }

      try {
        // 1) Location → Site
        const sitePatch = {
          address: values.address.trim() || undefined,
          latitude: valueOrUndefined(values.latitude),
          longitude: valueOrUndefined(values.longitude),
        };
        if (Object.values(sitePatch).some((v) => v !== undefined)) {
          await patchSite(siteId, sitePatch, token);
        }

        // 2) Panels / Orientation / Inverter / Installation → SolarSystem
        if (solarSystemId) {
          const systemPatch = {
            systemSizeKw: valueOrUndefined(values.systemSizeKw),
            tilt: valueOrUndefined(values.tiltDegrees),
            azimuth: valueOrUndefined(values.azimuthDegrees),
            panelCount: valueOrUndefined(values.panelCount),
            panelType: values.panelType.trim() || undefined,
            inverterType: values.inverterModel.trim() || undefined,
            installationDate: toIsoDateOrUndefined(values.installationDate),
          };
          if (Object.values(systemPatch).some((v) => v !== undefined)) {
            await patchSolarSystem(solarSystemId, systemPatch, token);
          }
        }
        // Pull the aggregate again so the dashboard sees the new values
        // on next navigation.
        router.refresh();
      } catch (err) {
        formatPatchError(err, "Could not save system configuration.");
      }
    },
    [logControlChange, router, siteId, solarSystemId],
  );

  // ── Energy behavior — PATCH /devices ───────────────────────────────
  const saveEnergy = useCallback(
    async (values: EnergyBehaviorFormValues) => {
      logControlChange("energy-behavior", "bulk-save");
      const token = getAccessToken();

      if (!deviceProfileId) {
        // No profile yet — the onboarding device-profile POST hasn't run
        // for this site. We surface this as a friendly error rather than
        // silently dropping the save.
        throw new Error(
          "No device profile on file yet. Complete onboarding step 2 to enable editing.",
        );
      }

      try {
        await patchDeviceProfile(
          deviceProfileId,
          {
            hasBoiler: values.hasElectricWaterHeater,
            hasEv: values.hasEv,
            usageFlexibilityLevel: values.flexibilityLevel,
          },
          token,
        );
        router.refresh();
      } catch (err) {
        formatPatchError(err, "Could not save energy behavior.");
      }
    },
    [logControlChange, router, deviceProfileId],
  );

  // ── Tariffs — PATCH /tariffs (falls back to create path note) ─────
  const saveTariffs = useCallback(
    async (values: TariffsFormValues) => {
      logControlChange("tariffs", "bulk-save");
      const token = getAccessToken();

      if (!tariffId) {
        throw new Error(
          "No tariff on file yet. Complete onboarding step 2 to create one before editing.",
        );
      }

      try {
        await patchTariff(
          tariffId,
          {
            selfConsumptionRate: valueOrUndefined(values.importRate),
            exportRate: valueOrUndefined(values.exportRate),
            currency: values.currency,
          },
          token,
        );
        router.refresh();
      } catch (err) {
        formatPatchError(err, "Could not save tariff.");
      }
    },
    [logControlChange, router, tariffId],
  );

  // ── pending-backend stubs — wire when endpoints land ───────────────
  const saveAutomation = useCallback(async () => {
    logControlChange("automation-preferences", "bulk-save");
    // pending-backend: no PATCH /automation-prefs endpoint yet.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, [logControlChange]);

  const saveNotifications = useCallback(async () => {
    logControlChange("notifications", "bulk-save");
    // pending-backend: no PATCH /notifications endpoint yet.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, [logControlChange]);

  const handleConnect = useCallback(async (kind: IntegrationKind) => {
    logControlChange("integrations", `connect:${kind}`);
    // pending-backend: battery / smart-device pairing flows TBD.
    await new Promise((resolve) => setTimeout(resolve, 400));
  }, [logControlChange]);

  // ── Inverter telemetry — POST /telemetry/connections (Phase 9) ─────
  const handleConnectInverter = useCallback(
    async (input: ConnectInverterInput) => {
      logControlChange("integrations", `connect-inverter:${input.vendor}`);
      const token = getAccessToken();
      if (!siteId || !token) {
        throw new Error("Sign in and finish onboarding before connecting an inverter.");
      }
      try {
        await createInverterConnection(
          {
            siteId,
            vendor: input.vendor,
            apiKey: input.apiKey,
            externalSystemId: input.externalSystemId,
          },
          token,
        );
        router.refresh();
      } catch (err) {
        formatPatchError(err, "Could not connect the inverter. Check the API key and site id.");
      }
    },
    [logControlChange, router, siteId],
  );

  const handleDisconnectInverter = useCallback(async () => {
    logControlChange("integrations", "disconnect-inverter");
    const token = getAccessToken();
    if (!siteId || !token) return;
    try {
      await deleteInverterConnection(siteId, token);
      router.refresh();
    } catch {
      // Row may already be gone; refresh reflects the true state either way.
      router.refresh();
    }
  }, [logControlChange, router, siteId]);

  const handleAnchorClick = useCallback((id: string) => {
    const el = document.querySelector(`[data-section-id="${id}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const anchorNav = useMemo(
    () => (
      <nav aria-label="Settings sections" className="space-y-1">
        {SECTIONS.map((section) => {
          const active = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleAnchorClick(section.id)}
              aria-current={active ? "true" : undefined}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </nav>
    ),
    [activeId, handleAnchorClick],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start">
      <aside className="hidden xl:block xl:sticky xl:top-20">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </p>
          {anchorNav}
        </div>
      </aside>

      <div className="xl:hidden">
        <div className="flex gap-2 overflow-x-auto rounded-xl border border-border/60 bg-card/60 p-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => handleAnchorClick(section.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                section.id === activeId
                  ? "bg-primary/10 text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <SystemConfigSection
          initial={initial.systemConfig}
          noData={initial.noDataSystem}
          siteName={initial.siteName}
          onSave={saveSystem}
          onLocationResolved={(code) => {
            setResolvedCountryCode(code);
            track(
              "settings_location_resolved",
              { countryCode: code },
              { surface: "settings" },
            );
          }}
        />
        <EnergyBehaviorSection initial={initial.energyBehavior} onSave={saveEnergy} />
        <TariffsSection
          initial={initial.tariffs}
          suggestedCountryCode={resolvedCountryCode}
          onSave={saveTariffs}
        />
        <AutomationPrefsSection initial={initial.automationPrefs} onSave={saveAutomation} />
        <IntegrationsSection
          hardware={initial.hardware}
          services={initial.services}
          onConnect={handleConnect}
          onConnectInverter={handleConnectInverter}
          onDisconnectInverter={initial.inverterConnected ? handleDisconnectInverter : undefined}
        />
        <NotificationsSection initial={initial.notifications} onSave={saveNotifications} />
      </div>
    </div>
  );
}
