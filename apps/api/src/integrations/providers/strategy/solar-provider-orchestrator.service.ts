import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ProviderRequestMeta } from "../common/provider.types";
import {
  SolarForecastInput,
  SolarForecastOutput,
  SolarProvider
} from "../contracts/solar-provider.interface";
import { ProviderSelectionService } from "./provider-selection.service";

@Injectable()
export class SolarProviderOrchestratorService implements SolarProvider {
  private readonly logger = new Logger(SolarProviderOrchestratorService.name);

  constructor(private readonly providerSelectionService: ProviderSelectionService) {}

  async getHealth(meta?: ProviderRequestMeta) {
    const chain = this.providerSelectionService.getSolarProviderChain();
    const statuses = await Promise.all(
      chain.map((key) => this.providerSelectionService.resolveSolarProvider(key).getHealth(meta))
    );
    return {
      ...statuses[0],
      details: {
        ...(statuses[0].details ?? {}),
        strategy: {
          chain,
          providers: statuses
        }
      }
    };
  }

  async getForecast(
    input: SolarForecastInput,
    meta?: ProviderRequestMeta
  ): Promise<SolarForecastOutput> {
    const chain = this.providerSelectionService.getSolarProviderChain();
    const failures: string[] = [];

    for (const key of chain) {
      const provider = this.providerSelectionService.resolveSolarProvider(key);
      try {
        return await provider.getForecast(input, meta);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        failures.push(`${key}:${message}`);
        this.logger.warn(
          JSON.stringify({
            event: "provider.solar.failure",
            provider: key,
            requestId: meta?.requestId,
            message
          })
        );
      }
    }

    this.logger.error(
      JSON.stringify({
        event: "provider.solar.exhausted",
        requestId: meta?.requestId,
        chain,
        failures
      })
    );

    throw new ServiceUnavailableException({
      message: "All solar providers failed",
      strategy: {
        chain
      },
      failures
    });
  }
}
