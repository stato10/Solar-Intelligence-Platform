"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Zap, BarChart3, ActivitySquare, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/client";

export function HardwareConnectCta({ className = "" }: { className?: string }) {
  const [connecting, setConnecting] = useState(false);

  return (
    <Card className={`overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 to-slate-950 shadow-2xl relative ${className}`}>
      
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <CardHeader className="pb-3 border-b border-indigo-500/10 bg-black/20 z-10 relative">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold tracking-tight text-white sm:text-lg">
              Unlock Real-Time Monitoring
            </CardTitle>
            <CardDescription className="text-indigo-200/70 mt-1 text-xs sm:text-sm">
              Verify AI estimations with physical hardware metrics.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 relative z-10 sm:p-6">
        <div className="grid gap-3 mb-5">
          <div className="flex gap-3 text-slate-300">
            <BarChart3 className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
            <p className="text-xs sm:text-sm leading-snug">
              <strong className="text-white">Track your REAL losses in real-time</strong> instead of relying on regional weather modeling.
            </p>
          </div>
          <div className="flex gap-3 text-slate-300">
            <ActivitySquare className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
            <p className="text-xs sm:text-sm leading-snug">
              <strong className="text-white">Get automated maintenance alerts</strong> dispatched before your monthly bill spikes.
            </p>
          </div>
        </div>

        {!connecting ? (
          <div className="bg-black/30 p-4 rounded-xl border border-indigo-500/10 flex flex-col gap-3 transition-all">
            <Button
              onClick={() => {
                // doc 02 §9 — `connect_system_cta_click` { surface: "dashboard_right" }.
                track(
                  "connect_system_cta_click",
                  { surface: "dashboard_right" },
                  { surface: "dashboard" },
                );
                setConnecting(true);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold group shadow-lg shadow-indigo-900/50"
            >
              <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-indigo-200" />
              Connect System safely
            </Button>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Supported integrations
              </p>
              <p className="text-xs text-slate-500">SolarEdge · Enphase · SMA · Fronius</p>
            </div>
          </div>
        ) : (
          <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm tracking-wide text-indigo-300 font-semibold mb-3 uppercase">Select Inverter Source</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {["SolarEdge", "Enphase", "SMA", "Other / Simulated"].map((vendor) => (
                <Link
                  key={vendor}
                  href="/settings#integrations"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors text-left group"
                >
                  <span className="font-semibold text-white">{vendor}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">Enter your vendor API key in Settings → Integrations. Access is read-only and the key is encrypted at rest.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
