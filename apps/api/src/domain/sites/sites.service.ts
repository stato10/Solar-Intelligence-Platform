import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { paginateArray } from "../common/pagination";
import { UsersService } from "../users/users.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { SitesListQueryDto } from "./dto/sites-list-query.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { SiteEntity } from "./entities/site.entity";

@Injectable()
export class SitesService {
  private readonly sites: SiteEntity[] = [];
  constructor(private readonly usersService: UsersService) {}

  findAll(query: SitesListQueryDto) {
    const search = query.search?.trim().toLowerCase();
    const filtered = this.sites.filter((site) => {
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

  create(payload: CreateSiteDto) {
    this.usersService.findOne(payload.userId);
    const site: SiteEntity = {
      id: randomUUID(),
      userId: payload.userId,
      siteName: payload.siteName,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timezone: payload.timezone,
      createdAt: new Date().toISOString()
    };
    this.sites.push(site);
    return site;
  }

  findOne(id: string) {
    const site = this.sites.find((item) => item.id === id);
    if (!site) {
      throw new NotFoundException(`Site ${id} not found`);
    }
    return site;
  }

  update(id: string, payload: UpdateSiteDto) {
    const site = this.findOne(id);
    if (payload.userId !== undefined) {
      this.usersService.findOne(payload.userId);
      site.userId = payload.userId;
    }
    if (payload.siteName !== undefined) site.siteName = payload.siteName;
    if (payload.address !== undefined) site.address = payload.address;
    if (payload.latitude !== undefined) site.latitude = payload.latitude;
    if (payload.longitude !== undefined) site.longitude = payload.longitude;
    if (payload.timezone !== undefined) site.timezone = payload.timezone;
    return site;
  }
}
