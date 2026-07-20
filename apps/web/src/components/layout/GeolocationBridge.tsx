"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const GEO_COOKIE = "sip.geo";
const GEO_DENIED_COOKIE = "sip.geoDenied";

function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

/**
 * Captures the visitor's real browser location once and stores it in the
 * `sip.geo` cookie ("lat,lon,timezone"). Server components read the cookie to
 * feed the demo dashboard aggregate with real coordinates, so weather/solar
 * stats reflect the user's actual location instead of fixed demo coordinates.
 *
 * Respects a prior denial (won't re-prompt for 7 days) and does nothing when
 * a location is already stored.
 */
export function GeolocationBridge() {
  const router = useRouter();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    if (readCookie(GEO_COOKIE) || readCookie(GEO_DENIED_COOKIE)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
        const value = encodeURIComponent(
          `${latitude.toFixed(4)},${longitude.toFixed(4)},${timezone}`
        );
        // 24h TTL — refresh daily so travellers get updated local stats.
        document.cookie = `${GEO_COOKIE}=${value}; path=/; max-age=86400; samesite=lax`;
        // Re-render server components so the dashboard refetches with real coords.
        router.refresh();
      },
      () => {
        // Denied or unavailable — remember for 7 days to avoid nagging.
        document.cookie = `${GEO_DENIED_COOKIE}=1; path=/; max-age=${7 * 86400}; samesite=lax`;
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 }
    );
  }, [router]);

  return null;
}
