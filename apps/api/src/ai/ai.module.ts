import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiInsightsFallbackService } from "./fallback/ai-insights-fallback.service";

@Module({
  controllers: [AiController],
  providers: [AiService, AiInsightsFallbackService]
})
export class AiModule {}
