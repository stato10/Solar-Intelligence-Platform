import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { mapAggregateToAiInsightInput } from "./aggregate-to-ai-input.mapper";
import { AiInsightsFallbackService } from "./fallback/ai-insights-fallback.service";
import {
  AiInsightContractOutput,
  CanonicalAggregateAiSource,
  isCanonicalAggregateAiSource,
  isValidAiInsightOutput
} from "./contracts/ai-insight-v2";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly fallbackService: AiInsightsFallbackService) {}

  async generateInsights(payload: unknown): Promise<AiInsightContractOutput> {
    if (!isCanonicalAggregateAiSource(payload)) {
      throw new BadRequestException(
        "Invalid canonical aggregate payload for ai-insight-v2 generation."
      );
    }

    const aggregatePayload: CanonicalAggregateAiSource = payload;
    const input = mapAggregateToAiInsightInput(aggregatePayload);

    let result: AiInsightContractOutput;

    if (!process.env.OPENAI_API_KEY) {
      this.logger.log("ai.insights.fallback: OPENAI_API_KEY missing, using deterministic fallback.");
      result = this.fallbackService.generate(input);
    } else {
      this.logger.log("ai.insights.openai: Calling OpenAI provider.");
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert solar energy advisor. Your output MUST strictly match the ai-insight-v2 contract.
Output ONLY valid JSON. No extra fields. Only use the provided sourceRefs.
Do not hallucinate values. Do not calculate math.
Respond with the exact AiInsightContractOutput JSON structure.`
              },
              {
                role: "user",
                content: JSON.stringify(input)
              }
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error("OpenAI returned no content");
        }
        
        result = JSON.parse(content);
      } catch (error) {
        this.logger.error("ai.insights.openai_invalid_output", (error as Error).message);
        this.logger.log("ai.insights.fallback: Falling back to deterministic generator due to OpenAI failure.");
        result = this.fallbackService.generate(input);
      }
    }

    // Change B (task 7.8) — output guardrail enforcement.
    // Validate before returning so any future insight generator (OpenAI or
    // third-party) cannot propagate a malformed output to the API consumer.
    if (!isValidAiInsightOutput(result)) {
      this.logger.error(
        JSON.stringify({
          event: "ai.insights.output_validation_failed",
          siteId: aggregatePayload.siteId,
          generatedAt: aggregatePayload.generatedAt,
          message: "AI insight output did not satisfy ai-insight-v2 contract."
        })
      );
      throw new InternalServerErrorException(
        "AI insight output did not meet contract requirements."
      );
    }

    return result;
  }
}
