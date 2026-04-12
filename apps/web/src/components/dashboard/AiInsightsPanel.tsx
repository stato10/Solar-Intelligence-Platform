"use client";

import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { DashboardAiInsightsSection } from "@/app/dashboard/_components/ai-insights-section";
import type { AiInsightContractOutput, AiInsightContractOutputV3 } from "@/lib/contracts";

interface AiInsightsPanelProps {
  data: Pick<AiInsightContractOutput | AiInsightContractOutputV3, "currentStateInsights" | "productRecommendations" | "meta"> | null;
  errorMessage: string | null;
}

export function AiInsightsPanel({ data, errorMessage }: AiInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className="glass-card rounded-2xl border-primary/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 md:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-2xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold">AI Explanations & Deep Dive</p>
            <p className="text-xs text-muted-foreground">
              Read the full context behind the dashboard recommendations
            </p>
          </div>
        </div>
        <div className="text-muted-foreground">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/50 p-4 md:p-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <DashboardAiInsightsSection data={data} errorMessage={errorMessage} />
        </div>
      )}
    </article>
  );
}
