import { IsLatitude, IsLongitude, IsOptional, IsString, MinLength } from "class-validator";

export class CreateSiteDto {
  /**
   * Legacy field — ignored by the API. Ownership is always derived from
   * the authenticated JWT (`req.user.sub`); kept optional so older
   * clients that still send it do not fail validation.
   */
  @IsOptional()
  @IsString()
  userId?: string;

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
