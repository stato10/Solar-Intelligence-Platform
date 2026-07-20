import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpProviderBase } from "../common/http-provider.base";
import { AdapterErrorPayload, ProviderHealthStatus, ProviderRequestMeta } from "../common/provider.types";
import {
  SolarForecastInput,
  SolarForecastOutput,
  SolarProvider
} from "../contracts/solar-provider.interface";

interface PvgisMonthlyEntry {
  E_d?: number;
}

interface PvgisOutputs {
  monthly?: {
    fixed?: PvgisMonthlyEntry[];
  };
  totals?: {
    fixed?: {
      E_d?: number;
      E_m?: number;
      E_y?: number;
    };
  };
}

interface PvgisPvCalcResponse {
  outputs?: PvgisOutputs;
}

@Injectable()
export class PvgisSolarProvider extends HttpProviderBase implements SolarProvider {
  constructor(private readonly configService: ConfigService) {
    super(
      "PVGIS",
      configService.get<string>("app.pvgis.baseUrl") ?? "https://re.jrc.ec.europa.eu/api/v5_3"
    );
  }

  private get config() {
    return {
      fallbackBaseUrl:
        this.configService.get<string>("app.pvgis.fallbackBaseUrl") ??
        "https://re.jrc.ec.europa.eu/api/v5_2",
      path: this.configService.get<string>("app.pvgis.pvcalcPath") ?? "/PVcalc",
      outputFormat: this.configService.get<string>("app.pvgis.outputFormat") ?? "json",
      pvTechChoice: this.configService.get<string>("app.pvgis.pvTechChoice") ?? "crystSi",
      mountingPlace: this.configService.get<string>("app.pvgis.mountingPlace") ?? "free"
    };
  }

  async getHealth(_meta?: ProviderRequestMeta): Promise<ProviderHealthStatus> {
    return {
      provider: "PVGIS",
      available: true,
      checkedAt: new Date().toISOString(),
      details: {
        mode: "real",
        baseUrl: this.baseUrl,
        fallbackBaseUrl: this.config.fallbackBaseUrl
      }
    };
  }

  async getForecast(
    input: SolarForecastInput,
    meta?: ProviderRequestMeta
  ): Promise<SolarForecastOutput> {
    const searchParams = new URLSearchParams({
      lat: String(input.latitude),
      lon: String(input.longitude),
      peakpower: String(input.systemSizeKw),
      loss: String(input.lossPercent),
      outputformat: this.config.outputFormat,
      pvtechchoice: this.config.pvTechChoice,
      mountingplace: this.config.mountingPlace
    });

    // Real panel geometry for an accurate baseline. PVGIS `angle` = tilt from
    // horizontal; `aspect` is relative to south (0 = south, -90 = east, 90 = west)
    // while our domain stores azimuth from north (180 = south).
    if (typeof input.tilt === "number" && Number.isFinite(input.tilt)) {
      searchParams.set("angle", String(input.tilt));
    }
    if (typeof input.azimuth === "number" && Number.isFinite(input.azimuth)) {
      const aspect = ((input.azimuth - 180 + 540) % 360) - 180;
      searchParams.set("aspect", String(aspect));
    }

    const primaryPath = this.buildProviderUrl(this.baseUrl, this.config.path);
    const fallbackPath = this.buildProviderUrl(
      this.config.fallbackBaseUrl,
      this.config.path
    );

    let response: PvgisPvCalcResponse;
    let usedFallback = false;

    try {
      response = await this.getJson<PvgisPvCalcResponse>(primaryPath, searchParams, meta);
    } catch (error) {
      if (!this.shouldRetryWithFallback(error)) {
        throw new ServiceUnavailableException("PVGIS request failed");
      }
      try {
        response = await this.getJson<PvgisPvCalcResponse>(fallbackPath, searchParams, meta);
        usedFallback = true;
      } catch {
        throw new ServiceUnavailableException("PVGIS request failed");
      }
    }

    const derived = this.deriveForecast(response);
    if (!derived) {
      throw new ServiceUnavailableException("PVGIS response missing expected production fields");
    }

    return {
      siteId: input.siteId,
      generatedAt: new Date().toISOString(),
      source: usedFallback ? "PVGIS_V5_2" : "PVGIS_V5_3",
      expectedDailyKwh: derived.daily,
      expectedWeeklyKwh: Number((derived.daily * 7).toFixed(2)),
      expectedMonthlyKwh: derived.monthly,
      peakWindowStart: "10:00",
      peakWindowEnd: "15:00"
    };
  }

  private deriveForecast(response: PvgisPvCalcResponse) {
    const totals = response.outputs?.totals?.fixed;
    const monthlyFixed = response.outputs?.monthly?.fixed ?? [];

    const avgMonthlyDaily =
      monthlyFixed.length > 0
        ? monthlyFixed
            .map((entry) => entry.E_d)
            .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
            .reduce((acc, value, _index, all) => acc + value / all.length, 0)
        : undefined;

    const fromYearlyDaily =
      typeof totals?.E_y === "number" && Number.isFinite(totals.E_y)
        ? totals.E_y / 365
        : undefined;

    const daily = this.round2(totals?.E_d ?? avgMonthlyDaily ?? fromYearlyDaily);
    if (daily === undefined) {
      return undefined;
    }

    const monthlyFromTotals = this.round2(totals?.E_m);
    const monthlyFromYearly =
      typeof totals?.E_y === "number" && Number.isFinite(totals.E_y)
        ? this.round2(totals.E_y / 12)
        : undefined;
    const monthly = monthlyFromTotals ?? monthlyFromYearly ?? this.round2(daily * 30);
    if (monthly === undefined) {
      return undefined;
    }

    return {
      daily,
      monthly
    };
  }

  private round2(value?: number) {
    if (value === undefined || Number.isNaN(value)) {
      return undefined;
    }
    return Number(value.toFixed(2));
  }

  private shouldRetryWithFallback(error: unknown) {
    if (!error || typeof error !== "object") {
      return true;
    }
    const maybeAdapterError = error as Partial<AdapterErrorPayload>;
    const statusCode = maybeAdapterError.statusCode;
    if (typeof statusCode !== "number") {
      return true;
    }
    return statusCode === 429 || statusCode >= 500;
  }

  private buildProviderUrl(base: string, path: string) {
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    const normalizedPath = path.replace(/^\/+/, "");
    return new URL(normalizedPath, normalizedBase).toString();
  }
}
