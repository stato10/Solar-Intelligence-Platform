"use client";

/**
 * AppShell — global product chrome (sidebar + main column).
 *
 * Layout (per docs/redesign/09-sidebar-shell.md and 10-responsive.md):
 *   1. Brand lockup     — h-16, logo + wordmark, fixed.
 *   2. Site selector    — two-line layout, see SiteSelector.
 *   3. Ambient status   — SidebarSystemStatus chip.
 *   4. Primary nav      — scrollable. Each item may render an urgency
 *                         badge driven by `useSidebarBadges()`.
 *   5. Secondary nav    — Support & Learning.
 *   6. Utility zone     — bottom-pinned, never scrolls. Connect CTA
 *                         (conditional), integration status, plan,
 *                         support link.
 *
 * Mobile: below `lg` the sidebar slides in as a drawer; the utility
 * zone is included so connect / support are reachable everywhere.
 *
 * Instrumentation: `sidebar_nav_click` fires on every primary nav
 * click with `{ destination, hasUrgencyBadge }`.
 */

import { useState } from "react";
import {
  SunMedium,
  LayoutDashboard,
  Wrench,
  PiggyBank,
  Bell,
  Zap,
  TrendingUp,
  Settings,
  Menu,
  X,
  HelpCircle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/client";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { useSidebarBadges } from "@/hooks/use-sidebar-badges";
import { SiteSelector } from "./site-selector";
import { SidebarSystemStatus } from "./SidebarSystemStatus";
import { SidebarUtilityZone } from "./SidebarUtilityZone";
import {
  NavUrgencyBadge,
  type BadgeTone,
  type BadgeVariant,
} from "./NavUrgencyBadge";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Upgrades", icon: TrendingUp },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface ResolvedBadge {
  variant: BadgeVariant;
  tone: BadgeTone;
  count?: number;
  label?: string;
  ariaLabel: string;
}

/**
 * Map a nav destination to its current urgency badge — or null when
 * nothing is unresolved. Per doc 09 §5:
 *   - Alerts        → critical/warning dot, count chip when >1.
 *   - Maintenance   → warning dot when an unresolved concern exists.
 *   - Opportunities → "New" info chip when a high-priority
 *                     opportunity surfaced today.
 */
function resolveBadge(
  href: string,
  badges: ReturnType<typeof useSidebarBadges>,
): ResolvedBadge | null {
  if (href === "/alerts" && badges.alertCount > 0) {
    if (badges.alertCount === 1) {
      return {
        variant: "dot",
        tone: "critical",
        ariaLabel: "1 unresolved alert",
      };
    }
    return {
      variant: "count",
      tone: "critical",
      count: badges.alertCount,
      ariaLabel: `${badges.alertCount} unresolved alerts`,
    };
  }
  if (href === "/maintenance" && badges.maintenanceCount > 0) {
    return {
      variant: "dot",
      tone: "warning",
      ariaLabel: `${badges.maintenanceCount} unresolved maintenance concern${
        badges.maintenanceCount === 1 ? "" : "s"
      }`,
    };
  }
  if (href === "/opportunities" && badges.hasNewOpportunity) {
    return {
      variant: "label",
      tone: "info",
      label: "New",
      ariaLabel: "New high-priority opportunity",
    };
  }
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const badges = useSidebarBadges();

  // Close the mobile drawer whenever the route changes — "adjust state
  // during render" pattern (avoids a cascading setState-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  const handleNavClick = (item: NavItem, hasBadge: boolean) => {
    track(
      "sidebar_nav_click",
      { destination: item.href, hasUrgencyBadge: hasBadge },
      { surface: "sidebar" },
    );
  };

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100">
      {/* page_view instrumentation — fires on every route change (doc 17 §3.2) */}
      <PageViewTracker />

      {/* Mobile drawer overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:flex",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* 1. Brand lockup */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/60 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Solar Intelligence — go to dashboard"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <SunMedium className="size-5" aria-hidden />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-plus-jakarta text-sm font-semibold tracking-tight text-white">
                Solar Intelligence
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Control Center
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 2. + 3. Site selector + ambient status */}
        <div className="space-y-2 px-3 py-4">
          <SiteSelector />
          <SidebarSystemStatus />
        </div>

        {/* 4. Primary nav (scrollable) + 5. secondary nav.
            The nav region scrolls if it overflows; the utility zone
            below stays pinned. */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Main menu
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href) ?? false;
              const Icon = item.icon;
              const badge = resolveBadge(item.href, badges);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item, badge !== null)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                  )}
                >
                  {/* Left active rail */}
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-slate-500 group-hover:text-slate-200",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge ? (
                    <NavUrgencyBadge
                      variant={badge.variant}
                      tone={badge.tone}
                      count={badge.count}
                      label={badge.label}
                      ariaLabel={badge.ariaLabel}
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Secondary nav — Support & Learning */}
          <div className="mt-auto pb-4 pt-6">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Support &amp; Learning
            </div>

            <Link
              href="/onboarding"
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                pathname === "/onboarding"
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:bg-slate-900/50 hover:text-slate-300",
              )}
            >
              <Info className="size-3.5 shrink-0" aria-hidden />
              System Setup
            </Link>

            <button
              type="button"
              onClick={() => {
                if (pathname !== "/dashboard") {
                  window.location.href = "/dashboard?tour=true";
                } else {
                  window.dispatchEvent(new CustomEvent("sip:open-onboarding"));
                }
              }}
              className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-900/50 hover:text-slate-300"
            >
              <HelpCircle className="size-3.5 shrink-0" aria-hidden />
              Dashboard tour
            </button>
          </div>
        </nav>

        {/* 6. Utility zone — never scrolls */}
        <SidebarUtilityZone />
      </aside>

      {/* Main content container */}
      <main className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 shadow-sm lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 text-slate-300 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </button>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Currently viewing
              </span>
              <span className="text-sm font-bold text-slate-200">
                {NAV_ITEMS.find((item) => pathname?.startsWith(item.href))?.label
                  ?? (pathname === "/onboarding" ? "System Setup" : "Solar Intelligence")}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1800px]">
          {children}
        </div>
      </main>
    </div>
  );
}
