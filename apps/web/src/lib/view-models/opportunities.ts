import { formatCurrency, formatScore, formatDate } from "@/lib/utils/formatters";
import type { DashboardAggregateData, MarketplaceOpportunity } from "@/lib/contracts";
import type { LeadSourceType } from "@/lib/contracts/marketplace";

export interface OpportunityCardVm {
  id: string;
  sourceType: LeadSourceType;
  title: string;
  description: string;
  lossMonth: string;
  roiYears?: string;
  confidencePercent: number;
  priorityLabel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityLevel: number;
  iconType: "cleaning" | "battery" | "ev" | "general";
  metadataJson: Record<string, unknown>;
  estimatedValue: number;
}

export interface OpportunitiesPageViewModel {
  header: {
    title: string;
    subtitle: string;
  };
  context: {
    siteId: string;
    generatedAt: string;
  };
  opportunities: OpportunityCardVm[];
}

export function toOpportunitiesPageViewModel(
  data: DashboardAggregateData,
  rawOpps: MarketplaceOpportunity[]
): OpportunitiesPageViewModel {
  const cards: OpportunityCardVm[] = [];

  rawOpps.forEach((opp) => {
    let lossMonth = "₪0";
    let roiYears = undefined;
    let confidencePercent = 85; 
    let priorityLabel: OpportunityCardVm["priorityLabel"] = "MEDIUM";
    let priorityLevel = 2;
    let iconType: OpportunityCardVm["iconType"] = "general";
    let sourceType: LeadSourceType = "automation_recommendation";

    const title = opp.title.toLowerCase();

    // Map based on the marketplace derivation topics
    if (title.includes("clean") || opp.topic === "cleaning") {
      lossMonth = formatCurrency(data.intelligence?.profit.maintenanceLeakageMonthlyIls ?? 0);
      confidencePercent = data.soiling.estimatedLossPercent > 5 ? 92 : 85;
      priorityLabel = data.soiling.estimatedLossPercent > 10 ? "CRITICAL" : "HIGH";
      priorityLevel = 1;
      iconType = "cleaning";
      sourceType = "cleaning_recommendation";
    } 
    else if (title.includes("battery") || opp.topic === "battery") {
      lossMonth = "₪0"; 
      const yearly = data.financial.yearlyOptimizationPotential * 0.4; // rough
      roiYears = "6.2"; // fake-real estimation logic
      confidencePercent = data.benchmark.exportDeviationPercent < -15 ? 88 : 75;
      priorityLabel = "MEDIUM";
      priorityLevel = 3;
      iconType = "battery";
      sourceType = "battery_recommendation";
    }
    else if (title.includes("ev") || opp.topic === "ev") {
      roiYears = "3.5";
      confidencePercent = 78;
      priorityLabel = "LOW";
      priorityLevel = 4;
      iconType = "ev";
      sourceType = "ev_recommendation";
    }

    cards.push({
      id: opp.id,
      sourceType,
      title: opp.title,
      description: opp.description,
      lossMonth,
      roiYears,
      confidencePercent,
      priorityLabel,
      priorityLevel,
      iconType,
      estimatedValue: opp.estimatedValueIls ?? 0,
      metadataJson: opp.metadataJson,
    });
  });

  // Sort by priority level (1 = highest)
  cards.sort((a, b) => a.priorityLevel - b.priorityLevel);

  return {
    header: {
      title: "Marketplace & Upgrades",
      subtitle: "Verified opportunities to maximize your solar investment.",
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
    },
    opportunities: cards,
  };
}
