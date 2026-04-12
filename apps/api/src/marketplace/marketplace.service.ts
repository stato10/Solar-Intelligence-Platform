import { Injectable } from '@nestjs/common';
import { DeriveOpportunitiesService } from './derive-opportunities.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly deriveService: DeriveOpportunitiesService) {}

  // In a real scenario, this service would fetch the latest aggregate and AI insights
  // for the site from the database or cache. For now, we expose the derivation logic directly
  // or accept the payload to keep it decoupled from the dashboard service.
  
  // Here we just expose the derivation function
  getDeriveService() {
    return this.deriveService;
  }
}
