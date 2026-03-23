import type { Tariff } from "./onboarding";

export interface OnboardingStep2CreateTariffRequest {
  siteId: string;
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
  effectiveFrom: string;
}

export interface OnboardingStep2CreateDeviceProfileRequest {
  siteId: string;
  hasBoiler: boolean;
  hasEv: boolean;
  hasDishwasher: boolean;
  hasWashingMachine: boolean;
  hasAc: boolean;
  usageFlexibilityLevel: number;
}

export interface OnboardingStep2DeviceProfile {
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

export interface OnboardingStep2Snapshot {
  siteId: string;
  tariffId: string;
  deviceProfileId: string;
  createdAt: string;
}

export interface OnboardingStep2Result {
  tariff: Tariff;
  deviceProfile: OnboardingStep2DeviceProfile;
}
