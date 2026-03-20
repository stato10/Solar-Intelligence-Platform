from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(title="Solar Intelligence Engine", version="0.1.0")


@app.get("/health")
def health():
    return {
        "service": "engine",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _round2(value: float) -> float:
    return round(float(value), 2)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _heat_peak_window(temperature: float) -> tuple[str, str]:
    if temperature >= 36:
        return "12:00", "16:00"
    if temperature >= 31:
        return "11:00", "15:00"
    if temperature >= 26:
        return "10:00", "14:00"
    return "12:00", "14:00"


def _date_from_iso(value: str) -> str:
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
        return parsed.date().isoformat()
    except ValueError:
        # Fallback: keep deterministic baseline if upstream value is malformed.
        return "1970-01-01"


def compute_soiling_module(cloud_cover: float, precipitation: float, generated_at: str) -> dict:
    # Deterministic heuristic:
    # - cloud cover and dry periods increase dirt accumulation risk
    # - rain partially mitigates accumulated dust
    cloud_component = cloud_cover * 0.05
    dry_component = 2.5 if precipitation < 0.2 else 0.0
    rain_mitigation = precipitation * 0.7
    estimated_loss = _round2(_clamp(cloud_component + dry_component - rain_mitigation, 0.0, 14.0))
    score = _round2(_clamp(100.0 - estimated_loss * 6.5, 0.0, 100.0))
    cleaning_recommended = estimated_loss >= 4.5
    recommended_cleaning_date = (
        _date_from_iso(generated_at) if cleaning_recommended else None
    )

    if estimated_loss >= 8:
        explanation = "High soiling risk driven by sustained cloud cover and low rain cleaning effect"
    elif estimated_loss >= 4.5:
        explanation = "Moderate soiling risk; preventive cleaning is recommended"
    else:
        explanation = "Soiling risk is within acceptable range"

    return {
        "score": score,
        "estimatedLossPercent": estimated_loss,
        "cleaningRecommended": cleaning_recommended,
        "recommendedCleaningDate": recommended_cleaning_date,
        "explanation": explanation,
    }


def compute_heat_module(temperature: float, wind_speed: float) -> dict:
    # Deterministic heuristic:
    # - temperature above nominal panel point increases thermal loss
    # - stronger wind reduces thermal accumulation
    temperature_component = max(0.0, (temperature - 25.0) * 0.7)
    ventilation_mitigation = wind_speed * 0.08
    estimated_loss = _round2(_clamp(temperature_component - ventilation_mitigation, 0.0, 22.0))
    score = _round2(_clamp(100.0 - estimated_loss * 4.2, 0.0, 100.0))
    peak_start, peak_end = _heat_peak_window(temperature)

    return {
        "score": score,
        "estimatedLossPercent": estimated_loss,
        "peakHeatWindowStart": peak_start,
        "peakHeatWindowEnd": peak_end,
    }


def _severity_from_loss(loss_percent: float) -> Literal["low", "moderate", "high"]:
    if loss_percent >= 9:
        return "high"
    if loss_percent >= 4:
        return "moderate"
    return "low"


def compute_risk_alerts(
    *,
    generated_at: str,
    soiling_loss: float,
    heat_loss: float,
    precipitation: float,
    wind_speed: float,
) -> list["RiskAlert"]:
    alerts: list["RiskAlert"] = []

    if soiling_loss >= 4:
        alerts.append(
            RiskAlert(
                riskType="soiling",
                severity=_severity_from_loss(soiling_loss),
                message="Estimated soiling loss is elevated",
                expectedStart=generated_at,
                expectedEnd=generated_at,
            )
        )

    if heat_loss >= 4:
        alerts.append(
            RiskAlert(
                riskType="heat",
                severity=_severity_from_loss(heat_loss),
                message="Estimated heat loss is elevated",
                expectedStart=generated_at,
                expectedEnd=generated_at,
            )
        )

    # Additional deterministic weather operational risk.
    if precipitation >= 2.0 or wind_speed >= 30.0:
        severe_weather_severity: Literal["low", "moderate", "high"]
        if precipitation >= 5.0 or wind_speed >= 45.0:
            severe_weather_severity = "high"
        else:
            severe_weather_severity = "moderate"

        alerts.append(
            RiskAlert(
                riskType="weather",
                severity=severe_weather_severity,
                message="Weather conditions may impact system performance and operations",
                expectedStart=generated_at,
                expectedEnd=generated_at,
            )
        )

    return alerts


def compute_opportunity_module(
    *,
    site_id: str,
    generated_at: str,
    soiling_loss: float,
    heat_loss: float,
    alerts: list["RiskAlert"],
) -> dict:
    mitigation_potential = (soiling_loss * 0.55) + (heat_loss * 0.45)
    risk_pressure = len(alerts) * 8.5
    opportunity_score = _round2(_clamp((mitigation_potential * 2.8) + risk_pressure, 0.0, 100.0))

    recommendations: list["RecommendationItem"] = []
    if soiling_loss >= 4:
        recommendations.append(
            RecommendationItem(
                id=f"rec-soiling-{site_id}-{generated_at[:10]}",
                type="maintenance",
                title="Schedule panel cleaning",
                message="Moderate to high soiling impact is expected.",
                severity=_severity_from_loss(soiling_loss),
                priority=2 if soiling_loss >= 6 else 3,
                estimated_value=_round2(soiling_loss * 12.0),
                valid_from=generated_at,
                valid_until=generated_at,
                source_module="soiling",
            )
        )
    if heat_loss >= 4:
        recommendations.append(
            RecommendationItem(
                id=f"rec-heat-{site_id}-{generated_at[:10]}",
                type="optimization",
                title="Mitigate thermal loss",
                message="Panel thermal conditions indicate notable efficiency impact.",
                severity=_severity_from_loss(heat_loss),
                priority=2 if heat_loss >= 7 else 3,
                estimated_value=_round2(heat_loss * 12.0),
                valid_from=generated_at,
                valid_until=generated_at,
                source_module="heat",
            )
        )

    if any(alert.riskType == "weather" for alert in alerts):
        recommendations.append(
            RecommendationItem(
                id=f"rec-weather-{site_id}-{generated_at[:10]}",
                type="operational",
                title="Adjust dispatch for weather risk",
                message="Severe weather conditions can impact system operations.",
                severity="high" if any(a.severity == "high" for a in alerts) else "moderate",
                priority=1 if any(a.severity == "high" for a in alerts) else 2,
                estimated_value=0.0,
                valid_from=generated_at,
                valid_until=generated_at,
                source_module="risks",
            )
        )

    if not recommendations:
        recommendations.append(
            RecommendationItem(
                id=f"rec-maintain-{site_id}-{generated_at[:10]}",
                type="operational",
                title="Maintain current profile",
                message="No high-impact action required for current conditions.",
                severity="low",
                priority=5,
                estimated_value=0.0,
                valid_from=generated_at,
                valid_until=generated_at,
                source_module="opportunity",
            )
        )

    estimated_value = _round2((soiling_loss + heat_loss) * 12.0)

    return {
        "opportunityScore": opportunity_score,
        "recommendations": [item.model_dump() for item in recommendations],
        "estimatedValue": estimated_value,
    }


def compute_financial_module(
    *,
    expected_daily_kwh: float,
    soiling_loss: float,
    heat_loss: float,
    opportunity_score: float,
    import_rate: float,
    export_rate: float,
) -> dict:
    # Deterministic tariff-aware financial estimation.
    effective_import_rate = import_rate if import_rate > 0 else 0.18
    effective_export_rate = export_rate if export_rate > 0 else effective_import_rate * 0.55

    retained_energy_ratio = _clamp(1 - (soiling_loss + heat_loss) / 100, 0.0, 1.0)
    bill_offset_daily = expected_daily_kwh * retained_energy_ratio * effective_import_rate
    export_revenue_daily = expected_daily_kwh * 0.2 * effective_export_rate

    daily_estimated_savings = _round2(bill_offset_daily + export_revenue_daily)
    monthly_estimated_savings = _round2(daily_estimated_savings * 30)
    yearly_optimization_potential = _round2(
        monthly_estimated_savings * 12 * _clamp(opportunity_score / 100, 0.0, 1.0)
    )

    return {
        "dailyEstimatedSavings": daily_estimated_savings,
        "monthlyEstimatedSavings": monthly_estimated_savings,
        "yearlyOptimizationPotential": yearly_optimization_potential,
    }


class WeatherInput(BaseModel):
    temperature: float | None = None
    cloudCover: float | None = Field(default=None, ge=0, le=100)
    windSpeed: float | None = Field(default=None, ge=0)
    precipitation: float | None = Field(default=None, ge=0)


class SolarInput(BaseModel):
    expectedDailyKwh: float = Field(ge=0)
    expectedWeeklyKwh: float = Field(ge=0)
    expectedMonthlyKwh: float = Field(ge=0)


class TariffInput(BaseModel):
    currency: str | None = None
    importRate: float | None = Field(default=None, ge=0)
    exportRate: float | None = Field(default=None, ge=0)


class EngineCalculateV1Input(BaseModel):
    model_config = ConfigDict(extra="forbid")

    siteId: str
    generatedAt: str
    weather: WeatherInput
    solar: SolarInput
    tariff: TariffInput | None = None


class RiskAlert(BaseModel):
    riskType: str
    severity: Literal["low", "moderate", "high"]
    message: str
    expectedStart: str
    expectedEnd: str


class RecommendationItem(BaseModel):
    id: str
    type: str
    title: str
    message: str
    severity: Literal["low", "moderate", "high"]
    priority: int
    estimated_value: float
    valid_from: str
    valid_until: str
    source_module: str


class EngineCalculateV1Output(BaseModel):
    model_config = ConfigDict(extra="forbid")

    siteId: str
    generatedAt: str
    source: Literal["ENGINE_V1"]
    forecast: dict
    soiling: dict
    heat: dict
    risks: dict
    optimization: dict
    financial: dict


@app.post("/calculate/v1")
def calculate_v1(payload: EngineCalculateV1Input) -> EngineCalculateV1Output:
    # Phase 4.2/4.3 deterministic normalization and scoring modules.
    daily = _round2(payload.solar.expectedDailyKwh)
    weekly = _round2(payload.solar.expectedWeeklyKwh)
    monthly = _round2(payload.solar.expectedMonthlyKwh)

    cloud_cover = payload.weather.cloudCover if payload.weather.cloudCover is not None else 0.0
    temperature = payload.weather.temperature if payload.weather.temperature is not None else 25.0
    precipitation = (
        payload.weather.precipitation if payload.weather.precipitation is not None else 0.0
    )
    wind_speed = payload.weather.windSpeed if payload.weather.windSpeed is not None else 0.0

    soiling = compute_soiling_module(
        cloud_cover=cloud_cover,
        precipitation=precipitation,
        generated_at=payload.generatedAt,
    )
    heat = compute_heat_module(temperature=temperature, wind_speed=wind_speed)
    soiling_loss = soiling["estimatedLossPercent"]
    heat_loss = heat["estimatedLossPercent"]
    alerts = compute_risk_alerts(
        generated_at=payload.generatedAt,
        soiling_loss=soiling_loss,
        heat_loss=heat_loss,
        precipitation=precipitation,
        wind_speed=wind_speed,
    )
    opportunity = compute_opportunity_module(
        site_id=payload.siteId,
        generated_at=payload.generatedAt,
        soiling_loss=soiling_loss,
        heat_loss=heat_loss,
        alerts=alerts,
    )

    import_rate = payload.tariff.importRate if payload.tariff and payload.tariff.importRate else 0.18
    export_rate = payload.tariff.exportRate if payload.tariff and payload.tariff.exportRate else 0.0
    financial = compute_financial_module(
        expected_daily_kwh=daily,
        soiling_loss=soiling_loss,
        heat_loss=heat_loss,
        opportunity_score=opportunity["opportunityScore"],
        import_rate=import_rate,
        export_rate=export_rate,
    )

    return EngineCalculateV1Output(
        siteId=payload.siteId,
        generatedAt=payload.generatedAt,
        source="ENGINE_V1",
        forecast={
            "expectedDailyKwh": daily,
            "expectedWeeklyKwh": weekly,
            "expectedMonthlyKwh": monthly,
        },
        soiling={
            **soiling,
        },
        heat={
            **heat,
        },
        risks={"alerts": [alert.model_dump() for alert in alerts]},
        optimization=opportunity,
        financial=financial,
    )
