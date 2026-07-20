/**
 * Location-based solar setup assistant.
 *
 * Generates dynamic, location-aware default recommendations and field help
 * for the onboarding flow. Works for ANY resolved address — nothing here is
 * specific to a single location.
 *
 * IMPORTANT: real installation data (system size, panel wattage, inverter
 * type) is NEVER guessed from the address. The location only informs
 * geometry (tilt/azimuth) and generic engineering defaults, which stay
 * fully editable by the user.
 */

export interface SolarSetupInput {
  resolvedAddress: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface SolarSetupRecommendation {
  recommendedTilt: number;
  recommendedAzimuth: number;
  preferredDirection: "south-facing" | "north-facing";
  recommendedEfficiency: number;
  recommendedLossPercent: number;
  explanationText: string;
  fieldHelp: Record<SolarFieldKey, string>;
}

export type SolarFieldKey =
  | "systemSize"
  | "tilt"
  | "azimuth"
  | "panelWattage"
  | "panelEfficiency"
  | "lossPercent"
  | "lastCleaningDate"
  | "inverterType"
  | "timezone"
  | "latitude"
  | "longitude";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Validates that a timezone string is a real IANA identifier
 * (e.g. "Asia/Jerusalem", "America/Chicago") — not a vague value
 * like "usa" or "israel".
 */
export function isValidIanaTimezone(timezone: string): boolean {
  if (!timezone || !timezone.includes("/")) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds location-based solar setup recommendations plus user-facing
 * explanation text and per-field help copy.
 */
export function generateSolarSetupExplanation(
  input: SolarSetupInput
): SolarSetupRecommendation {
  const { resolvedAddress, latitude, longitude, timezone } = input;

  // Tilt: latitude-based rule of thumb, clamped to a practical roof range.
  const recommendedTilt = clamp(Math.round(Math.abs(latitude)), 10, 45);

  // Azimuth: equator-facing panels maximize yearly output.
  const northernHemisphere = latitude >= 0;
  const recommendedAzimuth = northernHemisphere ? 180 : 0;
  const preferredDirection = northernHemisphere ? "south-facing" : "north-facing";

  const recommendedEfficiency = 20;
  const recommendedLossPercent = 14;

  const hemisphereNote = northernHemisphere
    ? "For most locations in the Northern Hemisphere, south-facing panels usually produce the best yearly output."
    : "For most locations in the Southern Hemisphere, north-facing panels are usually preferred.";

  const explanationText = [
    `We resolved your address to ${resolvedAddress}.`,
    "",
    `Based on this location, we detected timezone ${timezone}, latitude ${latitude.toFixed(4)}, and longitude ${longitude.toFixed(4)}. These values are used to calculate local sunlight, weather impact, air quality, and expected solar production.`,
    "",
    `We also suggested default solar settings for this location: tilt ${recommendedTilt}\u00B0 and azimuth ${recommendedAzimuth}\u00B0 (${preferredDirection}). ${hemisphereNote}`,
    "",
    "These are only estimates. If you know your real system size, panel wattage, roof tilt, azimuth, or inverter type, use the real installation values instead."
  ].join("\n");

  const fieldHelp: Record<SolarFieldKey, string> = {
    systemSize:
      "Enter the total installed solar capacity in kW (e.g. 8.5). This should come from your real solar installation — we never guess it from the address.",
    tilt: `The angle of your panels from horizontal. If unknown, ${recommendedTilt}\u00B0 is a good estimate for your latitude.`,
    azimuth: `The direction your panels face. 180\u00B0 is south, 90\u00B0 is east, 270\u00B0 is west, 0\u00B0 is north. For your location, ${recommendedAzimuth}\u00B0 (${preferredDirection}) usually gives the best yearly output.`,
    panelWattage:
      "The watt rating of one panel (e.g. 400 W, 420 W, 450 W). Use the value from your real panel model if known.",
    panelEfficiency: `The estimated efficiency of your panels. If unknown, ${recommendedEfficiency}% is a reasonable default for many modern panels.`,
    lossPercent: `Estimated production losses from heat, inverter conversion, wiring, soiling, shading, and degradation. ${recommendedLossPercent}% is a typical default.`,
    lastCleaningDate:
      "The last date the panels were cleaned. Used to estimate soiling loss. Leave empty if unknown.",
    inverterType:
      "Optional. Enter only if you know it: string inverter, microinverter, or hybrid inverter.",
    timezone:
      "Automatically detected from your address. Must be a valid IANA timezone such as America/Chicago or Asia/Jerusalem — never a vague value like a country name.",
    latitude:
      "Automatically detected from the address. Used for weather, sunlight, air quality, and production calculations.",
    longitude:
      "Automatically detected from the address. Used for weather, sunlight, air quality, and production calculations."
  };

  return {
    recommendedTilt,
    recommendedAzimuth,
    preferredDirection,
    recommendedEfficiency,
    recommendedLossPercent,
    explanationText,
    fieldHelp
  };
}
