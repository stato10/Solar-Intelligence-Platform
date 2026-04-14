import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LeadsService, CreateLeadIntentDto } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('intents')
  async createIntent(@Request() req: any, @Body() dto: CreateLeadIntentDto) {
    const userId = req.user.sub;
    const intent = await this.leadsService.createIntent(userId, dto);
    return {
      success: true,
      data: intent,
    };
  }

  @Get('intents/:siteId')
  async getIntents(@Request() req: any, @Param('siteId') siteId: string) {
    const userId = req.user.sub;
    const intents = await this.leadsService.getIntentsForSite(userId, siteId);
    return {
      success: true,
      data: intents,
    };
  }
}
