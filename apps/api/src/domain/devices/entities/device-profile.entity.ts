export interface DeviceProfileEntity {
  id: string;
  siteId: string;
  hasBoiler: boolean;
  hasEv: boolean;
  hasDishwasher: boolean;
  hasWashingMachine: boolean;
  hasAc: boolean;
  usageFlexibilityLevel: number;
  createdAt: string;
}
