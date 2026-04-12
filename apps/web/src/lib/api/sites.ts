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

export async function fetchUserSites(accessToken?: string): Promise<Site[]> {
  try {
    const defaultHeaders: Record<string, string> = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const url = new URL(API_ENDPOINTS.onboarding.sites, "http://localhost:3000"); // Just need path to build with getJson which handles base URL
    
    // We get all sites, the server will filter by accessToken's userId
    const response = await getJson<SitesListResponse>(
      API_ENDPOINTS.onboarding.sites,
      undefined,
      { headers: defaultHeaders }
    );
    
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch user sites:", error);
    return [];
  }
}
