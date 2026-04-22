"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Droplets, Battery, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateLeadIntentPayload } from "@/lib/contracts/marketplace";
import { createLeadIntent } from "@/lib/api/marketplace";

interface MarketplaceActionCardProps {
  title: string;
  cause: string;
  monthlyLossIls: number;
  type: "cleaning" | "battery" | "automation";
  actionLabel: string;
  payload: CreateLeadIntentPayload;
  accessToken?: string;
}

export function MarketplaceActionCard({
  title,
  cause,
  monthlyLossIls,
  type,
  actionLabel,
  payload,
  accessToken
}: MarketplaceActionCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { toast } = useToast();

  const handleActionClick = async () => {
    try {
      setStatus("loading");
      await createLeadIntent(payload, accessToken);
      setStatus("success");
      toast({
        title: "Interest saved",
        description: "We'll connect you with relevant solutions shortly.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to create lead intent", error);
      setStatus("error");
      toast({
        title: "Error",
        description: "Failed to save request. Please try again.",
        variant: "error",
      });
    }
  };

  const getStyleForType = () => {
    switch(type) {
      case "cleaning": return { border: "border-amber-500/20", icon: <Droplets className="w-5 h-5 text-amber-500" />, accent: "text-amber-500" };
      case "battery": return { border: "border-blue-500/20", icon: <Battery className="w-5 h-5 text-blue-500" />, accent: "text-blue-500" };
      case "automation": return { border: "border-emerald-500/20", icon: <Zap className="w-5 h-5 text-emerald-500" />, accent: "text-emerald-500" };
      default: return { border: "border-slate-800", icon: <Sparkles className="w-5 h-5 text-primary" />, accent: "text-primary" };
    }
  };

  const style = getStyleForType();
  const yearlyGain = monthlyLossIls * 12;

  const getOptionsList = () => {
    switch(type) {
      case "cleaning": return ["Book local cleaning technician", "Install automatic robotic cleaning system"];
      case "battery": return ["Install SolarEdge Home Battery", "Retrofit existing SMA inverter with storage"];
      case "automation": return ["Smart switch for high-load boiler", "EV Charger scheduling integration"];
      default: return [];
    }
  };

  return (
    <Card className={`overflow-hidden border bg-slate-950 mt-4 transition-all duration-200 hover:shadow-lg ${style.border}`}>
      <CardContent className="p-0">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 rounded-lg">
              {style.icon}
            </div>
            <h4 className="text-lg font-bold text-white">
              {title}
            </h4>
          </div>

          {/* Value Hook */}
          <p className="text-slate-300 mb-4 px-1">
            You are losing <strong className="text-white">₪{Math.round(monthlyLossIls)}/month</strong> due to {cause}.
          </p>

          {/* Core Impacts */}
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Check className={`w-4 h-4 ${style.accent}`} />
              <span>Fix: <strong>{type.charAt(0).toUpperCase() + type.slice(1)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Estimated yearly gain: <strong>₪{Math.round(yearlyGain)}</strong></span>
            </div>
          </div>

          {/* Provider Examples */}
          <div className="px-1 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Options available:</p>
            <ul className="space-y-1">
              {getOptionsList().map((opt, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  {opt}
                </li>
              ))}
            </ul>
          </div>

          {/* Single Clear CTA */}
          <Button
            onClick={handleActionClick}
            disabled={status === "loading" || status === "success"}
            className={`w-full font-bold shadow-lg text-white transition-all ${
              status === "success" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {status === "loading" ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
            ) : status === "success" ? (
              <><Check className="mr-2 h-4 w-4" />Request Received</>
            ) : (
              actionLabel
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
