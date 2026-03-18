export interface TariffEntity {
  id: string;
  siteId: string;
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
  effectiveFrom: string;
}
