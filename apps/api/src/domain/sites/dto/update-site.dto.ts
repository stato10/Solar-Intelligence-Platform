import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}
