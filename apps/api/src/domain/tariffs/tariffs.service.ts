import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { paginateArray } from "../common/pagination";
import { SitesService } from "../sites/sites.service";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { TariffsListQueryDto } from "./dto/tariffs-list-query.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { TARIFFS_REPOSITORY, TariffsRepository } from "./repositories/tariffs.repository";

@Injectable()
export class TariffsService {
  constructor(
    private readonly sitesService: SitesService,
    @Inject(TARIFFS_REPOSITORY)
    private readonly tariffsRepository: TariffsRepository
  ) {}

  async findAll(query: TariffsListQueryDto, requesterId?: string) {
    const tariffs = await this.tariffsRepository.findAll();
    let filtered = tariffs.filter((tariff) => {
      if (query.siteId && tariff.siteId !== query.siteId) {
        return false;
      }
      if (query.currency && tariff.currency !== query.currency) {
        return false;
      }
      return true;
    });
    if (requesterId !== undefined) {
      if (query.siteId) {
        await this.sitesService.findOne(query.siteId, requesterId);
      } else {
        const ownedSiteIds = await this.sitesService.getOwnedSiteIds(requesterId);
        filtered = filtered.filter((tariff) => ownedSiteIds.has(tariff.siteId));
      }
    }
    return paginateArray(filtered, query);
  }

  async create(payload: CreateTariffDto, requesterId?: string) {
    await this.sitesService.findOne(payload.siteId, requesterId);
    const existing = await this.tariffsRepository.findBySiteId(payload.siteId);
    if (existing) {
      throw new ConflictException(`Tariff already exists for site ${payload.siteId}`);
    }
    return this.tariffsRepository.create(payload);
  }

  async findOne(id: string, requesterId?: string) {
    const tariff = await this.tariffsRepository.findById(id);
    if (!tariff) {
      throw new NotFoundException(`Tariff ${id} not found`);
    }
    if (requesterId !== undefined) {
      await this.sitesService.findOne(tariff.siteId, requesterId);
    }
    return tariff;
  }

  async update(id: string, payload: UpdateTariffDto, requesterId?: string) {
    await this.findOne(id, requesterId);
    if (payload.siteId !== undefined) {
      await this.sitesService.findOne(payload.siteId, requesterId);
      const existingForSite = await this.tariffsRepository.findBySiteId(
        payload.siteId
      );
      if (existingForSite && existingForSite.id !== id) {
        throw new ConflictException(`Tariff already exists for site ${payload.siteId}`);
      }
    }
    return this.tariffsRepository.update(id, payload);
  }
}
