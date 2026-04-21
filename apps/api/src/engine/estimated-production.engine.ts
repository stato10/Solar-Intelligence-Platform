import { Injectable } from "@nestjs/common";

export interface EnvironmentalData {
  expectedKwh: number;
  ghi: number;
  ghiClearSky: number;
  cloudCoverPercent: number;
  maxTemperature: number;
  pm10: number;
  daysWithoutRain: number;
}

export interface EstimatedProductionResult {
  estimatedKwh: number;
  factors: {
    radiation: number;
    cloud: number;
    temperature: number;
    dust: number;
    soiling: number;
  };
}

@Injectable()
export class EstimatedProductionEngine {
  /**
   * Calculates pseudo-real production using physics and environmental degradation models.
   */
  estimate(data: EnvironmentalData): EstimatedProductionResult {
    // 1. Radiation Factor (Real vs Clear Sky)
    // If ghiClearSky is 0 or missing, fallback to max reasonable GHI or 1.
    const validClearSky = data.ghiClearSky > 0 ? data.ghiClearSky : Math.max(data.ghi, 1000);
    let radiationFactor = data.ghi / validClearSky;
    if (radiationFactor > 1 || !Number.isFinite(radiationFactor)) {
      radiationFactor = 1;
    }

    // 2. Cloud Factor (Exponential decay)
    const cloudFactor = Math.exp(-0.04 * data.cloudCoverPercent);

    // 3. Temperature Factor (0.4% loss per degree over 25C)
    const tempDelta = Math.max(0, data.maxTemperature - 25);
    const tempFactor = 1 - (tempDelta * 0.004);

    // 4. Dust Factor (PM10 particle blockage)
    const dustFactor = 1 - (data.pm10 / 1000);

    // 5. Soiling Factor (Accumulation over dry days)
    const soilingLoss = Math.min(0.2, data.daysWithoutRain * 0.002);
    const soilingFactor = 1 - soilingLoss;

    // Final mathematical aggregation
    const estimatedKwh = Math.max(
      0, 
      data.expectedKwh * radiationFactor * cloudFactor * tempFactor * dustFactor * soilingFactor
    );

    return {
      estimatedKwh,
      factors: {
        radiation: radiationFactor,
        cloud: cloudFactor,
        temperature: tempFactor,
        dust: dustFactor,
        soiling: soilingFactor
      }
    };
  }
}
