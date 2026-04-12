import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AiInsightContractOutputV3 } from '../ai/contracts/ai-insight-v3';

@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}
  
  @Post('opportunities/derive')
  deriveOpportunities(
    @Body() payload: { aggregate: any; aiInsights?: AiInsightContractOutputV3 }
  ) {
    const opps = this.marketplaceService.getDeriveService().deriveMarketplaceOpportunities(
      payload.aggregate,
      payload.aiInsights
    );
    return {
      success: true,
      data: opps,
    };
  }
}
