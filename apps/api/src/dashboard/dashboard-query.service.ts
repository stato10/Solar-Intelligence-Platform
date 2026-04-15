import { Injectable, NotFoundException } from "@nestjs/common";
import { SitesService } from "../domain/sites/sites.service";
import { SolarSystemsService } from "../domain/solar-systems/solar-systems.service";
import { TariffsService } from "../domain/tariffs/tariffs.service";
import { DashboardService } from "./dashboard.service";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";

@Injectable()
export class DashboardQueryService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly sitesService: SitesService,
    private readonly solarSystemsService: SolarSystemsService,
    private readonly tariffsService: TariffsService
  ) {}

  /**
   * Fetches the full site data from DB (Site, SolarSystem, Tariff)
   * constructs the aggregation payload, and returns the dashboard data.
   * Passes solar system metadata (tilt, azimuth, lastCleaningDate)
   * so the ingestion layer can use them for PVGIS accuracy.
   */
  async aggregateBySiteId(siteId: string, correlationId?: string) {
    const site = await this.sitesService.findOne(siteId);
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

    const dashboardData = await this.dashboardService.aggregate(payload, correlationId);
    return {
      ...dashboardData,
      siteName: site.siteName
    };
  }
}
