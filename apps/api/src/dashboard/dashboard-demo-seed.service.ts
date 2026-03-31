import { Injectable } from "@nestjs/common";
import { SitesService } from "../domain/sites/sites.service";
import { SolarSystemsService } from "../domain/solar-systems/solar-systems.service";
import { TariffsService } from "../domain/tariffs/tariffs.service";
import { UsersService } from "../domain/users/users.service";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";
import { DashboardService } from "./dashboard.service";

@Injectable()
export class DashboardDemoSeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sitesService: SitesService,
    private readonly solarSystemsService: SolarSystemsService,
    private readonly tariffsService: TariffsService,
    private readonly dashboardService: DashboardService
  ) {}

  async seed(correlationId?: string) {
    const userEmail = "demo.owner@sip.local";
    const siteName = "Demo Solar Site";

    const existingUser = (
      await this.usersService.findAll({ page: 1, limit: 100, search: userEmail })
    ).items.find((item) => item.email === userEmail);
    const user =
      existingUser ??
      (await this.usersService.create({
        fullName: "Demo Owner",
        email: userEmail,
        role: "owner"
      }));

    const existingSite = (
      await this.sitesService.findAll({ page: 1, limit: 100, userId: user.id, search: siteName })
    ).items.find((item) => item.siteName === siteName && item.userId === user.id);
    const site =
      existingSite ??
      (await this.sitesService.create({
        userId: user.id,
        siteName,
        address: "Rothschild Blvd 1, Tel Aviv",
        latitude: 32.0853,
        longitude: 34.7818,
        timezone: "Asia/Jerusalem"
      }));

    const existingSystem = (
      await this.solarSystemsService.findAll({ page: 1, limit: 10, siteId: site.id })
    ).items.at(0);
    const system =
      existingSystem ??
      (await this.solarSystemsService.create({
        siteId: site.id,
        systemSizeKw: 8.5,
        tilt: 25,
        azimuth: 180,
        panelWattage: 540,
        panelEfficiency: 21.5,
        inverterType: "string",
        lastCleaningDate: "2026-03-01T00:00:00.000Z"
      }));

    const existingTariff = (
      await this.tariffsService.findAll({ page: 1, limit: 10, siteId: site.id })
    ).items.at(0);
    const tariff =
      existingTariff ??
      (await this.tariffsService.create({
        siteId: site.id,
        selfConsumptionRate: 0.62,
        exportRate: 0.28,
        currency: "ILS",
        effectiveFrom: "2026-01-01T00:00:00.000Z"
      }));

    const aggregatePayload: AggregateDashboardRequestDto = {
      siteId: site.id,
      latitude: site.latitude,
      longitude: site.longitude,
      systemSizeKw: system.systemSizeKw,
      lossPercent: 14,
      timezone: site.timezone,
      generatedAt: "2026-03-20T10:00:00Z",
      tariff: {
        currency: tariff.currency,
        importRate: tariff.selfConsumptionRate,
        exportRate: tariff.exportRate
      }
    };

    const dashboard = await this.dashboardService.aggregate(aggregatePayload, correlationId);
    return {
      user,
      site,
      system,
      tariff,
      aggregatePayload,
      dashboard
    };
  }
}
