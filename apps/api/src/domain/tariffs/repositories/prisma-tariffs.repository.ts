import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateTariffDto } from "../dto/create-tariff.dto";
import { UpdateTariffDto } from "../dto/update-tariff.dto";
import { TariffEntity } from "../entities/tariff.entity";
import { TariffsRepository } from "./tariffs.repository";

function toTariffEntity(model: {
  id: string;
  siteId: string;
  selfConsumptionRate: number;
  exportRate: number;
  currency: string;
  effectiveFrom: Date;
}): TariffEntity {
  return {
    id: model.id,
    siteId: model.siteId,
    selfConsumptionRate: model.selfConsumptionRate,
    exportRate: model.exportRate,
    currency: model.currency,
    effectiveFrom: model.effectiveFrom.toISOString()
  };
}

@Injectable()
export class PrismaTariffsRepository implements TariffsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TariffEntity[]> {
    const tariffs = await this.prisma.tariff.findMany({
      orderBy: { createdAt: "desc" }
    });
    return tariffs.map(toTariffEntity);
  }

  async findById(id: string): Promise<TariffEntity | null> {
    const tariff = await this.prisma.tariff.findUnique({
      where: { id }
    });
    return tariff ? toTariffEntity(tariff) : null;
  }

  async findBySiteId(siteId: string): Promise<TariffEntity | null> {
    const tariff = await this.prisma.tariff.findFirst({
      where: { siteId }
    });
    return tariff ? toTariffEntity(tariff) : null;
  }

  async create(payload: CreateTariffDto): Promise<TariffEntity> {
    const tariff = await this.prisma.tariff.create({
      data: {
        ...payload,
        effectiveFrom: new Date(payload.effectiveFrom),
        effectiveUntil: null,
        isActive: true
      }
    });
    return toTariffEntity(tariff);
  }

  async update(id: string, payload: UpdateTariffDto): Promise<TariffEntity> {
    const tariff = await this.prisma.tariff.update({
      where: { id },
      data: {
        ...(payload.siteId !== undefined ? { siteId: payload.siteId } : {}),
        ...(payload.selfConsumptionRate !== undefined
          ? { selfConsumptionRate: payload.selfConsumptionRate }
          : {}),
        ...(payload.exportRate !== undefined ? { exportRate: payload.exportRate } : {}),
        ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
        ...(payload.effectiveFrom !== undefined
          ? { effectiveFrom: new Date(payload.effectiveFrom) }
          : {})
      }
    });
    return toTariffEntity(tariff);
  }
}
