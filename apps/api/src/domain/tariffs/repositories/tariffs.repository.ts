import { CreateTariffDto } from "../dto/create-tariff.dto";
import { UpdateTariffDto } from "../dto/update-tariff.dto";
import { TariffEntity } from "../entities/tariff.entity";

export const TARIFFS_REPOSITORY = Symbol("TARIFFS_REPOSITORY");

export interface TariffsRepository {
  findAll(): Promise<TariffEntity[]>;
  findById(id: string): Promise<TariffEntity | null>;
  findBySiteId(siteId: string): Promise<TariffEntity | null>;
  create(payload: CreateTariffDto): Promise<TariffEntity>;
  update(id: string, payload: UpdateTariffDto): Promise<TariffEntity>;
}
