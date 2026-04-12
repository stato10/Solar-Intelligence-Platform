export interface TariffDefaults {
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
}

export function getDefaultTariff(countryCode?: string | null): TariffDefaults {
  const code = (countryCode || "").toUpperCase().trim();

  switch (code) {
    case "IL": // Israel
      return { selfConsumptionRate: 0.62, exportRate: 0.28, currency: "ILS" };
    case "US": // USA
      return { selfConsumptionRate: 0.15, exportRate: 0.05, currency: "USD" };
    case "DE": // Germany
      return { selfConsumptionRate: 0.35, exportRate: 0.08, currency: "EUR" };
    case "GB": // UK
      return { selfConsumptionRate: 0.34, exportRate: 0.05, currency: "GBP" };
    case "AU": // Australia
      return { selfConsumptionRate: 0.30, exportRate: 0.05, currency: "AUD" };
    case "ES": // Spain
      return { selfConsumptionRate: 0.25, exportRate: 0.08, currency: "EUR" };
    case "IT": // Italy
      return { selfConsumptionRate: 0.28, exportRate: 0.10, currency: "EUR" };
    case "FR": // France
      return { selfConsumptionRate: 0.25, exportRate: 0.10, currency: "EUR" };
    default:
      // Global fallback
      return { selfConsumptionRate: 0.20, exportRate: 0.05, currency: "USD" };
  }
}
