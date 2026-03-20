import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";

export class EngineWeatherInputDto {
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cloudCover?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  windSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precipitation?: number;
}

export class EngineSolarInputDto {
  @IsNumber()
  @Min(0)
  expectedDailyKwh!: number;

  @IsNumber()
  @Min(0)
  expectedWeeklyKwh!: number;

  @IsNumber()
  @Min(0)
  expectedMonthlyKwh!: number;
}

export class EngineTariffInputDto {
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

export class EngineCalculateV1RequestDto {
  @IsString()
  siteId!: string;

  @IsDateString()
  generatedAt!: string;

  @ValidateNested()
  @Type(() => EngineWeatherInputDto)
  weather!: EngineWeatherInputDto;

  @ValidateNested()
  @Type(() => EngineSolarInputDto)
  solar!: EngineSolarInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EngineTariffInputDto)
  tariff?: EngineTariffInputDto;
}

export interface EngineCalculateV1Response {
  siteId: string;
  generatedAt: string;
  source: "ENGINE_V1";
  forecast: {
    expectedDailyKwh: number;
    expectedWeeklyKwh: number;
    expectedMonthlyKwh: number;
  };
  soiling: {
    score: number;
    estimatedLossPercent: number;
    cleaningRecommended: boolean;
    recommendedCleaningDate?: string | null;
    explanation?: string;
  };
  heat: {
    score: number;
    estimatedLossPercent: number;
    peakHeatWindowStart?: string;
    peakHeatWindowEnd?: string;
  };
  risks: {
    alerts: Array<{
      riskType: string;
      severity: "low" | "moderate" | "high";
      message: string;
      expectedStart: string;
      expectedEnd: string;
    }>;
  };
  optimization: {
    opportunityScore: number;
    recommendations: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      severity: "low" | "moderate" | "high";
      priority: number;
      estimated_value: number;
      valid_from: string;
      valid_until: string;
      source_module: string;
    }>;
    estimatedValue?: number;
  };
  financial: {
    dailyEstimatedSavings: number;
    monthlyEstimatedSavings: number;
    yearlyOptimizationPotential: number;
  };
}

export function isEngineCalculateV1Response(
  value: unknown
): value is EngineCalculateV1Response {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.siteId === "string" &&
    typeof payload.generatedAt === "string" &&
    payload.source === "ENGINE_V1" &&
    isObject(payload.forecast) &&
    isObject(payload.soiling) &&
    isObject(payload.heat) &&
    isObject(payload.risks) &&
    isObject(payload.optimization) &&
    isObject(payload.financial) &&
    isArray((payload.risks as Record<string, unknown>).alerts) &&
    isRecommendationArray((payload.optimization as Record<string, unknown>).recommendations)
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isRecommendationArray(value: unknown): value is EngineCalculateV1Response["optimization"]["recommendations"] {
  if (!Array.isArray(value)) {
    return false;
  }
  if (value.every((item) => typeof item === "string")) {
    return true;
  }
  return value.every((item) => {
    if (!isObject(item)) {
      return false;
    }
    return (
      typeof item.id === "string" &&
      typeof item.type === "string" &&
      typeof item.title === "string" &&
      typeof item.message === "string" &&
      (item.severity === "low" || item.severity === "moderate" || item.severity === "high") &&
      typeof item.priority === "number" &&
      typeof item.estimated_value === "number" &&
      typeof item.valid_from === "string" &&
      typeof item.valid_until === "string" &&
      typeof item.source_module === "string"
    );
  });
}
