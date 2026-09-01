import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TelemetryService } from "./telemetry.service";

/**
 * Periodic vendor polling. Every 15 minutes each connected site pulls
 * its newest interval readings (96 requests/day per site — under the
 * SolarEdge 300/day limit). Failures flip the connection to `error`
 * inside TelemetryService but never crash the loop.
 */
@Injectable()
export class TelemetrySyncScheduler {
  private readonly logger = new Logger(TelemetrySyncScheduler.name);
  private running = false;

  constructor(private readonly telemetryService: TelemetryService) {}

  @Cron("0 */15 * * * *")
  async syncAllConnectedSites(): Promise<void> {
    if (this.running) return; // skip overlapping runs
    this.running = true;
    try {
      const siteIds = await this.telemetryService.findSyncableSiteIds();
      if (siteIds.length === 0) return;
      this.logger.log(`Telemetry sync tick: ${siteIds.length} site(s)`);
      for (const siteId of siteIds) {
        try {
          const { inserted } = await this.telemetryService.syncSite(siteId);
          if (inserted > 0) {
            this.logger.log(`Site ${siteId}: +${inserted} readings`);
          }
        } catch (error) {
          this.logger.warn(
            `Site ${siteId} sync failed: ${error instanceof Error ? error.message : "unknown"}`
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
