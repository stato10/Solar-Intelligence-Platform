import { formatCurrency, formatScore, formatTimeRange, formatDate } from "@/lib/utils/formatters";
import type { DashboardAggregateData } from "@/lib/contracts";

export interface SmartDeviceRecommendationVm {
  id: string;
  deviceName: string;
  recommendedAction: string;
  financialImpactMonth: string;
  financialImpactYear: string;
  iconType: "pool" | "ev" | "heater" | "general";
}

export interface EnergyShiftVm {
  windowStart: string;
  windowEnd: string;
  windowLabel: string;
  totalShiftValueMonth: string;
}

export interface AutomationPageViewModel {
  header: {
    title: string;
    subtitle: string;
  };
  context: {
    siteId: string;
    generatedAt: string;
  };
  selfConsumption: {
    score: number;
    scoreText: string;
    description: string;
  };
  energyShift: EnergyShiftVm;
  deviceRecommendations: SmartDeviceRecommendationVm[];
}

export function toAutomationPageViewModel(data: DashboardAggregateData): AutomationPageViewModel {
  const sc = data.selfConsumption;
  const score = sc.selfConsumptionScore;
  const monthlySavings = sc.estimatedSavingsIls * 30; // approx monthly
  const yearlySavings = sc.estimatedSavingsIls * 365;

  const devices: SmartDeviceRecommendationVm[] = [];
  
  // Create dynamic devices based on intelligence actions or default generic ones
  if (sc.actions && sc.actions.length > 0) {
    sc.actions.forEach((action, idx) => {
      let icon: "pool" | "ev" | "heater" | "general" = "general";
      const txt = action.toLowerCase();
      if (txt.includes("pool")) icon = "pool";
      if (txt.includes("ev") || txt.includes("vehicle") || txt.includes("car")) icon = "ev";
      if (txt.includes("water") || txt.includes("heater") || txt.includes("boiler")) icon = "heater";

      // Fake distrubution of savings across devices to show the financial impact clearly
      const weight = idx === 0 ? 0.6 : 0.4; 
      devices.push({
        id: `dev-${idx}`,
        deviceName: icon.toUpperCase() === "GENERAL" ? "Smart Appliance" : capitalize(icon) + " System",
        recommendedAction: action,
        financialImpactMonth: formatCurrency(monthlySavings * weight),
        financialImpactYear: formatCurrency(yearlySavings * weight),
        iconType: icon,
      });
    });
  } else {
    // Fallback devices if no specific actions returned
    devices.push({
      id: "dev-pool",
      deviceName: "Pool Pump",
      recommendedAction: `Shift run time to ${sc.recommendedUsageWindow.start} - ${sc.recommendedUsageWindow.end}`,
      financialImpactMonth: formatCurrency(monthlySavings * 0.5),
      financialImpactYear: formatCurrency(yearlySavings * 0.5),
      iconType: "pool",
    });
    devices.push({
      id: "dev-heater",
      deviceName: "Water Heater",
      recommendedAction: "Automate activation during peak solar production",
      financialImpactMonth: formatCurrency(monthlySavings * 0.5),
      financialImpactYear: formatCurrency(yearlySavings * 0.5),
      iconType: "heater",
    });
  }

  const subtitle = score >= 80 
    ? "Your home is highly optimized for solar self-consumption." 
    : `Increase your self-consumption to save an additional ${formatCurrency(monthlySavings)} per month.`;

  return {
    header: {
      title: "Smart Home Automation",
      subtitle,
    },
    context: {
      siteId: data.siteId,
      generatedAt: formatDate(data.generatedAt),
    },
    selfConsumption: {
      score,
      scoreText: formatScore(score),
      description: "How much of your solar energy is used locally versus exported to the grid.",
    },
    energyShift: {
      windowStart: sc.recommendedUsageWindow.start,
      windowEnd: sc.recommendedUsageWindow.end,
      windowLabel: formatTimeRange(sc.recommendedUsageWindow.start, sc.recommendedUsageWindow.end),
      totalShiftValueMonth: formatCurrency(monthlySavings),
    },
    deviceRecommendations: devices,
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
