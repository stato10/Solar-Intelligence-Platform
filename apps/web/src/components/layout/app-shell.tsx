 "use client";

import { SunMedium } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteSelector } from "./site-selector";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/auth", label: "Auth" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/savings", label: "Savings" },
  { href: "/settings", label: "Settings" }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="inline-flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/15 p-2 text-primary">
              <SunMedium className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">
                Solar Intelligence
              </p>
              <p className="text-xs text-muted-foreground">Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SiteSelector />
            <span className="hidden md:inline-flex rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              Phase 1 Scaffold
            </span>
          </div>
        </div>
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-2 overflow-x-auto px-6">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname?.startsWith(item.href);
            return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
            );
          })}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
