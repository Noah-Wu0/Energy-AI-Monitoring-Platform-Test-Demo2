const DATA = {
  "id": "ANO-2026-0512",
  "case_id": "CASE-2026-001",
  "facility_id": "FAC-KZ-AKT-GCS-001",
  "facility_name": "Aktau Main Compressor Station",
  "facility_type": "GAS_COMPRESSOR",
  "enterprise_id": "ENT-KZ-AKT-0091",
  "enterprise_name": "Western Caspian Energy LLC",
  "severity": "CRITICAL",
  "priority": "HIGH",
  "metric": {
    "name": "GAS_THROUGHPUT",
    "unit": "MMcm per 15-min",
    "display_unit": "MMcm/d (rolling 24h)",
    "baseline_daily": 12.4
  },
  "detected_at": "2026-05-28T14:32:00Z",
  "anomaly_window_start": "2026-05-22T00:32:00Z",
  "anomaly_window_end": "2026-05-28T14:32:00Z",
  "pattern_type": "PERSISTENT_NIGHT_OVERAGE",
  "kpis": {
    "deviation_duration_h": 144,
    "max_deviation_pct": 40.4,
    "max_deviation_ci": "95% CI: 36.1-44.7%",
    "morphology_similarity_score": 0.87,
    "morphology_ci": "95% CI: 0.82-0.92",
    "ai_confidence": 0.87,
    "ai_confidence_ci": "LLM-TS-Foundation-V2.3 · 30-day backtest accuracy 91.2%",
    "anomaly_points": 156,
    "similar_historical_cases": 3,
    "predicted_next_breach_h": 48,
    "action_window_h": 36,
    "predicted_cumulative_loss_mmcm": 75
  },
  "ai_explanation": {
    "headline": "Prediction: 92% probability of pipeline throughput breach within 48H. Investigation must begin within 36H.",
    "detail": "The LLM time-series foundation model has learned the facility's normal operating patterns over the past 12 months. Over the last 6 working days, night-time throughput (22:00-06:00) has consistently exceeded the P90 prediction band, with an average deviation of +38%. The pattern morphology matches historical case ANO-2025-0317 (similarity 0.87, 95% CI: 0.82-0.92). If unaddressed, cumulative unreported throughput will exceed the 75 MMcm threshold within 30 days, triggering regulatory escalation.",
    "pattern_match": {
      "case_id": "ANO-2025-0317",
      "case_title": "Western Caspian — Unreported night production (2025-09)",
      "similarity": 0.87,
      "outcome": "Confirmed 18% unreported capacity expansion. Fined 240M KZT."
    }
  },
  "hypotheses": [
    {
      "rank": 1,
      "title": "Unreported capacity expansion",
      "probability": 0.65,
      "rationale": "Night-time throughput uplift is too consistent to be operational noise. Pattern matches 'covert production' fingerprint. Recent procurement records show new compressor unit ordered 2026-Q1 but no commissioning report filed.",
      "recommended_action": "Cross-check enterprise reports & on-site inspection",
      "evidence": [
        "Power consumption step-jump +14% since 2026-05-22",
        "Industry capacity ratio gap with peer facilities",
        "Recent procurement anomaly (new unit, no filing)",
        "3 prior unreported records in past 24 months"
      ]
    },
    {
      "rank": 2,
      "title": "Peak-valley load shifting",
      "probability": 0.22,
      "rationale": "Possible tariff arbitrage by moving daytime load to cheaper night rates. Less likely given the daytime load did not decrease correspondingly.",
      "recommended_action": "Verify tariff plan and metering accuracy",
      "evidence": [
        "No corresponding daytime load decrease",
        "Tariff arbitrage opportunity exists in region KZ-AKT"
      ]
    },
    {
      "rank": 3,
      "title": "Sensor drift / metering error",
      "probability": 0.13,
      "rationale": "Less likely; cross-check with adjacent metering node MTR-001 shows consistent pattern, ruling out single-sensor drift.",
      "recommended_action": "Recalibrate metering devices PT-01 and PT-02",
      "evidence": [
        "Cross-check with MTR-001 confirms pattern",
        "Pressure transmitters PT-01 within calibration window"
      ]
    }
  ],
  "future_risk_forecast": {
    "horizon_30d": {
      "risk_level": "HIGH",
      "predicted_outcome": "Pattern will persist; cumulative unreported throughput may exceed 75 MMcm threshold triggering regulatory escalation."
    },
    "horizon_90d": {
      "risk_level": "VERY_HIGH",
      "predicted_outcome": "If unaddressed, cumulative volume could trigger automatic license review under Article 47 of Energy Code."
    }
  }
};
export default DATA;
