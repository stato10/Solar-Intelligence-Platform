import { Body, Controller, Post } from "@nestjs/common";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post("aggregate")
  async aggregate(@Body() payload: AggregateDashboardRequestDto) {
    const data = await this.dashboardService.aggregate(payload);
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
