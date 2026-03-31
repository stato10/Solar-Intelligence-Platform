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

  async create(payload: CreateSiteDto) {
    await this.usersService.findOne(payload.userId);
    return this.sitesRepository.create(payload);
  }

  async findOne(id: string) {
    const site = await this.sitesRepository.findById(id);
    if (!site) {
      throw new NotFoundException(`Site ${id} not found`);
    }
    return site;
  }

  async update(id: string, payload: UpdateSiteDto) {
    await this.findOne(id);
    if (payload.userId !== undefined) {
      await this.usersService.findOne(payload.userId);
    }
    return this.sitesRepository.update(id, payload);
  }
}
