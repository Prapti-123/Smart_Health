"""routers/forecast.py"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Centre, DailyStock, DailyFootfall, MEDICINES
from logic.forecasting import forecast_series

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/{centre_id}")
def get_forecast(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    # Footfall forecast
    ff_rows = (
        db.query(DailyFootfall)
        .filter(DailyFootfall.centre_id == centre_id)
        .order_by(DailyFootfall.record_date)
        .all()
    )
    ff_series = [r.patient_count for r in ff_rows]
    ff_forecast, ff_method = forecast_series(ff_series, horizon=14)

    today = date(2026, 10, 17)
    forecast_dates = [(today + timedelta(days=i + 1)).isoformat() for i in range(14)]

    # Per-medicine forecast
    medicine_forecasts = {}
    for med in MEDICINES:
        cons_rows = (
            db.query(DailyStock)
            .filter(DailyStock.centre_id == centre_id, DailyStock.medicine == med)
            .order_by(DailyStock.record_date)
            .all()
        )
        cons_series = [r.consumption for r in cons_rows]
        preds, method = forecast_series(cons_series, horizon=14)
        medicine_forecasts[med] = {"forecast": [round(p, 2) for p in preds], "method": method}

    return {
        "centre_id": centre_id,
        "centre_name": centre.name,
        "forecast_dates": forecast_dates,
        "footfall": {
            "forecast": [round(p, 1) for p in ff_forecast],
            "method": ff_method,
        },
        "medicines": medicine_forecasts,
    }
