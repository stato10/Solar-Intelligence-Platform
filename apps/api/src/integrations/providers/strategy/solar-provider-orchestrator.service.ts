import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ProviderRequestMeta } from "../common/provider.types";
import {
  SolarForecastInput,
  SolarForecastOutput,
  SolarProvider
} from "../contracts/solar-provider.interface";
import { ProviderSelectionService } from "./provider-selection.service";

@Injectable()
export class SolarProviderOrchestratorService implements SolarProvider {
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
        failures.push(`${key}:${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    throw new ServiceUnavailableException({
      message: "All solar providers failed",
      strategy: {
        chain
      },
      failures
    });
  }
}
