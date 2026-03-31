import { CreateSolarSystemDto } from "../dto/create-solar-system.dto";
import { UpdateSolarSystemDto } from "../dto/update-solar-system.dto";
import { SolarSystemEntity } from "../entities/solar-system.entity";

export const SOLAR_SYSTEMS_REPOSITORY = Symbol("SOLAR_SYSTEMS_REPOSITORY");

export interface SolarSystemsRepository {
  findAll(): Promise<SolarSystemEntity[]>;
  findById(id: string): Promise<SolarSystemEntity | null>;
  findBySiteId(siteId: string): Promise<SolarSystemEntity | null>;
  create(payload: CreateSolarSystemDto): Promise<SolarSystemEntity>;
  update(id: string, payload: UpdateSolarSystemDto): Promise<SolarSystemEntity>;
}
