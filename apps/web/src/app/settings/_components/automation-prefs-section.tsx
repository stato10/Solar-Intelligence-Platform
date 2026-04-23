"use client";

/**
 * Automation preferences section — doc 08 §5.4.
 *
 * Directly feeds the Automation page Day Timeline (doc 06).
 */

import { useState } from "react";
import { FormRow, TextInput, Toggle } from "./form-row";
import { SettingsSection } from "./settings-section";

export interface DeviceWindowPreference {
  device: "boiler" | "dishwasher" | "ev-charger" | "smart-switch";
  label: string;
  start: string;
  end: string;
  enabled: boolean;
}

export interface AutomationPrefsFormValues {
  deviceWindows: DeviceWindowPreference[];
  weatherOverride: boolean;
  notifyBeforeTrigger: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

export interface AutomationPrefsSectionProps {
  initial: AutomationPrefsFormValues;
  onSave: (values: AutomationPrefsFormValues) => Promise<void>;
}

export function AutomationPrefsSection({ initial, onSave }: AutomationPrefsSectionProps) {
  const [values, setValues] = useState<AutomationPrefsFormValues>(initial);

  const updateWindow = (idx: number, patch: Partial<DeviceWindowPreference>) => {
    setValues((prev) => ({
      ...prev,
      deviceWindows: prev.deviceWindows.map((w, i) => (i === idx ? { ...w, ...patch } : w)),
    }));
  };

  const update = <K extends keyof AutomationPrefsFormValues>(key: K, value: AutomationPrefsFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsSection
      id="automation-preferences"
      title="Automation preferences"
      description="Default windows and rules the Automation page uses when scheduling devices."
      onSave={() => onSave(values)}
    >
      {values.deviceWindows.map((window, idx) => (
        <FormRow
          key={window.device}
          label={window.label}
          helper={window.enabled ? "Preferred operating window" : "Automation disabled for this device"}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Toggle
              id={`auto-${window.device}`}
              checked={window.enabled}
              onChange={(next) => updateWindow(idx, { enabled: next })}
              label={window.enabled ? "On" : "Off"}
            />
            <div className="flex items-center gap-2">
              <TextInput
                type="time"
                value={window.start}
                disabled={!window.enabled}
                onChange={(e) => updateWindow(idx, { start: e.target.value })}
              />
              <span className="text-sm text-muted-foreground">–</span>
              <TextInput
                type="time"
                value={window.end}
                disabled={!window.enabled}
                onChange={(e) => updateWindow(idx, { end: e.target.value })}
              />
            </div>
          </div>
        </FormRow>
      ))}

      <FormRow
        label="Weather override"
        helper="Skip automation on low-solar forecast days so we don't spend grid energy to hit a solar window."
      >
        <Toggle
          id="weather-override"
          checked={values.weatherOverride}
          onChange={(next) => update("weatherOverride", next)}
          label={values.weatherOverride ? "Enabled" : "Disabled"}
        />
      </FormRow>

      <FormRow label="Notify before automation triggers" helper="Send a push/email right before each automated device run.">
        <Toggle
          id="notify-before"
          checked={values.notifyBeforeTrigger}
          onChange={(next) => update("notifyBeforeTrigger", next)}
          label={values.notifyBeforeTrigger ? "Yes" : "No"}
        />
      </FormRow>

      <FormRow label="Quiet hours" helper="Suppress notifications during this range.">
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            id="quiet-toggle"
            checked={values.quietHoursEnabled}
            onChange={(next) => update("quietHoursEnabled", next)}
            label={values.quietHoursEnabled ? "On" : "Off"}
          />
          <div className="flex items-center gap-2">
            <TextInput
              type="time"
              value={values.quietStart}
              disabled={!values.quietHoursEnabled}
              onChange={(e) => update("quietStart", e.target.value)}
            />
            <span className="text-sm text-muted-foreground">–</span>
            <TextInput
              type="time"
              value={values.quietEnd}
              disabled={!values.quietHoursEnabled}
              onChange={(e) => update("quietEnd", e.target.value)}
            />
          </div>
        </div>
      </FormRow>
    </SettingsSection>
  );
}
