import { Type } from "class-transformer";
import {
  IsBoolean,
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

export class EngineBenchmarkInputDto {
  @IsNumber()
  @Min(0)
  expected_production_kwh!: number;

  @IsNumber()
  @Min(0)
  actual_production_kwh!: number;

  @IsNumber()
  @Min(0)
  expected_export_kwh!: number;

  @IsNumber()
  @Min(0)
  actual_export_kwh!: number;
}

export class EnginePeakWindowInputDto {
  @IsString()
  start!: string;

  @IsString()
  end!: string;
}

export class EngineDeviceItemInputDto {
  @IsString()
  name!: string;

  @IsBoolean()
  shiftable!: boolean;
}

export class EngineDeviceProfileInputDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actions?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EngineDeviceItemInputDto)
  devices?: EngineDeviceItemInputDto[];

  @IsOptional()
  @IsNumber()
  shiftable_load_ratio!: number;
}

export class EngineSelfConsumptionTariffsInputDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  import_rate_ils?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  export_rate_ils?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  buy_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sell_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  import_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  export_rate?: number;
}

export class EngineSelfConsumptionInputDto {
  @IsNumber()
  @Min(0)
  expected_production_kwh!: number;

  @ValidateNested()
  @Type(() => EnginePeakWindowInputDto)
  peak_window!: EnginePeakWindowInputDto;

  @ValidateNested()
  @Type(() => EngineDeviceProfileInputDto)
  device_profile!: EngineDeviceProfileInputDto;

  @ValidateNested()
  @Type(() => EngineSelfConsumptionTariffsInputDto)
  tariffs!: EngineSelfConsumptionTariffsInputDto;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => EngineBenchmarkInputDto)
  benchmark?: EngineBenchmarkInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EngineSelfConsumptionInputDto)
  self_consumption?: EngineSelfConsumptionInputDto;
}

export interface CanonicalRecommendation {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "moderate" | "high";
  priority: number;
  estimatedValue: number;
  validFrom: string;
  validUntil: string;
  sourceModule: string;
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
    recommendations: CanonicalRecommendation[];
    estimatedValue?: number;
  };
  financial: {
    dailyEstimatedSavings: number;
    monthlyEstimatedSavings: number;
    yearlyOptimizationPotential: number;
  };
  benchmark: {
    expectedProductionKwh: number;
    actualProductionKwh: number;
    expectedExportKwh: number;
    actualExportKwh: number;
    productionDeviationPercent: number;
    exportDeviationPercent: number;
    performanceStatus: "good" | "underperforming" | "overexporting";
    insight: string;
  };
  selfConsumption: {
    recommendedUsageWindow: {
      start: string;
      end: string;
    };
    selfConsumptionScore: number;
    estimatedSavingsIls: number;
    actions: string[];
  };
}

interface RawRecommendation {
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
}

export interface RawEngineCalculateV1Response {
  siteId: string;
  generatedAt: string;
  source: "ENGINE_V1";
  forecast: Record<string, unknown>;
  soiling: Record<string, unknown>;
  heat: Record<string, unknown>;
  risks: {
    alerts: unknown[];
  };
  optimization: {
    opportunityScore: number;
    recommendations: RawRecommendation[] | string[];
    estimatedValue?: number;
  };
  financial: Record<string, unknown>;
  benchmark: {
    expected_production_kwh: number;
    actual_production_kwh: number;
    expected_export_kwh: number;
    actual_export_kwh: number;
    production_deviation_percent: number;
    export_deviation_percent: number;
    performance_status: "good" | "underperforming" | "overexporting";
    insight: string;
  };
  self_consumption: {
    recommended_usage_window: {
      start: string;
      end: string;
    };
    self_consumption_score: number;
    estimated_savings_ils: number;
    actions: string[];
  };
}

export function isEngineCalculateV1Response(
  value: unknown
): value is RawEngineCalculateV1Response {
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
    isObject(payload.benchmark) &&
    isObject(payload.self_consumption) &&
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

function isRecommendationArray(value: unknown): value is RawRecommendation[] | string[] {
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
