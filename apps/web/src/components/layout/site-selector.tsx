"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Check, Circle } from "lucide-react";
import { fetchUserSites } from "@/lib/api/sites";
import { ApiHttpError } from "@/lib/api/client";
import type { Site } from "@/lib/contracts/onboarding";
import { setActiveSite } from "@/app/actions";
import { cn } from "@/lib/utils";

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

/**
 * Read the substate cookie that the dashboard mirrors on every render.
 * "live" → the active site has fresh telemetry; anything else → not.
 *
 * Per docs/redesign/09-sidebar-shell.md §7, the dropdown shows a small
 * connection chip per site. We only know the active site's substate
 * without a per-site fetch, so non-active sites get a muted neutral chip.
 */
function readActiveSubstate(): string | null {
  return getCookieValue("sip.substate");
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

        let currentActiveId = getCookieValue("sip.activeSiteId");
        let cookieRepaired = false;

        if (!currentActiveId && userSites.length > 0) {
          currentActiveId = userSites[0].id;
          cookieRepaired = true;
        }

        if (
          currentActiveId &&
          !userSites.find((s) => s.id === currentActiveId) &&
          userSites.length > 0
        ) {
          currentActiveId = userSites[0].id;
          cookieRepaired = true;
        }

        setActiveSiteId(currentActiveId);

        if (cookieRepaired && currentActiveId) {
          // Persist the repaired cookie, then re-render server components so
          // pages aggregate the real site instead of the demo fallback.
          try {
            await setActiveSite(currentActiveId);
            router.refresh();
          } catch {
            // Non-fatal: the next navigation will retry.
          }
        }
      } catch (error) {
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
    // `router` is stable across renders (Next.js app router instance).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || sites.length === 0) {
    return null;
  }

  const activeSite = sites.find((s) => s.id === activeSiteId) || sites[0];
  const activeSubstate = readActiveSubstate();
  const activeIsLive = activeSubstate === "live";

  async function handleSelectSite(siteId: string) {
    setIsOpen(false);
    if (siteId === activeSiteId) return;

    setActiveSiteId(siteId);
    await setActiveSite(siteId);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Active site: ${activeSite.siteName}. Click to switch.`}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border bg-card/80 p-3 text-left transition-colors",
          "border-border/60 hover:border-border hover:bg-muted/60",
          isOpen && "border-border bg-muted/60",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          <MapPin className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold leading-tight text-foreground">
            {activeSite.siteName}
          </span>
          <span className="truncate text-[11px] leading-tight text-muted-foreground">
            {activeSite.address}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div
            role="listbox"
            aria-label="Choose site"
            className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg"
          >
            {sites.map((site) => {
              const isActive = site.id === activeSiteId;
              const isLive = isActive && activeIsLive;
              return (
                <button
                  key={site.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelectSite(site.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors",
                    isActive ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <div className="mt-0.5">
                    {isActive ? (
                      <Check className="size-4 text-primary" aria-hidden />
                    ) : (
                      <Circle className="size-4 text-muted-foreground/40" aria-hidden />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "truncate text-sm font-medium leading-tight",
                        isActive ? "text-foreground" : "text-foreground/90",
                      )}
                    >
                      {site.siteName}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {site.address}
                    </span>
                  </div>
                  {isActive ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                        isLive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400",
                      )}
                    >
                      {isLive ? "Connected" : "Not live"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
