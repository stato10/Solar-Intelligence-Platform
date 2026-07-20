import type { Site } from "../contracts/onboarding";
import { API_ENDPOINTS } from "./endpoints";
import { getJson } from "./client";

interface SitesListResponse {
  success: boolean;
  data: Site[];
  meta: {
    pagination: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
    timestamp: string;
    version: string;
  };
}

/**
 * Fetches the authenticated user's sites.
 *
 * Errors are intentionally NOT caught here. Callers (e.g. `SiteSelector`)
 * need to discriminate:
 *   - 401 → token is stale, clear it and render the logged-out shell
 *   - 5xx / network → log a warn and degrade gracefully
 *
 * Catching and `console.error`-ing inside this helper would (a) hide the
 * recoverable 401 from upstream cleanup logic and (b) trip the Next.js
 * dev overlay, because Next 15+/Turbopack treats `console.error(<Error>)`
 * as an unhandled error.
 */
export async function fetchUserSites(accessToken?: string): Promise<Site[]> {
  const headers: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  // The API filters by the userId encoded in the access token.
  const response = await getJson<SitesListResponse>(
    API_ENDPOINTS.onboarding.sites,
    undefined,
    { headers }
  );

  if (response?.success && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}
