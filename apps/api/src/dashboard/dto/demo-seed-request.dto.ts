import { IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export const DEMO_SEED_FAILURE_STEPS = ["user", "site", "solar-system", "tariff"] as const;
export type DemoSeedFailureStep = (typeof DEMO_SEED_FAILURE_STEPS)[number];

export class DemoSeedRequestDto {
  @IsOptional()
  @IsIn(DEMO_SEED_FAILURE_STEPS)
  failAfterStep?: DemoSeedFailureStep;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  seedKey?: string;
}
