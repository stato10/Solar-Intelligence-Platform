import { IsDateString, IsNumber, IsString, Min } from "class-validator";

export class CreateTariffDto {
  @IsString()
  siteId!: string;

  @IsNumber()
  @Min(0)
  selfConsumptionRate!: number;

  @IsNumber()
  @Min(0)
  exportRate!: number;

  @IsString()
  currency!: string;

  @IsDateString()
  effectiveFrom!: string;
}
