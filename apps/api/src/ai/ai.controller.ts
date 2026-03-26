import { Body, Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Post("insights")
  async generateInsights(
    @Body() payload: unknown,
    @Headers("x-correlation-id") correlationId?: string
  ) {
    const data = await this.aiService.generateInsights(payload);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1",
        correlationId: correlationId ?? null
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("insights/v3")
  async generateInsightsV3(
    @Body() payload: unknown,
    @Headers("x-correlation-id") correlationId?: string
  ) {
    const data = await this.aiService.generateInsightsV3(payload);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v3",
        correlationId: correlationId ?? null
      }
    };
  }
}
