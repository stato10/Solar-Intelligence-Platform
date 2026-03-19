import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { SitesService } from "../sites/sites.service";
import { CreateDeviceProfileDto } from "./dto/create-device-profile.dto";
import { UpdateDeviceProfileDto } from "./dto/update-device-profile.dto";
import { DeviceProfileEntity } from "./entities/device-profile.entity";

@Injectable()
export class DevicesService {
  private readonly deviceProfiles: DeviceProfileEntity[] = [];
  constructor(private readonly sitesService: SitesService) {}

  findAll() {
    return this.deviceProfiles;
  }

  create(payload: CreateDeviceProfileDto) {
    this.sitesService.findOne(payload.siteId);
    if (this.deviceProfiles.some((item) => item.siteId === payload.siteId)) {
      throw new ConflictException(
        `Device profile already exists for site ${payload.siteId}`
      );
    }
    const profile: DeviceProfileEntity = {
      id: randomUUID(),
      siteId: payload.siteId,
      hasBoiler: payload.hasBoiler,
      hasEv: payload.hasEv,
      hasDishwasher: payload.hasDishwasher,
      hasWashingMachine: payload.hasWashingMachine,
      hasAc: payload.hasAc,
      usageFlexibilityLevel: payload.usageFlexibilityLevel,
      createdAt: new Date().toISOString()
    };
    this.deviceProfiles.push(profile);
    return profile;
  }

  findOne(id: string) {
    const profile = this.deviceProfiles.find((item) => item.id === id);
    if (!profile) {
      throw new NotFoundException(`Device profile ${id} not found`);
    }
    return profile;
  }

  update(id: string, payload: UpdateDeviceProfileDto) {
    const profile = this.findOne(id);
    if (payload.siteId !== undefined) {
      this.sitesService.findOne(payload.siteId);
      const existingForSite = this.deviceProfiles.find(
        (item) => item.siteId === payload.siteId && item.id !== id
      );
      if (existingForSite) {
        throw new ConflictException(
          `Device profile already exists for site ${payload.siteId}`
        );
      }
      profile.siteId = payload.siteId;
    }
    if (payload.hasBoiler !== undefined) profile.hasBoiler = payload.hasBoiler;
    if (payload.hasEv !== undefined) profile.hasEv = payload.hasEv;
    if (payload.hasDishwasher !== undefined)
      profile.hasDishwasher = payload.hasDishwasher;
    if (payload.hasWashingMachine !== undefined)
      profile.hasWashingMachine = payload.hasWashingMachine;
    if (payload.hasAc !== undefined) profile.hasAc = payload.hasAc;
    if (payload.usageFlexibilityLevel !== undefined) {
      profile.usageFlexibilityLevel = payload.usageFlexibilityLevel;
    }
    return profile;
  }
}
