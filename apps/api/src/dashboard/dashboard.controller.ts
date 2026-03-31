import { Body, Controller, Headers, Post } from "@nestjs/common";
import { DashboardDemoSeedService } from "./dashboard-demo-seed.service";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";
import { DemoSeedRequestDto } from "./dto/demo-seed-request.dto";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardDemoSeedService: DashboardDemoSeedService
  ) {}

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
