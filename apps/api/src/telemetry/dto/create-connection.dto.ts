import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import type { InverterVendorId } from "../connectors/inverter-connector.interface";

export class CreateConnectionDto {
  @IsUUID()
  siteId!: string;

  @IsIn(["solaredge", "enphase", "fronius", "sma", "mock"])
  vendor!: InverterVendorId;

  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  /** Vendor-side plant/site id (required by SolarEdge). */
  @IsOptional()
  @IsString()
  externalSystemId?: string;
}
