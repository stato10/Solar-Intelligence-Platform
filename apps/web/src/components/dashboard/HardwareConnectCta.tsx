"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Zap, BarChart3, ActivitySquare, ArrowRight } from "lucide-react";

export function HardwareConnectCta({ className = "" }: { className?: string }) {
  const [connecting, setConnecting] = useState(false);

  return (
    <Card className={`overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 to-slate-950 shadow-2xl relative ${className}`}>
      
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <CardHeader className="pb-3 border-b border-indigo-500/10 bg-black/20 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-white">
              Unlock Real-Time Monitoring
            </CardTitle>
            <CardDescription className="text-indigo-200/70 mt-1">
              Verify AI estimations with physical hardware metrics.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 relative z-10">
        <div className="grid gap-4 mb-6">
          <div className="flex gap-3 text-slate-300">
            <BarChart3 className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-sm">
              <strong className="text-white">Track your REAL losses in real-time</strong> instead of relying strictly on regional weather modeling.
            </p>
          </div>
          <div className="flex gap-3 text-slate-300">
            <ActivitySquare className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-sm">
              <strong className="text-white">Get automated maintenance alerts</strong> dispatched directly to technicians before your monthly bill spikes.
            </p>
          </div>
        </div>

        {!connecting ? (
          <div className="bg-black/30 p-4 rounded-xl border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm font-semibold text-slate-300">Supported Integrations</p>
              <p className="text-xs text-slate-500">SolarEdge · Enphase · SMA · Fronius</p>
            </div>
            <Button onClick={() => setConnecting(true)} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold group shadow-lg shadow-indigo-900/50">
              <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-indigo-200" />
              Connect System safely
            </Button>
          </div>
        ) : (
          <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm tracking-wide text-indigo-300 font-semibold mb-3 uppercase">Select Inverter Source</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors text-left group">
                <span className="font-semibold text-white">SolarEdge</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors text-left group">
                <span className="font-semibold text-white">Enphase</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors text-left group">
                <span className="font-semibold text-white">SMA</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors text-left group">
                <span className="font-semibold text-white">Other / Pinned API</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">You will be securely redirected to authenticate read-only access to your solar data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
