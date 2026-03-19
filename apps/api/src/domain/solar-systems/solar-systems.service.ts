import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { SitesService } from "../sites/sites.service";
import { CreateSolarSystemDto } from "./dto/create-solar-system.dto";
import { UpdateSolarSystemDto } from "./dto/update-solar-system.dto";
import { SolarSystemEntity } from "./entities/solar-system.entity";

@Injectable()
export class SolarSystemsService {
  private readonly systems: SolarSystemEntity[] = [];
  constructor(private readonly sitesService: SitesService) {}

  findAll() {
    return this.systems;
  }

  create(payload: CreateSolarSystemDto) {
    this.sitesService.findOne(payload.siteId);
    if (this.systems.some((item) => item.siteId === payload.siteId)) {
      throw new ConflictException(
        `Solar system already exists for site ${payload.siteId}`
      );
    }
    const now = new Date().toISOString();
    const system: SolarSystemEntity = {
      id: randomUUID(),
      siteId: payload.siteId,
      systemSizeKw: payload.systemSizeKw,
      tilt: payload.tilt,
      azimuth: payload.azimuth,
      panelWattage: payload.panelWattage,
      panelEfficiency: payload.panelEfficiency,
      inverterType: payload.inverterType,
      lastCleaningDate: payload.lastCleaningDate,
      createdAt: now,
      updatedAt: now
    };
    this.systems.push(system);
    return system;
  }

  findOne(id: string) {
    const system = this.systems.find((item) => item.id === id);
    if (!system) {
      throw new NotFoundException(`Solar system ${id} not found`);
    }
    return system;
  }

  update(id: string, payload: UpdateSolarSystemDto) {
    const system = this.findOne(id);
    if (payload.siteId !== undefined) {
      this.sitesService.findOne(payload.siteId);
      const existingForSite = this.systems.find(
        (item) => item.siteId === payload.siteId && item.id !== id
      );
      if (existingForSite) {
        throw new ConflictException(
          `Solar system already exists for site ${payload.siteId}`
        );
      }
      system.siteId = payload.siteId;
    }
    if (payload.systemSizeKw !== undefined) system.systemSizeKw = payload.systemSizeKw;
    if (payload.tilt !== undefined) system.tilt = payload.tilt;
    if (payload.azimuth !== undefined) system.azimuth = payload.azimuth;
    if (payload.panelWattage !== undefined) system.panelWattage = payload.panelWattage;
    if (payload.panelEfficiency !== undefined)
      system.panelEfficiency = payload.panelEfficiency;
    if (payload.inverterType !== undefined) system.inverterType = payload.inverterType;
    if (payload.lastCleaningDate !== undefined)
      system.lastCleaningDate = payload.lastCleaningDate;
    system.updatedAt = new Date().toISOString();
    return system;
  }
}
