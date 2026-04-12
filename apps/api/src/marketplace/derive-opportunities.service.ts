import { Injectable } from '@nestjs/common';
import type { AiInsightContractOutputV3 } from '../ai/contracts/ai-insight-v3';

export type MarketplaceOpportunityType = 'service' | 'product' | 'automation';

export interface MarketplaceOpportunity {
  id: string;
  type: MarketplaceOpportunityType;
  topic: string;
  title: string;
  description: string;
  estimatedValueIls?: number;
  metadataJson: Record<string, unknown>;
}

@Injectable()
export class DeriveOpportunitiesService {
  
  deriveMarketplaceOpportunities(
    aggregate: any,
    aiInsights?: AiInsightContractOutputV3,
  ): MarketplaceOpportunity[] {
    const opportunities: MarketplaceOpportunity[] = [];

    // 1. Cleaning Opportunity
    if (aggregate.soiling.cleaningRecommended) {
      opportunities.push({
        id: `opp-cleaning-${aggregate.siteId}`,
        type: 'service',
        topic: 'cleaning',
        title: 'Request Panel Cleaning',
        description: 'Dust accumulation is causing significant production loss. A professional cleaning can restore optimal efficiency.',
        estimatedValueIls: aggregate.optimization.estimatedValue > 0 ? aggregate.optimization.estimatedValue : undefined,
        metadataJson: {
          triggerType: 'cleaning_recommendation',
          aggregateSource: 'DASHBOARD_AGGREGATED_V1',
          soilingLossPercent: aggregate.soiling.estimatedLossPercent,
        },
      });
    }

    // 2. Battery Opportunity from AI Insights
    if (aiInsights && aiInsights.energyDecisions) {
      const batteryDecision = aiInsights.energyDecisions.find(d => d.topic === 'battery-worthiness');
      if (batteryDecision && batteryDecision.recommendation === 'recommended') {
        opportunities.push({
          id: `opp-battery-${aggregate.siteId}`,
          type: 'product',
          topic: 'battery',
          title: 'Explore Battery Options',
          description: batteryDecision.message,
          estimatedValueIls: batteryDecision.estimatedBenefitRangeIlsMonthly?.min,
          metadataJson: {
            triggerType: 'battery_recommendation',
            aiInsightSource: 'v3',
          },
        });
      }

      const evDecision = aiInsights.energyDecisions.find(d => d.topic === 'ev-charging');
      if (evDecision && evDecision.recommendation === 'recommended') {
        opportunities.push({
          id: `opp-ev-${aggregate.siteId}`,
          type: 'product',
          topic: 'ev',
          title: 'Explore EV Charging Optimization',
          description: evDecision.message,
          estimatedValueIls: evDecision.estimatedBenefitRangeIlsMonthly?.min,
          metadataJson: {
            triggerType: 'ev_recommendation',
            aiInsightSource: 'v3',
          },
        });
      }
    }

    // 3. Automation Opportunity
    if (
      aggregate.selfConsumption?.actions &&
      aggregate.selfConsumption.actions.some((a: string) => a.toLowerCase().includes('boiler') || a.toLowerCase().includes('dishwasher'))
    ) {
      opportunities.push({
        id: `opp-automation-${aggregate.siteId}`,
        type: 'automation',
        topic: 'switcher',
        title: 'Optimize Smart Device Usage',
        description: 'Automating heavy appliance usage during peak production hours can significantly increase self-consumption savings.',
        estimatedValueIls: aggregate.selfConsumption.estimatedSavingsIls,
        metadataJson: {
          triggerType: 'automation_recommendation',
          recommendedWindow: aggregate.selfConsumption.recommendedUsageWindow,
        },
      });
    }

    return opportunities;
  }
}
