import { IsBoolean, IsInt, IsString, Max, Min } from "class-validator";

export class CreateDeviceProfileDto {
  @IsString()
  siteId!: string;

  @IsBoolean()
  hasBoiler!: boolean;

  @IsBoolean()
  hasEv!: boolean;

  @IsBoolean()
  hasDishwasher!: boolean;

  @IsBoolean()
  hasWashingMachine!: boolean;

  @IsBoolean()
  hasAc!: boolean;

  @IsInt()
  @Min(1)
  @Max(5)
  usageFlexibilityLevel!: number;
}
