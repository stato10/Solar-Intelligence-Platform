import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateTariffDto {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  selfConsumptionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exportRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
