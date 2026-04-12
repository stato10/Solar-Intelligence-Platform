"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreateLeadIntentPayload } from "@/lib/contracts/marketplace";
import { createLeadIntent } from "@/lib/api/marketplace";

interface OpportunityActionCardProps {
  title: string;
  message: string;
  type: "service" | "product" | "automation";
  topic: string;
  estimatedValue?: string;
  actionLabel: string;
  payload: CreateLeadIntentPayload;
  accessToken?: string;
}

export function OpportunityActionCard({
  title,
  message,
  type,
  topic,
  estimatedValue,
  actionLabel,
  payload,
  accessToken
}: OpportunityActionCardProps) {
  const isEnabled = process.env.NEXT_PUBLIC_FEATURE_MARKETPLACE_OPPORTUNITIES === "true";
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!isEnabled) {
    return null;
  }

  const handleActionClick = async () => {
    try {
      setStatus("loading");
      await createLeadIntent(payload, accessToken);
      setStatus("success");
    } catch (error) {
      console.error("Failed to create lead intent", error);
      setStatus("error");
      // Could show toast here
    }
  };

  const getStyleForType = () => {
    switch(type) {
      case "service": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      case "product": return "text-blue-600 bg-blue-500/10 border-blue-500/20";
      case "automation": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
      default: return "text-primary bg-primary/10 border-primary/20";
    }
  }

  return (
    <div className={cn("mt-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm", getStyleForType())}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" />
            {title}
          </h4>
          <p className="mt-1 text-sm opacity-90">{message}</p>
          {estimatedValue && (
            <p className="mt-2 text-xs font-medium uppercase tracking-wider opacity-80">
              Est. Value: {estimatedValue}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Button
            onClick={handleActionClick}
            disabled={status === "loading" || status === "success"}
            className={cn(
              "shadow-sm w-full sm:w-auto transition-all",
              status === "success" ? "bg-emerald-600 hover:bg-emerald-600 !opacity-100" : ""
            )}
            size="sm"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : status === "success" ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Interest Saved
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </div>
      </div>
      
      {status === "error" && (
        <p className="mt-3 text-xs text-rose-600 font-medium">Failed to save request. Please try again.</p>
      )}
      {status === "success" && (
        <p className="mt-3 text-xs text-emerald-700 font-medium border-t border-emerald-500/20 pt-2">
          We&apos;ve recorded your interest and will connect you with relevant solutions shortly.
        </p>
      )}
    </div>
  );
}
