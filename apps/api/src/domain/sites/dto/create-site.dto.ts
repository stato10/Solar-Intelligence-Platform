import { IsLatitude, IsLongitude, IsString, MinLength } from "class-validator";

export class CreateSiteDto {
  @IsString()
  userId!: string;

  @IsString()
  @MinLength(2)
  siteName!: string;

  @IsString()
  @MinLength(3)
  address!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsString()
  timezone!: string;
}
