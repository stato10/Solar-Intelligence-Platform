import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { mapAggregateToAiInsightInput } from "./aggregate-to-ai-input.mapper";
import { AiInsightsFallbackService } from "./fallback/ai-insights-fallback.service";
import {
  AiInsightContractOutput,
  CanonicalAggregateAiSource,
  isCanonicalAggregateAiSource,
  isValidAiInsightOutput
} from "./contracts/ai-insight-v2";
import { mapRequestToAiInsightInputV3 } from "./aggregate-to-ai-input-v3.mapper";
import {
  AiInsightContractOutputV3,
  CanonicalAiInsightRequestV3,
  isCanonicalAiInsightRequestV3,
  isValidAiInsightOutputV3
} from "./contracts/ai-insight-v3";

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

  async generateInsightsV3(payload: unknown): Promise<AiInsightContractOutputV3> {
    if (!isCanonicalAiInsightRequestV3(payload)) {
      throw new BadRequestException(
        "Invalid canonical payload for ai-insight-v3 generation."
      );
    }

    const requestPayload: CanonicalAiInsightRequestV3 = payload;
    const input = mapRequestToAiInsightInputV3(requestPayload);

    let result: AiInsightContractOutputV3;

    if (!process.env.OPENAI_API_KEY) {
      this.logger.log("ai.insights.fallback.v3: OPENAI_API_KEY missing, using deterministic fallback.");
      result = this.fallbackService.generateV3(input);
    } else {
      this.logger.log("ai.insights.openai.v3: Calling OpenAI provider.");
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
                content: `You are an expert solar energy advisor. Your output MUST strictly match the ai-insight-v3 contract.
Output ONLY valid JSON. No extra fields. Only use the provided sourceRefs.
Do not hallucinate values. Do not calculate math.

Your energyDecisions MUST separate advice between:
1. "Available now" (requiresPurchase: false) - behavioral changes without buying anything.
2. "Upgrade-dependent" (requiresPurchase: true) - smart upgrades worth considering.

Make sure you answer these 5 core questions explicitly within the energy decisions:
1. Is it better to consume or sell? (topic: self-consumption-vs-export)
2. Is a battery worth it? (topic: battery-worthiness)
3. Will mid-day EV charging pay off? (topic: ev-charging)
4. Will a Smart Boiler/Switcher pay off? (topic: boiler-automation)
5. What can I improve without buying anything? (topic: load-shifting/behavior)

Always classify decisions into 3 layers: Current State, Improve without purchase, Improve with purchase.
Respond with the exact AiInsightContractOutputV3 JSON structure.`
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
        this.logger.error("ai.insights.openai_invalid_output.v3", (error as Error).message);
        this.logger.log("ai.insights.fallback.v3: Falling back to deterministic generator due to OpenAI failure.");
        result = this.fallbackService.generateV3(input);
      }
    }

    if (!isValidAiInsightOutputV3(result)) {
      this.logger.error(
        JSON.stringify({
          event: "ai.insights.output_validation_failed.v3",
          siteId: requestPayload.aggregate.siteId,
          generatedAt: requestPayload.aggregate.generatedAt,
          message: "AI insight output did not satisfy ai-insight-v3 contract."
        })
      );
      throw new InternalServerErrorException(
        "AI insight output did not meet v3 contract requirements."
      );
    }

    return result;
  }
}
