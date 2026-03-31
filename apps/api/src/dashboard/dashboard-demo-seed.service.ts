import { BadRequestException, Injectable } from "@nestjs/common";
import { hashSync } from "bcryptjs";
import { SiteEntity } from "../domain/sites/entities/site.entity";
import { SolarSystemEntity } from "../domain/solar-systems/entities/solar-system.entity";
import { TariffEntity } from "../domain/tariffs/entities/tariff.entity";
import { UserEntity } from "../domain/users/entities/user.entity";
import { PrismaService } from "../prisma/prisma.service";
import { AggregateDashboardRequestDto } from "./dto/aggregate-dashboard.dto";
import { DemoSeedFailureStep, DemoSeedRequestDto } from "./dto/demo-seed-request.dto";
import { DashboardService } from "./dashboard.service";

const DEMO_SEED_PLACEHOLDER_PASSWORD_HASH = hashSync("demo_seed_placeholder_password", 10);

@Injectable()
export class DashboardDemoSeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService
  ) {}

  async seed(correlationId?: string, options: DemoSeedRequestDto = {}) {
    if (options.failAfterStep && process.env.NODE_ENV === "production") {
      throw new BadRequestException("failAfterStep is not allowed in production");
    }

    const seedKey = options.seedKey?.trim();
    const userEmail = seedKey ? `demo.owner+${seedKey}@sip.local` : "demo.owner@sip.local";
    const siteName = seedKey ? `Demo Solar Site ${seedKey}` : "Demo Solar Site";

    const seeded = await this.prisma.$transaction(async (tx) => {
      const userRecord =
        (await tx.user.findUnique({ where: { email: userEmail } })) ??
        (await tx.user.create({
          data: {
            fullName: "Demo Owner",
            email: userEmail,
            role: "owner",
            passwordHash: DEMO_SEED_PLACEHOLDER_PASSWORD_HASH
          }
        }));
      this.throwIfInjectedFailure("user", options.failAfterStep);

      const siteRecord =
        (await tx.site.findFirst({
          where: {
            userId: userRecord.id,
            siteName
          }
        })) ??
        (await tx.site.create({
          data: {
            userId: userRecord.id,
            siteName,
            address: "Rothschild Blvd 1, Tel Aviv",
            latitude: 32.0853,
            longitude: 34.7818,
            timezone: "Asia/Jerusalem"
          }
        }));
      this.throwIfInjectedFailure("site", options.failAfterStep);

      const systemRecord =
        (await tx.solarSystem.findFirst({
          where: { siteId: siteRecord.id },
          orderBy: { createdAt: "desc" }
        })) ??
        (await tx.solarSystem.create({
          data: {
            siteId: siteRecord.id,
            systemSizeKw: 8.5,
            tilt: 25,
            azimuth: 180,
            panelWattage: 540,
            panelEfficiency: 21.5,
            inverterType: "string",
            lastCleaningDate: new Date("2026-03-01T00:00:00.000Z")
          }
        }));
      this.throwIfInjectedFailure("solar-system", options.failAfterStep);

      const tariffRecord =
        (await tx.tariff.findFirst({
          where: { siteId: siteRecord.id },
          orderBy: { createdAt: "desc" }
        })) ??
        (await tx.tariff.create({
          data: {
            siteId: siteRecord.id,
            selfConsumptionRate: 0.62,
            exportRate: 0.28,
            currency: "ILS",
            effectiveFrom: new Date("2026-01-01T00:00:00.000Z")
          }
        }));
      this.throwIfInjectedFailure("tariff", options.failAfterStep);

      return {
        user: toUserEntity(userRecord),
        site: toSiteEntity(siteRecord),
        system: toSolarSystemEntity(systemRecord),
        tariff: toTariffEntity(tariffRecord)
      };
    });

    const aggregatePayload: AggregateDashboardRequestDto = {
      siteId: seeded.site.id,
      latitude: seeded.site.latitude,
      longitude: seeded.site.longitude,
      systemSizeKw: seeded.system.systemSizeKw,
      lossPercent: 14,
      timezone: seeded.site.timezone,
      generatedAt: "2026-03-20T10:00:00Z",
      tariff: {
        currency: seeded.tariff.currency,
        importRate: seeded.tariff.selfConsumptionRate,
        exportRate: seeded.tariff.exportRate
      }
    };

    const dashboard = await this.dashboardService.aggregate(aggregatePayload, correlationId);
    return {
      user: seeded.user,
      site: seeded.site,
      system: seeded.system,
      tariff: seeded.tariff,
      aggregatePayload,
      dashboard
    };
  }

  private throwIfInjectedFailure(step: DemoSeedFailureStep, failAfterStep?: DemoSeedFailureStep) {
    if (step === failAfterStep) {
      throw new Error(`Injected seed failure after "${step}" step.`);
    }
  }
}

function toUserEntity(model: {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "admin";
  createdAt: Date;
  updatedAt: Date;
}): UserEntity {
  return {
    id: model.id,
    fullName: model.fullName,
    email: model.email,
    role: model.role,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString()
  };
}

function toSiteEntity(model: {
  id: string;
  userId: string;
  siteName: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: Date;
}): SiteEntity {
  return {
    id: model.id,
    userId: model.userId,
    siteName: model.siteName,
    address: model.address,
    latitude: model.latitude,
    longitude: model.longitude,
    timezone: model.timezone,
    createdAt: model.createdAt.toISOString()
  };
}

function toSolarSystemEntity(model: {
  id: string;
  siteId: string;
  systemSizeKw: number;
  tilt: number;
  azimuth: number;
  panelWattage: number;
  panelEfficiency: number;
  inverterType: string | null;
  lastCleaningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): SolarSystemEntity {
  return {
    id: model.id,
    siteId: model.siteId,
    systemSizeKw: model.systemSizeKw,
    tilt: model.tilt,
    azimuth: model.azimuth,
    panelWattage: model.panelWattage,
    panelEfficiency: model.panelEfficiency,
    ...(model.inverterType ? { inverterType: model.inverterType } : {}),
    lastCleaningDate: model.lastCleaningDate.toISOString(),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString()
  };
}

function toTariffEntity(model: {
  id: string;
  siteId: string;
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
  effectiveFrom: Date;
}): TariffEntity {
  return {
    id: model.id,
    siteId: model.siteId,
    selfConsumptionRate: model.selfConsumptionRate,
    exportRate: model.exportRate,
    currency: model.currency,
    effectiveFrom: model.effectiveFrom.toISOString()
  };
}
