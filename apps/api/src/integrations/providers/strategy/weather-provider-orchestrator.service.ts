import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ProviderRequestMeta } from "../common/provider.types";
import {
  WeatherProvider,
  WeatherSnapshotInput,
  WeatherSnapshotOutput
} from "../contracts/weather-provider.interface";
import { ProviderSelectionService } from "./provider-selection.service";

@Injectable()
export class WeatherProviderOrchestratorService implements WeatherProvider {
  private readonly logger = new Logger(WeatherProviderOrchestratorService.name);

  constructor(private readonly providerSelectionService: ProviderSelectionService) {}

  async getHealth(meta?: ProviderRequestMeta) {
    const chain = this.providerSelectionService.getWeatherProviderChain();
    const statuses = await Promise.all(
      chain.map((key) =>
        this.providerSelectionService.resolveWeatherProvider(key).getHealth(meta)
      )
    );
    return {
      ...statuses[0],
      details: {
        ...(statuses[0].details ?? {}),
        strategy: {
          primary: chain[0],
          fallback: chain[1],
          providers: statuses
        }
      }
    };
  }

  async getSnapshot(
    input: WeatherSnapshotInput,
    meta?: ProviderRequestMeta
  ): Promise<WeatherSnapshotOutput> {
    const chain = this.providerSelectionService.getWeatherProviderChain();
    const failures: string[] = [];

    for (const key of chain) {
      const provider = this.providerSelectionService.resolveWeatherProvider(key);
      try {
        return await provider.getSnapshot(input, meta);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        failures.push(`${key}:${message}`);
        this.logger.warn(
          JSON.stringify({
            event: "provider.weather.failure",
            provider: key,
            requestId: meta?.requestId,
            message
          })
        );
      }
    }

    this.logger.error(
      JSON.stringify({
        event: "provider.weather.exhausted",
        requestId: meta?.requestId,
        chain,
        failures
      })
    );

    throw new ServiceUnavailableException({
      message: "All weather providers failed",
      strategy: {
        chain
      },
      failures
    });
  }
}
