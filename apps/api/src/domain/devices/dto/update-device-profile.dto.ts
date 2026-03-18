import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateDeviceProfileDto {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsBoolean()
  hasBoiler?: boolean;

  @IsOptional()
  @IsBoolean()
  hasEv?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDishwasher?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWashingMachine?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAc?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  usageFlexibilityLevel?: number;
}
