import { Injectable, NotFoundException } from "@nestjs/common";
import { SitesService } from "../domain/sites/sites.service";
import { SolarSystemsService } from "../domain/solar-systems/solar-systems.service";
import { TariffsService } from "../domain/tariffs/tariffs.service";
import { TelemetryService } from "../telemetry/telemetry.service";
import { DashboardService } from "./dashboard.service";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";

@Injectable()
export class DashboardQueryService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly sitesService: SitesService,
    private readonly solarSystemsService: SolarSystemsService,
    private readonly tariffsService: TariffsService,
    private readonly telemetryService: TelemetryService
  ) {}

  /**
   * Fetches the full site data from DB (Site, SolarSystem, Tariff)
   * constructs the aggregation payload, and returns the dashboard data.
   * Passes solar system metadata (tilt, azimuth, lastCleaningDate)
   * so the ingestion layer can use them for PVGIS accuracy.
   */
  async aggregateBySiteId(siteId: string, correlationId?: string, requesterId?: string) {
    // When a requester is provided (JWT-guarded route), site ownership is
    // enforced — a foreign siteId 404s without leaking existence.
    const site = await this.sitesService.findOne(siteId, requesterId);
    if (!site) {
      throw new NotFoundException(`Site ${siteId} not found`);
    }

    const { items: systems } = await this.solarSystemsService.findAll({ siteId });
    const system = systems.length > 0 ? systems[0] : null;
    
    if (!system) {
      throw new NotFoundException(`No solar system configured for site ${siteId}`);
    }

    const { items: tariffs } = await this.tariffsService.findAll({ siteId });
    const tariff = tariffs.length > 0 ? tariffs[0] : null;

    // Use canonical lat/lng from database Site record — NEVER from raw input
    const payload: AggregateDashboardRequestDto = {
      siteId: site.id,
      latitude: site.latitude,
      longitude: site.longitude,
      systemSizeKw: system.systemSizeKw,
      lossPercent: 14, // standard default
      tilt: system.tilt,
      azimuth: system.azimuth,
      timezone: site.timezone,
      generatedAt: new Date().toISOString()
    };

    if (tariff) {
      payload.tariff = {
        currency: tariff.currency,
        importRate: tariff.selfConsumptionRate,
        exportRate: tariff.exportRate
      };
    }

    // Telemetry summary and the modeled aggregate are independent — run
    // them in parallel. Telemetry failures must never break the dashboard.
    const [dashboardData, telemetry] = await Promise.all([
      this.dashboardService.aggregate(payload, correlationId),
      this.telemetryService.getSummary(siteId).catch(() => null)
    ]);
    return {
      ...dashboardData,
      siteName: site.siteName,
      ...(telemetry ? { telemetry } : {})
    };
  }
}
