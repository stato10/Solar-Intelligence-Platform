"use client";

/**
 * Energy behavior section — doc 08 §5.2.
 *
 * Drives the automation recommendations in doc 06 and the opportunity
 * ordering in doc 07. Values map 1:1 to the `DeviceProfile` contract in
 * `apps/web/src/lib/contracts/onboarding.ts`.
 */

import { useState } from "react";
import { FormRow, NumberInput, Select, Toggle } from "./form-row";
import { SettingsSection } from "./settings-section";

export interface EnergyBehaviorFormValues {
  typicalAtHome: "morning" | "midday" | "evening" | "night" | "weekends";
  householdSize: number | "";
  hasEv: boolean;
  hasElectricWaterHeater: boolean;
  hasPool: boolean;
  flexibilityLevel: 1 | 2 | 3 | 4 | 5;
  futurePlans: ReadonlyArray<"battery" | "ev" | "expansion" | "heat-pump">;
}

const FUTURE_PLAN_OPTIONS: Array<{ value: EnergyBehaviorFormValues["futurePlans"][number]; label: string }> = [
  { value: "battery", label: "Add a battery" },
  { value: "ev", label: "Buy an EV" },
  { value: "expansion", label: "Expand panel array" },
  { value: "heat-pump", label: "Install a heat pump" },
];

export interface EnergyBehaviorSectionProps {
  initial: EnergyBehaviorFormValues;
  onSave: (values: EnergyBehaviorFormValues) => Promise<void>;
}

export function EnergyBehaviorSection({ initial, onSave }: EnergyBehaviorSectionProps) {
  const [values, setValues] = useState<EnergyBehaviorFormValues>(initial);

  const update = <K extends keyof EnergyBehaviorFormValues>(key: K, value: EnergyBehaviorFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlan = (plan: EnergyBehaviorFormValues["futurePlans"][number]) => {
    setValues((prev) => {
      const has = prev.futurePlans.includes(plan);
      const next = has
        ? prev.futurePlans.filter((p) => p !== plan)
        : [...prev.futurePlans, plan];
      return { ...prev, futurePlans: next };
    });
  };

  return (
    <SettingsSection
      id="energy-behavior"
      title="Energy behavior"
      description="How and when you use energy. Drives automation recommendations and opportunity ordering."
      onSave={() => onSave(values)}
    >
      <FormRow label="Typical at-home hours" htmlFor="at-home" helper="When is someone usually consuming energy at home?">
        <Select
          id="at-home"
          value={values.typicalAtHome}
          onChange={(e) => update("typicalAtHome", e.target.value as EnergyBehaviorFormValues["typicalAtHome"])}
        >
          <option value="morning">Mornings (06–10)</option>
          <option value="midday">Midday (10–16)</option>
          <option value="evening">Evenings (16–22)</option>
          <option value="night">Late night (22–06)</option>
          <option value="weekends">Weekends only</option>
        </Select>
      </FormRow>

      <FormRow label="Household size" htmlFor="hh-size" hint="people">
        <NumberInput
          id="hh-size"
          min={1}
          step={1}
          value={values.householdSize === "" ? "" : values.householdSize}
          onChange={(e) => update("householdSize", e.target.value === "" ? "" : Number(e.target.value))}
        />
      </FormRow>

      <FormRow label="EV" helper="Unlocks EV-charger automation windows.">
        <Toggle
          id="has-ev"
          checked={values.hasEv}
          onChange={(next) => update("hasEv", next)}
          label={values.hasEv ? "Yes, I own an EV" : "No"}
        />
      </FormRow>

      <FormRow label="Electric water heater / boiler" helper="Enables boiler-shift automation on the Automation page.">
        <Toggle
          id="has-heater"
          checked={values.hasElectricWaterHeater}
          onChange={(next) => update("hasElectricWaterHeater", next)}
          label={values.hasElectricWaterHeater ? "Yes" : "No"}
        />
      </FormRow>

      <FormRow label="Pool pump or other heavy loads">
        <Toggle
          id="has-pool"
          checked={values.hasPool}
          onChange={(next) => update("hasPool", next)}
          label={values.hasPool ? "Yes" : "No"}
        />
      </FormRow>

      <FormRow label="Usage flexibility" htmlFor="flex" helper="1 = very rigid, 5 = can shift most loads.">
        <Select
          id="flex"
          value={String(values.flexibilityLevel)}
          onChange={(e) => update("flexibilityLevel", Number(e.target.value) as EnergyBehaviorFormValues["flexibilityLevel"])}
        >
          <option value="1">1 — rigid</option>
          <option value="2">2</option>
          <option value="3">3 — neutral</option>
          <option value="4">4</option>
          <option value="5">5 — fully flexible</option>
        </Select>
      </FormRow>

      <FormRow label="Future plans" helper="Helps us prioritize the right opportunities.">
        <div className="flex flex-wrap gap-2">
          {FUTURE_PLAN_OPTIONS.map((opt) => {
            const active = values.futurePlans.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => togglePlan(opt.value)}
                aria-pressed={active}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FormRow>
    </SettingsSection>
  );
}
