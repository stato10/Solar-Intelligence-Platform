import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateSiteDto } from "../dto/create-site.dto";
import { UpdateSiteDto } from "../dto/update-site.dto";
import { SiteEntity } from "../entities/site.entity";
import { SitesRepository } from "./sites.repository";

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

@Injectable()
export class PrismaSitesRepository implements SitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SiteEntity[]> {
    const sites = await this.prisma.site.findMany({
      orderBy: { createdAt: "desc" }
    });
    return sites.map(toSiteEntity);
  }

  async findById(id: string): Promise<SiteEntity | null> {
    const site = await this.prisma.site.findUnique({
      where: { id }
    });
    return site ? toSiteEntity(site) : null;
  }

  async create(payload: CreateSiteDto): Promise<SiteEntity> {
    const site = await this.prisma.site.create({
      data: payload
    });
    return toSiteEntity(site);
  }

  async update(id: string, payload: UpdateSiteDto): Promise<SiteEntity> {
    const site = await this.prisma.site.update({
      where: { id },
      data: {
        ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
        ...(payload.siteName !== undefined ? { siteName: payload.siteName } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
        ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
        ...(payload.timezone !== undefined ? { timezone: payload.timezone } : {})
      }
    });
    return toSiteEntity(site);
  }
}
