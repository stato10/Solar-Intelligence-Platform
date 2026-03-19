import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { paginateArray } from "../common/pagination";
import { SitesService } from "../sites/sites.service";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { TariffsListQueryDto } from "./dto/tariffs-list-query.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { TariffEntity } from "./entities/tariff.entity";

@Injectable()
export class TariffsService {
  private readonly tariffs: TariffEntity[] = [];
  constructor(private readonly sitesService: SitesService) {}

  findAll(query: TariffsListQueryDto) {
    const filtered = this.tariffs.filter((tariff) => {
      if (query.siteId && tariff.siteId !== query.siteId) {
        return false;
      }
      if (query.currency && tariff.currency !== query.currency) {
        return false;
      }
      return true;
    });
    return paginateArray(filtered, query);
  }

  create(payload: CreateTariffDto) {
    this.sitesService.findOne(payload.siteId);
    if (this.tariffs.some((item) => item.siteId === payload.siteId)) {
      throw new ConflictException(`Tariff already exists for site ${payload.siteId}`);
    }
    const tariff: TariffEntity = {
      id: randomUUID(),
      siteId: payload.siteId,
      selfConsumptionRate: payload.selfConsumptionRate,
      exportRate: payload.exportRate,
      currency: payload.currency,
      effectiveFrom: payload.effectiveFrom
    };
    this.tariffs.push(tariff);
    return tariff;
  }

  findOne(id: string) {
    const tariff = this.tariffs.find((item) => item.id === id);
    if (!tariff) {
      throw new NotFoundException(`Tariff ${id} not found`);
    }
    return tariff;
  }

  update(id: string, payload: UpdateTariffDto) {
    const tariff = this.findOne(id);
    if (payload.siteId !== undefined) {
      this.sitesService.findOne(payload.siteId);
      const existingForSite = this.tariffs.find(
        (item) => item.siteId === payload.siteId && item.id !== id
      );
      if (existingForSite) {
        throw new ConflictException(`Tariff already exists for site ${payload.siteId}`);
      }
      tariff.siteId = payload.siteId;
    }
    if (payload.selfConsumptionRate !== undefined) {
      tariff.selfConsumptionRate = payload.selfConsumptionRate;
    }
    if (payload.exportRate !== undefined) tariff.exportRate = payload.exportRate;
    if (payload.currency !== undefined) tariff.currency = payload.currency;
    if (payload.effectiveFrom !== undefined) tariff.effectiveFrom = payload.effectiveFrom;
    return tariff;
  }
}
