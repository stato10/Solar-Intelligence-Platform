import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { CreateDeviceProfileDto } from "./dto/create-device-profile.dto";
import { UpdateDeviceProfileDto } from "./dto/update-device-profile.dto";
import { DeviceProfileEntity } from "./entities/device-profile.entity";

@Injectable()
export class DevicesService {
  private readonly deviceProfiles: DeviceProfileEntity[] = [];

  findAll() {
    return this.deviceProfiles;
  }

  create(payload: CreateDeviceProfileDto) {
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
    if (payload.siteId !== undefined) profile.siteId = payload.siteId;
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
