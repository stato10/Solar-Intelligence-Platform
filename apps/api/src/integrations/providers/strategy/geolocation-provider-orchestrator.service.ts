import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ProviderRequestMeta } from "../common/provider.types";
import {
  GeolocationForwardInput,
  GeolocationForwardOutput,
  GeolocationProvider,
  GeolocationReverseInput,
  GeolocationReverseOutput
} from "../contracts/geolocation-provider.interface";
import { ProviderSelectionService } from "./provider-selection.service";

@Injectable()
export class GeolocationProviderOrchestratorService implements GeolocationProvider {
  constructor(private readonly providerSelectionService: ProviderSelectionService) {}

  async getHealth(meta?: ProviderRequestMeta) {
    const chain = this.providerSelectionService.getGeolocationProviderChain();
    const statuses = await Promise.all(
      chain.map((key) =>
        this.providerSelectionService.resolveGeolocationProvider(key).getHealth(meta)
      )
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

  async forward(
    input: GeolocationForwardInput,
    meta?: ProviderRequestMeta
  ): Promise<GeolocationForwardOutput> {
    const chain = this.providerSelectionService.getGeolocationProviderChain();
    const failures: string[] = [];
    for (const key of chain) {
      const provider = this.providerSelectionService.resolveGeolocationProvider(key);
      try {
        return await provider.forward(input, meta);
      } catch (error) {
        failures.push(`${key}:${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    throw new ServiceUnavailableException({
      message: "All geolocation providers failed",
      strategy: {
        chain
      },
      failures
    });
  }

  async reverse(
    input: GeolocationReverseInput,
    meta?: ProviderRequestMeta
  ): Promise<GeolocationReverseOutput> {
    const chain = this.providerSelectionService.getGeolocationProviderChain();
    const failures: string[] = [];
    for (const key of chain) {
      const provider = this.providerSelectionService.resolveGeolocationProvider(key);
      try {
        return await provider.reverse(input, meta);
      } catch (error) {
        failures.push(`${key}:${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    throw new ServiceUnavailableException({
      message: "All geolocation providers failed",
      strategy: {
        chain
      },
      failures
    });
  }
}
