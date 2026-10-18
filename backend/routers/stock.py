"""routers/stock.py"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Centre, DailyStock, MEDICINES

router = APIRouter(prefix="/api/stock", tags=["stock"])

LOOKBACK_DAYS = 7


def _days_left(stock: float, avg_cons: float) -> float:
    if avg_cons <= 0:
        return 999.0
    return stock / avg_cons


def _severity(days: float) -> str:
    if days < 3:
        return "critical"
    if days < 7:
        return "warning"
    return "ok"


@router.get("/alerts")
def get_stock_alerts(db: Session = Depends(get_db)):
    today = date(2026, 10, 17)
    window = today - timedelta(days=LOOKBACK_DAYS)
    centres = db.query(Centre).all()
    alerts = []

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

            if latest is None:
                continue
            days = _days_left(latest.stock_qty, avg_cons)
            sev = _severity(days)
            if sev != "ok":
                alerts.append({
                    "centre_id": centre.id,
                    "centre_name": centre.name,
                    "centre_type": centre.centre_type.value,
                    "district": centre.district,
                    "medicine": med,
                    "stock_qty": latest.stock_qty,
                    "avg_daily_consumption": round(avg_cons, 2),
                    "days_of_stock_left": round(days, 1),
                    "severity": sev,
                    "as_of_date": latest.record_date.isoformat(),
                })

    alerts.sort(key=lambda x: (0 if x["severity"] == "critical" else 1, x["days_of_stock_left"]))
    return {"total": len(alerts), "alerts": alerts}


class StockEntry(BaseModel):
    centre_id: int
    record_date: date
    medicine: str = Field(..., description="Medicine name from MEDICINES list")
    stock_qty: float = Field(..., ge=0)
    consumption: float = Field(..., ge=0)


@router.post("/entry")
def add_stock_entry(entry: StockEntry, db: Session = Depends(get_db)):
    centre = db.query(Centre).filter(Centre.id == entry.centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    if entry.medicine not in MEDICINES:
        raise HTTPException(status_code=400, detail=f"Invalid medicine. Choose from: {MEDICINES}")

    existing = (
        db.query(DailyStock)
        .filter(
            DailyStock.centre_id == entry.centre_id,
            DailyStock.record_date == entry.record_date,
            DailyStock.medicine == entry.medicine,
        )
        .first()
    )
    if existing:
        existing.stock_qty = entry.stock_qty
        existing.consumption = entry.consumption
    else:
        db.add(DailyStock(
            centre_id=entry.centre_id,
            record_date=entry.record_date,
            medicine=entry.medicine,
            stock_qty=entry.stock_qty,
            consumption=entry.consumption,
        ))
    db.commit()
    return {"status": "ok", "message": "Stock entry saved."}
