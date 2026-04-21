export type CalculationMode = "forecast" | "estimated" | "real";

export interface SystemTariff {
  currency: string;
  importRate: number;
  exportRate: number;
}
