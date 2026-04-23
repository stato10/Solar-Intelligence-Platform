"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowDownRight, Info, ShieldAlert, BadgeInfo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatters";
import { useCurrency } from "@/hooks/use-currency";

interface LossBreakdown {
  mode: "forecast" | "estimated" | "real";
  totalLossKwh: number;
  totalMoneyLossIls: number;
  selfConsumptionLossIls: number;
  exportLossIls: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  causes?: { dust?: number; temperature?: number; clouds?: number; };
}

interface LossIntelligenceCardProps {
  lossBreakdown?: LossBreakdown;
  className?: string;
}

export function LossIntelligenceCard({ lossBreakdown, className = "" }: LossIntelligenceCardProps) {
  if (!lossBreakdown) {
    return (
      <Card className={`border-slate-800 bg-slate-900 shadow-sm ${className}`}>
        <CardContent className="p-6 flex items-center gap-4 text-slate-400">
          <Info className="w-5 h-5" />
          <span>No loss estimation data available at this time.</span>
        </CardContent>
      </Card>
    );
  }

  const { mode, totalMoneyLossIls, selfConsumptionLossIls, exportLossIls, confidence } = lossBreakdown;
  const { currency, locale } = useCurrency();
  const money = (value: number) =>
    formatCurrency(Math.round(value), { currency, locale, decimals: 0 });

  // Determine styling based on Mode
  const isEstimated = mode === "estimated";
  const isReal = mode === "real";
  
  const headerTheme = isReal 
    ? "from-red-500/20 to-rose-500/5 text-rose-500 border-rose-500/20" 
    : isEstimated 
      ? "from-amber-500/20 text-amber-500 border-amber-500/20" 
      : "from-blue-500/20 text-blue-400 border-blue-500/20";
      
  const TitleIcon = isReal ? ShieldAlert : isEstimated ? AlertCircle : BadgeInfo;

  return (
    <Card className={`overflow-hidden border-slate-800 bg-slate-950 shadow-xl ${className}`}>
      {/* Dynamic Header Block */}
      <div className={`p-5 border-b bg-gradient-to-r ${headerTheme} flex items-start justify-between`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TitleIcon className="w-5 h-5" />
            <h3 className="font-bold text-lg text-white">
              {mode === "forecast" && "Potential Performance Loop"}
              {mode === "estimated" && "Estimated Value Loss"}
              {mode === "real" && "Real Verified Loss"}
            </h3>
            <Badge variant="outline" className={`ml-2 uppercase tracking-tight text-[10px] ${
              confidence === "high" ? "border-emerald-500/30 text-emerald-400" :
              confidence === "medium" ? "border-amber-500/30 text-amber-400" :
              "border-slate-500/30 text-slate-400"
            }`}>
              {confidence} CONFIDENCE
            </Badge>
          </div>
          <p className="text-sm opacity-80 pl-7">
            {mode === "forecast" && "Based heavily on historical PVGIS expectations."}
            {mode === "estimated" && "Extrapolated from real-time regional weather physics."}
            {mode === "real" && "Driven by live telemetry from your smart inverter."}
          </p>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Main Hook */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Calculated Deficit</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-white">
                {money(totalMoneyLossIls)}
              </span>
              <span className="text-lg font-medium text-slate-500">/mo</span>
            </div>
            {totalMoneyLossIls > 50 && (
              <div className="flex items-center mt-2 text-rose-400 font-medium text-sm gap-1 bg-rose-500/10 w-fit px-2 py-1 rounded">
                <ArrowDownRight className="w-4 h-4" />
                Action required to recover profits
              </div>
            )}
            
            {/* Conversion Trigger text block */}
            {!isReal && (
              <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-xs text-indigo-300 font-medium tracking-wide">Confidence: {confidence.toUpperCase()}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold text-indigo-400">Upgrade to High accuracy</p>
                  <a href="#connect" className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-500 transition-colors">
                    Connect System
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-24 bg-slate-800 hidden md:block" />

          {/* Explicit Breakdown */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Self-Consumption Valuation</span>
                <span className="font-mono text-rose-400">-{money(selfConsumptionLossIls)}</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500/80 rounded-full" 
                  style={{ width: `${Math.max(5, (selfConsumptionLossIls / totalMoneyLossIls) * 100)}%`}}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Cost incurred buying back from grid</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Export Valuation</span>
                <span className="font-mono text-rose-400">-{money(exportLossIls)}</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500/80 rounded-full" 
                  style={{ width: `${Math.max(5, (exportLossIls / totalMoneyLossIls) * 100)}%`}}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Missed direct compensation payout</p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
