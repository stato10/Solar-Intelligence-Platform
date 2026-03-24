import type { ApiSuccessEnvelope } from "./common";

export interface Site {
  id: string;
  userId: string;
  siteName: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: string;
}

export interface SolarSystem {
  id: string;
  siteId: string;
  systemSizeKw: number;
  tilt: number;
  azimuth: number;
  panelWattage: number;
  panelEfficiency: number;
  inverterType?: string | null;
  lastCleaningDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tariff {
  id: string;
  siteId: string;
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
  effectiveFrom: string;
}

export interface DeviceProfile {
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

export type SitesListSuccessEnvelope = ApiSuccessEnvelope<Site[]>;
export type SolarSystemsListSuccessEnvelope = ApiSuccessEnvelope<SolarSystem[]>;
export type TariffsListSuccessEnvelope = ApiSuccessEnvelope<Tariff[]>;
export type DevicesListSuccessEnvelope = ApiSuccessEnvelope<DeviceProfile[]>;

/*
 * Guardrail for Phase 6:
 * Auth contracts are intentionally separate from domain onboarding contracts.
 * Frontend must not assume auth identity is automatically equivalent to domain user bootstrap.
 */
