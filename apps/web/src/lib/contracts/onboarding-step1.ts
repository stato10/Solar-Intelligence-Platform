import type { Site, SolarSystem } from "./onboarding";

export interface OnboardingStep1CreateSiteRequest {
  userId: string;
  siteName: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface OnboardingStep1CreateSolarSystemRequest {
  siteId: string;
  systemSizeKw: number;
  tilt: number;
  azimuth: number;
  panelWattage: number;
  panelEfficiency: number;
  lastCleaningDate: string;
  inverterType?: string;
}

export interface OnboardingStep1Snapshot {
  siteId: string;
  solarSystemId: string;
  createdAt: string;
}

export interface DomainUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "admin";
}

export interface OnboardingStep1Result {
  site: Site;
  solarSystem: SolarSystem;
}
