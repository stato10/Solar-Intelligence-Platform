import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { paginateArray } from "../common/pagination";
import { SitesService } from "../sites/sites.service";
import { CreateDeviceProfileDto } from "./dto/create-device-profile.dto";
import { DevicesListQueryDto } from "./dto/devices-list-query.dto";
import { UpdateDeviceProfileDto } from "./dto/update-device-profile.dto";
import { DEVICES_REPOSITORY, DevicesRepository } from "./repositories/devices.repository";

@Injectable()
export class DevicesService {
  constructor(
    private readonly sitesService: SitesService,
    @Inject(DEVICES_REPOSITORY)
    private readonly devicesRepository: DevicesRepository
  ) {}

  async findAll(query: DevicesListQueryDto, requesterId?: string) {
    const profiles = await this.devicesRepository.findAll();
    let filtered = query.siteId
      ? profiles.filter((profile) => profile.siteId === query.siteId)
      : profiles;
    if (requesterId !== undefined) {
      if (query.siteId) {
        await this.sitesService.findOne(query.siteId, requesterId);
      } else {
        const ownedSiteIds = await this.sitesService.getOwnedSiteIds(requesterId);
        filtered = filtered.filter((profile) => ownedSiteIds.has(profile.siteId));
      }
    }
    return paginateArray(filtered, query);
  }

  async create(payload: CreateDeviceProfileDto, requesterId?: string) {
    await this.sitesService.findOne(payload.siteId, requesterId);
    const existing = await this.devicesRepository.findBySiteId(payload.siteId);
    if (existing) {
      throw new ConflictException(
        `Device profile already exists for site ${payload.siteId}`
      );
    }
    return this.devicesRepository.create(payload);
  }

  async findOne(id: string, requesterId?: string) {
    const profile = await this.devicesRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Device profile ${id} not found`);
    }
    if (requesterId !== undefined) {
      await this.sitesService.findOne(profile.siteId, requesterId);
    }
    return profile;
  }

  async update(id: string, payload: UpdateDeviceProfileDto, requesterId?: string) {
    await this.findOne(id, requesterId);
    if (payload.siteId !== undefined) {
      await this.sitesService.findOne(payload.siteId, requesterId);
      const existingForSite = await this.devicesRepository.findBySiteId(
        payload.siteId
      );
      if (existingForSite && existingForSite.id !== id) {
        throw new ConflictException(
          `Device profile already exists for site ${payload.siteId}`
        );
      }
    }
    return this.devicesRepository.update(id, payload);
  }
}
