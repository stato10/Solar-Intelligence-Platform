import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateSolarSystemDto } from "../dto/create-solar-system.dto";
import { UpdateSolarSystemDto } from "../dto/update-solar-system.dto";
import { SolarSystemEntity } from "../entities/solar-system.entity";
import { SolarSystemsRepository } from "./solar-systems.repository";

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
    inverterType: model.inverterType ?? undefined,
    lastCleaningDate: model.lastCleaningDate.toISOString(),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString()
  };
}

@Injectable()
export class PrismaSolarSystemsRepository implements SolarSystemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SolarSystemEntity[]> {
    const systems = await this.prisma.solarSystem.findMany({
      orderBy: { createdAt: "desc" }
    });
    return systems.map(toSolarSystemEntity);
  }

  async findById(id: string): Promise<SolarSystemEntity | null> {
    const system = await this.prisma.solarSystem.findUnique({
      where: { id }
    });
    return system ? toSolarSystemEntity(system) : null;
  }

  async findBySiteId(siteId: string): Promise<SolarSystemEntity | null> {
    const system = await this.prisma.solarSystem.findFirst({
      where: { siteId }
    });
    return system ? toSolarSystemEntity(system) : null;
  }

  async create(payload: CreateSolarSystemDto): Promise<SolarSystemEntity> {
    const system = await this.prisma.solarSystem.create({
      data: {
        ...payload,
        lastCleaningDate: new Date(payload.lastCleaningDate)
      }
    });
    return toSolarSystemEntity(system);
  }

  async update(id: string, payload: UpdateSolarSystemDto): Promise<SolarSystemEntity> {
    const system = await this.prisma.solarSystem.update({
      where: { id },
      data: {
        ...(payload.siteId !== undefined ? { siteId: payload.siteId } : {}),
        ...(payload.systemSizeKw !== undefined ? { systemSizeKw: payload.systemSizeKw } : {}),
        ...(payload.tilt !== undefined ? { tilt: payload.tilt } : {}),
        ...(payload.azimuth !== undefined ? { azimuth: payload.azimuth } : {}),
        ...(payload.panelWattage !== undefined ? { panelWattage: payload.panelWattage } : {}),
        ...(payload.panelEfficiency !== undefined
          ? { panelEfficiency: payload.panelEfficiency }
          : {}),
        ...(payload.inverterType !== undefined ? { inverterType: payload.inverterType } : {}),
        ...(payload.lastCleaningDate !== undefined
          ? { lastCleaningDate: new Date(payload.lastCleaningDate) }
          : {})
      }
    });
    return toSolarSystemEntity(system);
  }
}
