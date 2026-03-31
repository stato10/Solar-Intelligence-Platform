import { EnergyDecisionItem, EnergyDecisionTopic } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Battery,
  Car,
  Home,
  Clock,
  Wrench,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import React from "react";

interface EnergyDecisionsSectionProps {
  decisions: EnergyDecisionItem[];
}

const TOPIC_ICONS: Record<EnergyDecisionTopic, React.ElementType> = {
  "self-consumption-vs-export": Zap,
  "battery-worthiness": Battery,
  "ev-charging": Car,
  "boiler-automation": Home,
  "load-shifting": Clock,
  "maintenance-priority": Wrench
};

function DecisionCard({ item }: { item: EnergyDecisionItem }) {
  const Icon = TOPIC_ICONS[item.topic] || Lightbulb;
  
  const recColor = 
    item.recommendation === "recommended" ? "default" :
    item.recommendation === "consider" ? "secondary" : "outline";

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl bg-card hover:bg-accent/10 transition-colors">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-base">{item.title}</h4>
          <div className="flex items-center gap-2">
            <Badge variant={recColor} className="capitalize">
              {item.recommendation.replace(/-/g, " ")}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{item.message}</p>
        
        <div className="pt-2 flex items-center gap-4 text-xs">
          {item.estimatedBenefitRangeIlsMonthly && (
            <div className="font-medium text-emerald-600 dark:text-emerald-400">
              Est. savings: ₪{item.estimatedBenefitRangeIlsMonthly.min} - ₪{item.estimatedBenefitRangeIlsMonthly.max}/mo
            </div>
          )}
          {item.severity !== "low" && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              <span className="capitalize">{item.severity} Priority</span>
            </div>
          )}
        </div>
        
        {/* Phase 7.12 Product Link Interstitials */}
        {item.requiresPurchase && item.suggestedProduct && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Upgrade</span>
                <span className="text-sm font-medium">{item.suggestedProduct.name}</span>
              </div>
              <button className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors font-medium">
                Get a Quote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EnergyDecisionsSection({ decisions }: EnergyDecisionsSectionProps) {
  if (!decisions || decisions.length === 0) return null;

  const availableNow = decisions.filter(d => !d.requiresPurchase);
  const upgradeDependent = decisions.filter(d => d.requiresPurchase);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-8">
      {/* 1. Without purchases (Available Now) */}
      <Card className="shadow-sm border-border">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex flex-col gap-1.5">
            <span className="text-xl">What you can improve now</span>
            <span className="text-sm font-normal text-muted-foreground">Adjust behaviors to save money immediately without buying new hardware.</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {availableNow.length > 0 ? (
            availableNow.map(item => <DecisionCard key={item.id} item={item} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              You are highly optimized! No immediate behavioral changes required.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. With purchases (Upgrade Dependent) */}
      <Card className="shadow-sm border-border">
        <CardHeader className="bg-primary/5 border-b pb-4">
          <CardTitle className="flex flex-col gap-1.5">
            <span className="text-xl">Smart upgrades worth considering</span>
            <span className="text-sm font-normal text-muted-foreground">Hardware additions that offer a strong ROI based on your specific profile.</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {upgradeDependent.length > 0 ? (
            upgradeDependent.map(item => <DecisionCard key={item.id} item={item} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              No hardware purchases are financially justified at this time.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
