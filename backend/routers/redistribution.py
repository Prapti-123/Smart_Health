"""routers/redistribution.py"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Centre, DailyStock, MEDICINES
from logic.redistribution import compute_redistribution

router = APIRouter(prefix="/api/redistribution", tags=["redistribution"])


@router.get("")
def get_redistribution(db: Session = Depends(get_db)):
    today = date(2026, 10, 17)
    window = today - timedelta(days=7)
    centres = db.query(Centre).all()

    centre_stocks = []
    for centre in centres:
        for med in MEDICINES:
            latest = (
                db.query(DailyStock)
                .filter(DailyStock.centre_id == centre.id, DailyStock.medicine == med)
                .order_by(DailyStock.record_date.desc())
                .first()
            )
            avg_cons = (
                db.query(func.avg(DailyStock.consumption))
                .filter(
                    DailyStock.centre_id == centre.id,
                    DailyStock.medicine == med,
                    DailyStock.record_date >= window,
                )
                .scalar()
            ) or 0.0

            if latest:
                centre_stocks.append({
                    "centre_id": centre.id,
                    "centre_name": centre.name,
                    "medicine": med,
                    "stock_qty": latest.stock_qty,
                    "avg_daily_consumption": avg_cons,
                    "latitude": centre.latitude,
                    "longitude": centre.longitude,
                })

    recommendations = compute_redistribution(centre_stocks)
    return {"total": len(recommendations), "recommendations": recommendations}
