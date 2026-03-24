import { SmartProductCatalogItem } from "./contracts/ai-insight-v2";

export const SMART_DEVICE_CATALOG: SmartProductCatalogItem[] = [
  {
    id: "switcher-boiler-control",
    name: "Switcher Boiler Control",
    category: "boiler-control",
    useCase: "Shift boiler heating toward solar-rich hours to improve self-consumption.",
    suitableWhen: [
      {
        field: "benchmark.exportDeviationPercent",
        operator: ">",
        value: 12
      },
      {
        field: "selfConsumption.selfConsumptionScore",
        operator: "<",
        value: 78
      },
      {
        field: "optimization.opportunityScore",
        operator: ">",
        value: 45
      }
    ],
    expectedBenefitType: "self-consumption-improvement",
    requiresPurchase: true
  },
  {
    id: "smart-ev-charger-managed",
    name: "Smart EV Charger",
    category: "ev-charging",
    useCase: "Schedule EV charging in generation-rich windows to reduce export and grid import.",
    suitableWhen: [
      {
        field: "benchmark.actualExportKwh",
        operator: ">",
        value: 2
      },
      {
        field: "optimization.opportunityScore",
        operator: ">",
        value: 55
      },
      {
        field: "benchmark.exportDeviationPercent",
        operator: ">",
        value: 10
      }
    ],
    expectedBenefitType: "export-to-self-consumption-shift",
    requiresPurchase: true
  },
  {
    id: "smart-ac-scheduler-peak-shift",
    name: "Smart AC Scheduler",
    category: "hvac-control",
    useCase: "Pre-cool in high-generation periods and reduce evening import under heat stress.",
    suitableWhen: [
      {
        field: "heat.estimatedLossPercent",
        operator: ">",
        value: 5
      },
      {
        field: "selfConsumption.selfConsumptionScore",
        operator: "<",
        value: 80
      },
      {
        field: "benchmark.exportDeviationPercent",
        operator: ">",
        value: 8
      }
    ],
    expectedBenefitType: "load-shifting",
    requiresPurchase: true
  },
  {
    id: "smart-relay-load-shift",
    name: "Smart Relay Load Shifter",
    category: "load-shifting",
    useCase: "Automate shiftable appliance loads into high-value generation windows.",
    suitableWhen: [
      {
        field: "selfConsumption.selfConsumptionScore",
        operator: "<",
        value: 76
      },
      {
        field: "optimization.opportunityScore",
        operator: ">",
        value: 40
      },
      {
        field: "benchmark.actualExportKwh",
        operator: ">",
        value: 1
      }
    ],
    expectedBenefitType: "load-shifting",
    requiresPurchase: true
  }
];
