export interface SolarSystemEntity {
  id: string;
  siteId: string;
  systemSizeKw: number;
  tilt: number;
  azimuth: number;
  panelWattage: number;
  panelEfficiency: number;
  inverterType?: string;
  lastCleaningDate: string;
  createdAt: string;
  updatedAt: string;
}
