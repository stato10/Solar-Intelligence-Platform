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
  },
  ai: {
    insights: "/ai/insights",
    insightsV3: "/ai/insights/v3"
  },
  integrations: {
    geolocationForward: "/integrations/providers/geolocation/forward"
  }
} as const;
