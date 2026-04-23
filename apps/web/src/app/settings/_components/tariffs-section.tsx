"use client";

/**
 * Tariffs section — doc 08 §5.3.
 *
 * Drives every monetary calculation in the product (loss card, savings
 * hero, opportunity ROI). Maps 1:1 to the `Tariff` contract.
 *
 * UX additions:
 *   - Country selector with "Use typical rates for X" button that
 *     pre-fills currency + import/export from `tariff-defaults`.
 *   - When the System Config section resolves an address, the shell
 *     forwards the resolved country code as `suggestedCountryCode` so
 *     this section can offer one-click defaults to users who don't
 *     know their own rates.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  COUNTRY_TARIFF_DEFAULTS,
  getTariffDefaultsForCountry,
  SUPPORTED_TARIFF_COUNTRY_CODES,
} from "@/lib/utils/tariff-defaults";
import { FormRow, NumberInput, Select, Toggle, TextInput } from "./form-row";
import { SettingsSection } from "./settings-section";

export interface TariffsFormValues {
  /** ISO-3166-1 alpha-2. Empty = "Other / custom". */
  countryCode: string;
  currency: "ILS" | "USD" | "EUR" | "GBP" | "CAD" | "AUD";
  importRate: number | "";
  exportRate: number | "";
  touEnabled: boolean;
  peakStart: string;
  peakEnd: string;
  peakRate: number | "";
  offPeakRate: number | "";
}

export interface TariffsSectionProps {
  initial: TariffsFormValues;
  /**
   * Country code resolved elsewhere (e.g. the System Config address).
   * When it changes we surface a subtle suggestion banner so the user
   * can apply typical rates in one click.
   */
  suggestedCountryCode?: string | null;
  onSave: (values: TariffsFormValues) => Promise<void>;
}

export function TariffsSection({ initial, suggestedCountryCode, onSave }: TariffsSectionProps) {
  const [values, setValues] = useState<TariffsFormValues>(initial);
  /** Remember which code we've already surfaced as a suggestion so we
   *  don't flash the banner on every parent re-render. */
  const [dismissedSuggestion, setDismissedSuggestion] = useState<string | null>(null);

  // Keep country in sync if the parent hydrates us with a new default
  // (e.g. dashboard aggregate lands after the first render).
  useEffect(() => {
    setValues((prev) => (prev.countryCode ? prev : { ...prev, countryCode: initial.countryCode }));
    // only want this on initial mount / when initial country changes
  }, [initial.countryCode]);

  const update = <K extends keyof TariffsFormValues>(key: K, value: TariffsFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const currencyUnit = `${values.currency} / kWh`;
  const currentDefaults = getTariffDefaultsForCountry(values.countryCode);

  function applyDefaultsFor(code: string) {
    const defaults = getTariffDefaultsForCountry(code);
    if (!defaults) return;
    setValues((prev) => ({
      ...prev,
      countryCode: defaults.code,
      currency: defaults.currency,
      importRate: defaults.importRate,
      exportRate: defaults.exportRate,
    }));
    setDismissedSuggestion(defaults.code);
  }

  const suggestion =
    suggestedCountryCode &&
    suggestedCountryCode !== values.countryCode &&
    suggestedCountryCode !== dismissedSuggestion
      ? getTariffDefaultsForCountry(suggestedCountryCode)
      : null;

  return (
    <SettingsSection
      id="tariffs"
      title="Tariffs"
      description="Your electricity pricing. Drives every monetary calculation — loss card, savings hero, opportunity ROI."
      onSave={() => onSave(values)}
      banner={
        suggestion ? (
          <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="font-medium text-foreground">
                Using typical rates for {suggestion.name}?
              </p>
              <p className="mt-0.5 text-muted-foreground">
                We detected <span className="font-mono">{suggestion.code}</span> from your address.
                Apply {suggestion.currency} {suggestion.importRate.toFixed(2)} import /{" "}
                {suggestion.exportRate.toFixed(2)} export as a starting point — edit afterwards.
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {suggestion.source}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDismissedSuggestion(suggestion.code)}
              >
                Dismiss
              </Button>
              <Button type="button" size="sm" onClick={() => applyDefaultsFor(suggestion.code)}>
                Apply defaults
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      <FormRow
        label="Country / region"
        htmlFor="tariff-country"
        helper="Sets typical rates if you don't know yours. You can still edit every value below."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            id="tariff-country"
            title="Country or region"
            aria-label="Country or region"
            value={values.countryCode}
            onChange={(e) => update("countryCode", e.target.value)}
          >
            <option value="">Other / custom</option>
            {SUPPORTED_TARIFF_COUNTRY_CODES.map((code) => {
              const entry = COUNTRY_TARIFF_DEFAULTS[code];
              return (
                <option key={code} value={code}>
                  {entry.name} ({entry.currency})
                </option>
              );
            })}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={!currentDefaults}
            onClick={() => values.countryCode && applyDefaultsFor(values.countryCode)}
            className="shrink-0"
          >
            {currentDefaults
              ? `Use typical rates for ${currentDefaults.name}`
              : "Pick a country to auto-fill"}
          </Button>
        </div>
        {currentDefaults ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Typical: {currentDefaults.currency} {currentDefaults.importRate.toFixed(2)} import ·{" "}
            {currentDefaults.exportRate.toFixed(2)} export · {currentDefaults.source}
          </p>
        ) : null}
      </FormRow>

      <FormRow label="Currency" htmlFor="currency" helper="Every money display in the product uses this currency.">
        <Select
          id="currency"
          title="Currency"
          aria-label="Currency"
          value={values.currency}
          onChange={(e) => update("currency", e.target.value as TariffsFormValues["currency"])}
        >
          <option value="ILS">ILS — Israeli shekel (₪)</option>
          <option value="USD">USD — US dollar ($)</option>
          <option value="EUR">EUR — Euro (€)</option>
          <option value="GBP">GBP — British pound (£)</option>
          <option value="CAD">CAD — Canadian dollar</option>
          <option value="AUD">AUD — Australian dollar</option>
        </Select>
      </FormRow>

      <FormRow label="Import rate" htmlFor="import-rate" hint={currencyUnit} required>
        <NumberInput
          id="import-rate"
          min={0}
          step={0.01}
          value={values.importRate === "" ? "" : values.importRate}
          onChange={(e) => update("importRate", e.target.value === "" ? "" : Number(e.target.value))}
        />
      </FormRow>

      <FormRow
        label="Export / feed-in rate"
        htmlFor="export-rate"
        hint={currencyUnit}
        helper="What your utility pays you per exported kWh."
      >
        <NumberInput
          id="export-rate"
          min={0}
          step={0.01}
          value={values.exportRate === "" ? "" : values.exportRate}
          onChange={(e) => update("exportRate", e.target.value === "" ? "" : Number(e.target.value))}
        />
      </FormRow>

      <FormRow label="Time-of-use pricing" helper="Enables peak / off-peak rates below.">
        <Toggle
          id="tou"
          checked={values.touEnabled}
          onChange={(next) => update("touEnabled", next)}
          label={values.touEnabled ? "Enabled" : "Flat-rate plan"}
        />
      </FormRow>

      {values.touEnabled ? (
        <>
          <FormRow label="Peak window" helper="When does the peak tariff apply?">
            <div className="flex items-center gap-2">
              <TextInput
                type="time"
                value={values.peakStart}
                onChange={(e) => update("peakStart", e.target.value)}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <TextInput
                type="time"
                value={values.peakEnd}
                onChange={(e) => update("peakEnd", e.target.value)}
              />
            </div>
          </FormRow>

          <FormRow label="Peak rate" htmlFor="peak-rate" hint={currencyUnit}>
            <NumberInput
              id="peak-rate"
              min={0}
              step={0.01}
              value={values.peakRate === "" ? "" : values.peakRate}
              onChange={(e) => update("peakRate", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </FormRow>

          <FormRow label="Off-peak rate" htmlFor="offpeak-rate" hint={currencyUnit}>
            <NumberInput
              id="offpeak-rate"
              min={0}
              step={0.01}
              value={values.offPeakRate === "" ? "" : values.offPeakRate}
              onChange={(e) => update("offPeakRate", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </FormRow>
        </>
      ) : null}
    </SettingsSection>
  );
}
