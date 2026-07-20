import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from "class-validator";

export class CreateSolarSystemDto {
  @IsString()
  siteId!: string;

  @IsNumber()
  @Min(0.1)
  systemSizeKw!: number;

  @IsNumber()
  @Min(0)
  @Max(90)
  tilt!: number;

  @IsNumber()
  @Min(0)
  @Max(360)
  azimuth!: number;

  @IsNumber()
  @Min(1)
  panelWattage!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  panelEfficiency!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  panelCount?: number;

  @IsOptional()
  @IsString()
  panelType?: string;

  @IsOptional()
  @IsString()
  inverterType?: string;

  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @IsDateString()
  lastCleaningDate!: string;
}
