import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { paginateArray } from "../common/pagination";
import { UsersService } from "../users/users.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { SitesListQueryDto } from "./dto/sites-list-query.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { SITES_REPOSITORY, SitesRepository } from "./repositories/sites.repository";

@Injectable()
export class SitesService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(SITES_REPOSITORY)
    private readonly sitesRepository: SitesRepository
  ) {}

  async findAll(query: SitesListQueryDto) {
    const sites = await this.sitesRepository.findAll();
    const search = query.search?.trim().toLowerCase();
    const filtered = sites.filter((site) => {
      if (query.userId && site.userId !== query.userId) {
        return false;
      }
      if (!search) {
        return true;
      }
      return (
        site.siteName.toLowerCase().includes(search) ||
        site.address.toLowerCase().includes(search)
      );
    });
    return paginateArray(filtered, query);
  }

  async create(payload: CreateSiteDto & { userId: string }) {
    await this.usersService.findOne(payload.userId);
    return this.sitesRepository.create(payload);
  }

  /**
   * Loads a site by id. When `requesterId` is provided, the site must
   * belong to that user — otherwise a 404 is thrown so resource
   * existence is never leaked across tenants.
   */
  async findOne(id: string, requesterId?: string) {
    const site = await this.sitesRepository.findById(id);
    if (!site || (requesterId !== undefined && site.userId !== requesterId)) {
      throw new NotFoundException(`Site ${id} not found`);
    }
    return site;
  }

  /** IDs of every site owned by the given user (ownership filter for child resources). */
  async getOwnedSiteIds(userId: string): Promise<Set<string>> {
    const sites = await this.sitesRepository.findAll();
    return new Set(sites.filter((site) => site.userId === userId).map((site) => site.id));
  }

  async update(id: string, payload: UpdateSiteDto, requesterId?: string) {
    await this.findOne(id, requesterId);
    return this.sitesRepository.update(id, payload);
  }
}
