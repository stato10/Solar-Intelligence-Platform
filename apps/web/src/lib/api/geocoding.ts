import { API_ENDPOINTS } from "./endpoints";
import { getApiBaseUrl } from "./env";

export interface GeocodingResult {
  formattedAddress: string;
  lat: number;
  lon: number;
  timezone?: string;
  countryCode?: string;
  confidence?: number;
}

interface GeolocationForwardEnvelope {
  success: boolean;
  data?: {
    query: string;
    generatedAt: string;
    source: string;
    results: GeocodingResult[];
  };
}

/**
 * Forward-geocode an address string using the existing backend
 * OpenCage integration endpoint.
 *
 * Returns the first result or null if geocoding fails / returns nothing.
 */
export async function geocodeAddress(
  query: string,
  accessToken?: string
): Promise<GeocodingResult | null> {
  if (!query.trim()) {
    return null;
  }

  try {
    const url = new URL(
      `${getApiBaseUrl()}${API_ENDPOINTS.integrations.geolocationForward}`
    );
    url.searchParams.set("query", query.trim());

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn(
        `[geocoding] Forward geocode failed with status ${response.status}`
      );
      return null;
    }

    const envelope: GeolocationForwardEnvelope = await response.json();

    if (
      !envelope.success ||
      !envelope.data?.results ||
      envelope.data.results.length === 0
    ) {
      return null;
    }

    return envelope.data.results[0];
  } catch (error) {
    console.warn("[geocoding] Forward geocode request error:", error);
    return null;
  }
}
