import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { DeriveOpportunitiesService } from './derive-opportunities.service';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService, DeriveOpportunitiesService],
  exports: [MarketplaceService, DeriveOpportunitiesService],
})
export class MarketplaceModule {}
