import { Body, Controller, Headers, Post } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("insights")
  generateInsights(
    @Body() payload: unknown,
    @Headers("x-correlation-id") correlationId?: string
  ) {
    const data = this.aiService.generateInsights(payload);
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
}
