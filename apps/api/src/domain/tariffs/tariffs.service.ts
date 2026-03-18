import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { TariffEntity } from "./entities/tariff.entity";

@Injectable()
export class TariffsService {
  private readonly tariffs: TariffEntity[] = [];

  findAll() {
    return this.tariffs;
  }

  create(payload: CreateTariffDto) {
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
    if (payload.siteId !== undefined) tariff.siteId = payload.siteId;
    if (payload.selfConsumptionRate !== undefined) {
      tariff.selfConsumptionRate = payload.selfConsumptionRate;
    }
    if (payload.exportRate !== undefined) tariff.exportRate = payload.exportRate;
    if (payload.currency !== undefined) tariff.currency = payload.currency;
    if (payload.effectiveFrom !== undefined) tariff.effectiveFrom = payload.effectiveFrom;
    return tariff;
  }
}
