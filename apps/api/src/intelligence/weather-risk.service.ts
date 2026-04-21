import { Injectable } from "@nestjs/common";
import { IntelligenceAlert, IntelligenceInput } from "./intelligence.types";

const WEATHER_RISK_PATTERN = /storm|snow|hail|dust|frost|uv|rain|wind|heat|overheat|cold|soil/i;

const TITLE_MAP: Record<string, string> = {
  overheat: "Panel overheating risk",
  snow_coverage: "Snow coverage expected",
  hail_storm: "Storm / hail warning",
  dust_soiling: "Dust accumulation risk",
  frost: "Frost risk",
  uv_degradation: "Prolonged high UV",
  natural_cleaning: "Natural cleaning expected",
  optimal_production: "Optimal production window"
};

const HINT_MAP: Record<string, string> = {
  overheat: "Consider shifting heavy loads to cooler hours",
  snow_coverage: "Clear snow from panels after the storm",
  hail_storm: "Verify insurance and inspect panels after the storm",
  dust_soiling: "Schedule cleaning to restore output",
  frost: "Monitor for ice buildup on panels",
  uv_degradation: "Long-term degradation risk — inspect panels",
  natural_cleaning: "Rain should reset soiling — no action needed",
  optimal_production: "Run heavy loads to capture peak output"
};

@Injectable()
export class WeatherRiskService {
  derive(data: IntelligenceInput): IntelligenceAlert[] {
    const alerts: IntelligenceAlert[] = [];

    data.risks.alerts.forEach((alert, index) => {
      if (!WEATHER_RISK_PATTERN.test(alert.riskType)) return;
      const key = alert.riskType.toLowerCase();
      alerts.push({
        id: `weather.${key}.${index}`,
        severity: alert.severity,
        category: "weather",
        title: TITLE_MAP[key] ?? this.prettify(alert.riskType),
        message: alert.message,
        actionHint: HINT_MAP[key]
      });
    });

    return alerts;
  }

  private prettify(raw: string): string {
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
