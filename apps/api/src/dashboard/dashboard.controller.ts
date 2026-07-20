import { Body, Controller, Get, Headers, Param, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DashboardDemoSeedService } from "./dashboard-demo-seed.service";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";
import { DemoSeedRequestDto } from "./dto/demo-seed-request.dto";
import { DashboardService } from "./dashboard.service";
import { DashboardQueryService } from "./dashboard-query.service";

@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardDemoSeedService: DashboardDemoSeedService,
    private readonly dashboardQueryService: DashboardQueryService
  ) {}

  /**
   * Site-backed aggregate: reads persisted site/system/tariff records, so
   * it requires an authenticated owner. The stateless POST /aggregate stays
   * public for the anonymous demo experience (client supplies all inputs).
   */
  @UseGuards(JwtAuthGuard)
  @Get("site/:siteId")
  async aggregateBySiteId(
    @Request() req: any,
    @Param("siteId") siteId: string,
    @Headers("x-correlation-id") correlationId?: string
  ) {
    const data = await this.dashboardQueryService.aggregateBySiteId(
      siteId,
      correlationId,
      req.user.sub
    );
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post("aggregate")
  async aggregate(
    @Body() payload: AggregateDashboardRequestDto,
    @Headers("x-correlation-id") correlationId?: string
  ) {
    const data = await this.dashboardService.aggregate(payload, correlationId);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post("demo/seed")
  async demoSeed(
    @Body() payload: DemoSeedRequestDto = {},
    @Headers("x-correlation-id") correlationId?: string
  ) {
    const data = await this.dashboardDemoSeedService.seed(correlationId, payload);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
