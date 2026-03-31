import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { paginateArray } from "../common/pagination";
import { SitesService } from "../sites/sites.service";
import { CreateSolarSystemDto } from "./dto/create-solar-system.dto";
import { SolarSystemsListQueryDto } from "./dto/solar-systems-list-query.dto";
import { UpdateSolarSystemDto } from "./dto/update-solar-system.dto";
import {
  SOLAR_SYSTEMS_REPOSITORY,
  SolarSystemsRepository
} from "./repositories/solar-systems.repository";

@Injectable()
export class SolarSystemsService {
  constructor(
    private readonly sitesService: SitesService,
    @Inject(SOLAR_SYSTEMS_REPOSITORY)
    private readonly systemsRepository: SolarSystemsRepository
  ) {}

  async findAll(query: SolarSystemsListQueryDto) {
    const systems = await this.systemsRepository.findAll();
    const filtered = query.siteId
      ? systems.filter((system) => system.siteId === query.siteId)
      : systems;
    return paginateArray(filtered, query);
  }

  async create(payload: CreateSolarSystemDto) {
    await this.sitesService.findOne(payload.siteId);
    const existing = await this.systemsRepository.findBySiteId(payload.siteId);
    if (existing) {
      throw new ConflictException(
        `Solar system already exists for site ${payload.siteId}`
      );
    }
    return this.systemsRepository.create(payload);
  }

  async findOne(id: string) {
    const system = await this.systemsRepository.findById(id);
    if (!system) {
      throw new NotFoundException(`Solar system ${id} not found`);
    }
    return system;
  }

  async update(id: string, payload: UpdateSolarSystemDto) {
    await this.findOne(id);
    if (payload.siteId !== undefined) {
      await this.sitesService.findOne(payload.siteId);
      const existingForSite = await this.systemsRepository.findBySiteId(
        payload.siteId
      );
      if (existingForSite && existingForSite.id !== id) {
        throw new ConflictException(
          `Solar system already exists for site ${payload.siteId}`
        );
      }
    }
    return this.systemsRepository.update(id, payload);
  }
}
