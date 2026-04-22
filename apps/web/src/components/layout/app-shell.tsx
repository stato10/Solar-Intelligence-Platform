"use client";

import { useState, useEffect } from "react";
import { SunMedium, LayoutDashboard, Wrench, PiggyBank, Bell, Zap, TrendingUp, Settings, Menu, X, HelpCircle, Info } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteSelector } from "./site-selector";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Upgrades", icon: TrendingUp },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative">
      
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:flex",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800/60 lg:h-20 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
              <SunMedium className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white">Solar Intelligence</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Control Center</span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Context (Site Selector) */}
        <div className="px-4 py-4">
          <SiteSelector />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col px-3 py-2 overflow-y-auto">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Guides Section */}
          <div className="mt-auto pt-6 pb-2 px-3">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Support & Learning
            </div>
            
            <Link
              href="/onboarding"
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                pathname === "/onboarding"
                  ? "text-indigo-400 bg-indigo-500/5"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
              )}
            >
              <Info className="h-3.5 w-3.5 shrink-0" />
              System Setup
            </Link>

            <button
              onClick={() => {
                if (pathname !== "/dashboard") {
                  window.location.href = "/dashboard?tour=true";
                } else {
                  window.dispatchEvent(new CustomEvent("sip:open-onboarding"));
                }
              }}
              className="w-full group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              Dashboard Tour
            </button>
          </div>
        </nav>

        {/* Sticky Profile / Connection Status at bottom */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3">
            <div className="h-8 w-8 rounded-full bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Premium Plan</span>
              <span className="text-xs text-slate-400">View Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 lg:hidden sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-300 hover:text-white p-1"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold leading-none">Currently viewing</span>
              <span className="font-bold text-sm leading-tight text-slate-200">System Dashboard</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8 shrink-0 flex-1 2xl:max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
