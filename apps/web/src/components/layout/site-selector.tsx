"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { fetchUserSites } from "@/lib/api/sites";
import { ApiHttpError } from "@/lib/api/client";
import type { Site } from "@/lib/contracts/onboarding";
import { setActiveSite } from "@/app/actions";

const ACCESS_TOKEN_KEY = "sip.accessToken";

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}

/**
 * Clear a stale access token from both localStorage and the mirrored cookie
 * so subsequent client fetches don't keep producing 401s and tripping the
 * Next.js dev overlay. Safe no-op on the server.
 */
function clearStaleAccessToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // localStorage can throw in private mode; ignore.
  }
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function SiteSelector() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSites() {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userSites = await fetchUserSites(token);
        setSites(userSites);

        // Restore active site from cookie or default to first
        let currentActiveId = getCookieValue("sip.activeSiteId");

        if (!currentActiveId && userSites.length > 0) {
          currentActiveId = userSites[0].id;
          // set default securely and silently
          setActiveSite(currentActiveId).catch(() => {});
        }

        // Safety check: is the active site actually in the list?
        if (currentActiveId && !userSites.find((s) => s.id === currentActiveId) && userSites.length > 0) {
          currentActiveId = userSites[0].id;
          setActiveSite(currentActiveId).catch(() => {});
        }

        setActiveSiteId(currentActiveId);
      } catch (error) {
        // A 401 here means the token in localStorage is stale (e.g. after a
        // dev rebuild or a JWT secret rotation). Clear it so the sidebar
        // short-circuits silently on subsequent mounts and the dev overlay
        // stops flagging the already-handled rejection.
        if (error instanceof ApiHttpError && error.status === 401) {
          clearStaleAccessToken();
        } else {
          console.warn("Could not load user sites via SiteSelector:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadSites();
  }, []);

  if (isLoading || sites.length === 0) {
    return null;
  }

  const activeSite = sites.find((s) => s.id === activeSiteId) || sites[0];

  async function handleSelectSite(siteId: string) {
    setIsOpen(false);
    if (siteId === activeSiteId) return;

    setActiveSiteId(siteId);
    await setActiveSite(siteId);
    
    // Refresh the page so Server Components immediately reload with the new cookie context
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 min-w-[200px] hover:bg-muted/80 transition-colors"
      >
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col items-start flex-1 text-left min-w-0">
          <span className="text-xs font-semibold leading-none truncate w-[140px]">
            {activeSite.siteName}
          </span>
          <span className="text-[10px] text-muted-foreground truncate w-[140px]">
             {activeSite.address}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg z-50">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => handleSelectSite(site.id)}
                className={`flex w-full flex-col items-start rounded-md px-3 py-2 text-sm transition-colors ${
                  site.id === activeSiteId
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <span className="font-medium">{site.siteName}</span>
                <span className="text-xs opacity-70 truncate w-full text-left">{site.address}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
