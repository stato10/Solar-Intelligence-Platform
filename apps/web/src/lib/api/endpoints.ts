export const API_ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    me: "/auth/me"
  },
  onboarding: {
    sites: "/sites",
    solarSystems: "/solar-systems",
    tariffs: "/tariffs",
    devices: "/devices"
  },
  dashboard: {
    aggregate: "/dashboard/aggregate",
    demoSeed: "/dashboard/demo/seed"
  }
} as const;
