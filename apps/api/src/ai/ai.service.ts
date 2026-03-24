import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { mapAggregateToAiInsightInput } from "./aggregate-to-ai-input.mapper";
import { AiInsightsFallbackService } from "./fallback/ai-insights-fallback.service";
import {
  AiInsightContractOutput,
  CanonicalAggregateAiSource,
  isCanonicalAggregateAiSource
} from "./contracts/ai-insight-v2";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly fallbackService: AiInsightsFallbackService) {}

  generateInsights(payload: unknown): AiInsightContractOutput {
    if (!isCanonicalAggregateAiSource(payload)) {
      throw new BadRequestException(
        "Invalid canonical aggregate payload for ai-insight-v2 generation."
      );
    }

    const aggregatePayload: CanonicalAggregateAiSource = payload;
    const input = mapAggregateToAiInsightInput(aggregatePayload);

    if (!process.env.OPENAI_API_KEY) {
      this.logger.log("ai.insights.fallback: OPENAI_API_KEY missing, using deterministic fallback.");
      return this.fallbackService.generate(input);
    }

    // OpenAI provider wiring is intentionally deferred in 7.2.
    this.logger.warn(
      "ai.insights.fallback: OPENAI_API_KEY detected but OpenAI provider wiring is deferred; using fallback."
    );
    return this.fallbackService.generate(input);
  }
}
