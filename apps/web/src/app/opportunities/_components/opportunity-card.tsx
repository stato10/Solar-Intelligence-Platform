"use client";

import { useState } from "react";
import { Sparkles, Battery, Car, Droplets, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createLeadIntent } from "@/lib/api/marketplace";
import type { OpportunityCardVm } from "@/lib/view-models/opportunities";

interface OpportunityCardProps {
  card: OpportunityCardVm;
  siteId: string;
  accessToken?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  LOW: "bg-muted text-muted-foreground border-border",
};

const ICONS = {
  cleaning: Droplets,
  battery: Battery,
  ev: Car,
  general: Sparkles,
};

export function OpportunityCard({ card, siteId, accessToken }: OpportunityCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAction = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await createLeadIntent(
        {
          siteId,
          sourceType: card.sourceType,
          sourceReference: card.id,
          title: `Request for ${card.title}`,
          estimatedValue: card.estimatedValue,
          metadataJson: card.metadataJson,
        },
        accessToken
      );
      
      // Intentional UI delay for perceived "Fake-Real" processing
      setTimeout(() => {
        setIsSuccess(true);
        setIsSubmitting(false);
      }, 500);
      
    } catch (err) {
      setErrorMsg("Failed to initiate request. Please try again.");
      setIsSubmitting(false);
    }
  };

  const Icon = ICONS[card.iconType] || Sparkles;

  return (
    <article className="glass-card flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:shadow-lg border border-border/60">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{card.title}</h3>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border tracking-wider ${PRIORITY_STYLES[card.priorityLabel]}`}>
            {card.priorityLabel}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
          {card.description}
        </p>

        {/* Financial metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-card/40 rounded-xl p-3 border border-border/50">
          {card.lossMonth !== "₪0" ? (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Current Loss</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{card.lossMonth}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Estimated ROI</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{card.roiYears} <span className="text-xs font-normal">years</span></p>
            </div>
          )}
          
          <div>
             <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
               <ShieldCheck className="h-3 w-3" />
               Confidence
             </p>
             <p className="text-lg font-bold text-foreground">{card.confidencePercent}%</p>
          </div>
        </div>
      </div>

      <div>
        {errorMsg && <p className="text-xs text-rose-500 mb-2">{errorMsg}</p>}
        {isSuccess ? (
          <div className="w-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xl py-3 px-4 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Quote Request Sent (24h)</span>
          </div>
        ) : (
          <button
            onClick={handleAction}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-md hover:shadow-lg"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processing Request...</span>
            ) : (
              <>
                {card.iconType === "cleaning" ? "Schedule Cleaning" : "Request Free Quote"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
