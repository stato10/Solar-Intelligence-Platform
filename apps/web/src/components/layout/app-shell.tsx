import { SunMedium } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="inline-flex items-center gap-2">
            <div className="rounded-md bg-primary/15 p-1.5 text-primary">
              <SunMedium className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">
                Solar Intelligence
              </p>
              <p className="text-xs text-muted-foreground">Control Center</p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            Phase 1 Scaffold
          </span>
        </div>
        <div className="mx-auto flex h-11 w-full max-w-7xl items-center gap-2 px-6">
          {[
            { href: "/", label: "Home" },
            { href: "/auth", label: "Auth" },
            { href: "/dashboard", label: "Dashboard" },
            { href: "/maintenance", label: "Maintenance" },
            { href: "/savings", label: "Savings" },
            { href: "/settings", label: "Settings" }
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
