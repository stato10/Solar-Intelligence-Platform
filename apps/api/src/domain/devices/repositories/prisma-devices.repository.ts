import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateDeviceProfileDto } from "../dto/create-device-profile.dto";
import { UpdateDeviceProfileDto } from "../dto/update-device-profile.dto";
import { DeviceProfileEntity } from "../entities/device-profile.entity";
import { DevicesRepository } from "./devices.repository";

function toFlexibleLoadShiftingPossible(level: number): boolean {
  return level >= 3;
}

function toDeviceProfileEntity(model: {
  id: string;
  siteId: string;
  hasBoiler: boolean;
  hasEv: boolean;
  hasDishwasher: boolean;
  hasWashingMachine: boolean;
  hasAc: boolean;
  usageFlexibilityLevel: number;
  flexibleLoadShiftingPossible: boolean;
  createdAt: Date;
}): DeviceProfileEntity {
  return {
    id: model.id,
    siteId: model.siteId,
    hasBoiler: model.hasBoiler,
    hasEv: model.hasEv,
    hasDishwasher: model.hasDishwasher,
    hasWashingMachine: model.hasWashingMachine,
    hasAc: model.hasAc,
    usageFlexibilityLevel: model.usageFlexibilityLevel,
    createdAt: model.createdAt.toISOString()
  };
}

@Injectable()
export class PrismaDevicesRepository implements DevicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DeviceProfileEntity[]> {
    const profiles = await this.prisma.siteDeviceProfile.findMany({
      orderBy: { createdAt: "desc" }
    });
    return profiles.map(toDeviceProfileEntity);
  }

  async findById(id: string): Promise<DeviceProfileEntity | null> {
    const profile = await this.prisma.siteDeviceProfile.findUnique({
      where: { id }
    });
    return profile ? toDeviceProfileEntity(profile) : null;
  }

  async findBySiteId(siteId: string): Promise<DeviceProfileEntity | null> {
    const profile = await this.prisma.siteDeviceProfile.findUnique({
      where: { siteId }
    });
    return profile ? toDeviceProfileEntity(profile) : null;
  }

  async create(payload: CreateDeviceProfileDto): Promise<DeviceProfileEntity> {
    const profile = await this.prisma.siteDeviceProfile.create({
      data: {
        siteId: payload.siteId,
        hasBoiler: payload.hasBoiler,
        hasEv: payload.hasEv,
        hasDishwasher: payload.hasDishwasher,
        hasWashingMachine: payload.hasWashingMachine,
        hasAc: payload.hasAc,
        // Fields not currently represented by v1 DTOs remain deterministic defaults.
        hasBattery: false,
        usageFlexibilityLevel: payload.usageFlexibilityLevel,
        flexibleLoadShiftingPossible: toFlexibleLoadShiftingPossible(
          payload.usageFlexibilityLevel
        ),
        openToUpgrades: true,
        homeOccupancyProfile: "mixed"
      }
    });
    return toDeviceProfileEntity(profile);
  }

  async update(id: string, payload: UpdateDeviceProfileDto): Promise<DeviceProfileEntity> {
    const profile = await this.prisma.siteDeviceProfile.update({
      where: { id },
      data: {
        ...(payload.siteId !== undefined ? { siteId: payload.siteId } : {}),
        ...(payload.hasBoiler !== undefined ? { hasBoiler: payload.hasBoiler } : {}),
        ...(payload.hasEv !== undefined ? { hasEv: payload.hasEv } : {}),
        ...(payload.hasDishwasher !== undefined
          ? { hasDishwasher: payload.hasDishwasher }
          : {}),
        ...(payload.hasWashingMachine !== undefined
          ? { hasWashingMachine: payload.hasWashingMachine }
          : {}),
        ...(payload.hasAc !== undefined ? { hasAc: payload.hasAc } : {}),
        ...(payload.usageFlexibilityLevel !== undefined
          ? {
              usageFlexibilityLevel: payload.usageFlexibilityLevel,
              flexibleLoadShiftingPossible: toFlexibleLoadShiftingPossible(
                payload.usageFlexibilityLevel
              )
            }
          : {})
      }
    });
    return toDeviceProfileEntity(profile);
  }
}
