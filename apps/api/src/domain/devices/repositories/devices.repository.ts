import { CreateDeviceProfileDto } from "../dto/create-device-profile.dto";
import { UpdateDeviceProfileDto } from "../dto/update-device-profile.dto";
import { DeviceProfileEntity } from "../entities/device-profile.entity";

export const DEVICES_REPOSITORY = Symbol("DEVICES_REPOSITORY");

export interface DevicesRepository {
  findAll(): Promise<DeviceProfileEntity[]>;
  findById(id: string): Promise<DeviceProfileEntity | null>;
  findBySiteId(siteId: string): Promise<DeviceProfileEntity | null>;
  create(payload: CreateDeviceProfileDto): Promise<DeviceProfileEntity>;
  update(id: string, payload: UpdateDeviceProfileDto): Promise<DeviceProfileEntity>;
}
