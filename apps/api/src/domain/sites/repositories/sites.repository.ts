import { CreateSiteDto } from "../dto/create-site.dto";
import { UpdateSiteDto } from "../dto/update-site.dto";
import { SiteEntity } from "../entities/site.entity";

export const SITES_REPOSITORY = Symbol("SITES_REPOSITORY");

export interface SitesRepository {
  findAll(): Promise<SiteEntity[]>;
  findById(id: string): Promise<SiteEntity | null>;
  create(payload: CreateSiteDto & { userId: string }): Promise<SiteEntity>;
  update(id: string, payload: UpdateSiteDto): Promise<SiteEntity>;
}
