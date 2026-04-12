// Marketplace Opportunity Types
export type MarketplaceOpportunityType = "service" | "product" | "automation";

export interface MarketplaceOpportunity {
  id: string;
  type: MarketplaceOpportunityType;
  topic: string;
  title: string;
  description: string;
  estimatedValueIls?: number;
  metadataJson: Record<string, unknown>;
}

// Lead Intent Types
export type LeadSourceType =
  | "cleaning_recommendation"
  | "battery_recommendation"
  | "ev_recommendation"
  | "automation_recommendation";

export interface CreateLeadIntentPayload {
  siteId: string;
  sourceType: LeadSourceType;
  sourceReference?: string;
  title: string;
  message?: string;
  estimatedValue?: number;
  metadataJson?: Record<string, unknown>;
}

export interface LeadIntent {
  id: string;
  siteId: string;
  userId: string;
  sourceType: LeadSourceType;
  sourceReference: string | null;
  title: string;
  message: string | null;
  status: string;
  estimatedValue: number | null;
  metadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
