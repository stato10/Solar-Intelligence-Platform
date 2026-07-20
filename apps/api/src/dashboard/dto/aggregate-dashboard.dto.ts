import { Type } from "class-transformer";
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from "class-validator";

class DashboardTariffDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  importRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exportRate?: number;
}

export class AggregateDashboardRequestDto {
  @IsString()
  siteId!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber()
  @Min(0)
  systemSizeKw!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lossPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  tilt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  azimuth?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsDateString()
  generatedAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardTariffDto)
  tariff?: DashboardTariffDto;
}
