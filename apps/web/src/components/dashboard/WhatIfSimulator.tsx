"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Battery, Sparkles, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { useCurrency } from "@/hooks/use-currency";
import { track } from "@/lib/analytics/client";

interface SimulationParams {
  cleaning: boolean;
  battery: boolean;
  automation: boolean;
}

/** Projected monthly profit for a toggle combination — kept pure so the
 *  analytics handler can compute the post-toggle delta before rendering. */
function projectMonthly(
  params: SimulationParams,
  currentMonthlyIls: number,
  maintenanceLeakageMonthlyIls: number,
  headroomMonthlyIls: number,
): number {
  let after = currentMonthlyIls;
  if (params.cleaning) after += maintenanceLeakageMonthlyIls;
  if (params.battery) after += (headroomMonthlyIls * 12 * 0.3) / 12;
  if (params.automation) after += (headroomMonthlyIls * 12 * 0.15) / 12;
  return after;
}

interface WhatIfSimulatorProps {
  currentMonthlyIls: number;
  maintenanceLeakageMonthlyIls: number; // Potential from cleaning
  headroomMonthlyIls: number; // Potential from battery/automation
  className?: string;
}

export function WhatIfSimulator({ 
  currentMonthlyIls, 
  maintenanceLeakageMonthlyIls, 
  headroomMonthlyIls,
  className = "" 
}: WhatIfSimulatorProps) {
  const [params, setParams] = useState<SimulationParams>({
    cleaning: false,
    battery: false,
    automation: false,
  });

  // doc 02 §9 / doc 17 §3.4 — `whatif_toggle_change` { toggleId, value, deltaNis }.
  const handleToggle = (toggleId: keyof SimulationParams) => {
    const next = { ...params, [toggleId]: !params[toggleId] };
    const nextDelta =
      projectMonthly(next, currentMonthlyIls, maintenanceLeakageMonthlyIls, headroomMonthlyIls) -
      currentMonthlyIls;
    track(
      "whatif_toggle_change",
      { toggleId, value: next[toggleId], deltaNis: Math.round(nextDelta) },
      { surface: "dashboard" },
    );
    setParams(next);
  };

  // Replicating the backend financial engine logic for instant local state preview
  // Real deployment would hit an endpoint on toggle, but local gives instant 60fps UX.
  const afterMonthlyIls = projectMonthly(
    params,
    currentMonthlyIls,
    maintenanceLeakageMonthlyIls,
    headroomMonthlyIls,
  );
  let hardwareCost = 0;
  if (params.cleaning) hardwareCost += 400;
  if (params.battery) hardwareCost += 15000;
  if (params.automation) hardwareCost += 1200;

  const deltaMonthly = afterMonthlyIls - currentMonthlyIls;
  const yearlyGain = deltaMonthly * 12;
  const roiYears = deltaMonthly > 0 ? (hardwareCost / yearlyGain).toFixed(1) : null;

  const { currency, locale } = useCurrency();
  const money = (value: number) =>
    formatCurrency(Math.round(value), { currency, locale, decimals: 0 });

  return (
    <Card className={`overflow-hidden border-orange-500/20 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 shadow-xl ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <CardTitle className="text-xl font-bold tracking-tight text-white">What-if Simulator</CardTitle>
          <Badge variant="outline" className="ml-auto bg-orange-500/10 text-orange-400 border-orange-500/20">
            BETA
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          Simulate the financial impact of upgrades and maintenance in real-time.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {/* Toggle Switches Area */}
        <div className="p-5 space-y-4 border-b border-slate-800">
          <ToggleRow 
            active={params.cleaning}
            icon={<Sparkles className="w-4 h-4" />}
            title="Clean Solar Panels" 
            desc={`Recover ~${money(maintenanceLeakageMonthlyIls)}/mo in dust losses`}
            onToggle={() => handleToggle("cleaning")}
          />
          <ToggleRow 
            active={params.battery}
            icon={<Battery className="w-4 h-4" />}
            title="Add 5kWh Battery" 
            desc="Store lost exports for night-time use"
            onToggle={() => handleToggle("battery")}
          />
          <ToggleRow 
            active={params.automation}
            icon={<Zap className="w-4 h-4" />}
            title="Smart Home Connect" 
            desc="Automate heavy loads to peak hours"
            onToggle={() => handleToggle("automation")}
          />
        </div>

        {/* Results Area */}
        <div className="p-5 bg-black/20 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-400">Current Profit</div>
            <div className="text-2xl font-bold text-slate-300">{money(currentMonthlyIls)}<span className="text-sm font-normal text-slate-500">/mo</span></div>
          </div>
          
          <ArrowRight className={`w-6 h-6 transition-colors duration-300 ${deltaMonthly > 0 ? "text-emerald-400" : "text-slate-700"}`} />
          
          <div className="space-y-1 text-right">
            <div className="text-sm font-medium text-emerald-400 flex items-center justify-end gap-2">
              Projected
              {deltaMonthly > 0 && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">+{money(deltaMonthly)}</span>}
            </div>
            <div className="text-3xl font-black text-white">{money(afterMonthlyIls)}<span className="text-sm font-bold text-slate-400">/mo</span></div>
          </div>
        </div>
        
        {/* ROI Info Bar */}
        {deltaMonthly > 0 && (
          <div className="bg-emerald-950/30 text-emerald-300 p-3 text-sm flex items-center justify-between border-t border-emerald-900/40">
            <span>Estimated Annual Gain: <strong>{money(yearlyGain)}</strong></span>
            <span>Est. ROI: <strong>{roiYears} Years</strong></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom Tailwind Toggle Component
function ToggleRow({ active, icon, title, desc, onToggle }: { active: boolean, icon: React.ReactNode, title: string, desc: string, onToggle: () => void }) {
  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
        active ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400'}`}>
          {icon}
        </div>
        <div>
          <div className={`font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>{title}</div>
          <div className="text-xs text-slate-500">{desc}</div>
        </div>
      </div>
      
      {/* Toggle visual */}
      <div className={`w-11 h-6 rounded-full p-1 transition-colors ${active ? 'bg-orange-500' : 'bg-slate-700'}`}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}
