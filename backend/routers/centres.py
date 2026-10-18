"""routers/centres.py"""
from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Centre, DailyStock, DailyFootfall, BedOccupancy, DoctorAttendance, TestAvailability, MEDICINES
from logic.scoring import compute_score

router = APIRouter(prefix="/api/centres", tags=["centres"])


def _days_of_stock(stock_qty: float, avg_cons: float) -> float:
    if avg_cons <= 0:
        return 999.0
    return stock_qty / avg_cons


def _severity(days: float) -> str:
    if days < 3:
        return "critical"
    if days < 7:
        return "warning"
    return "ok"


def _centre_summary(centre: Centre, db: Session) -> dict:
    today = date(2026, 10, 17)
    window = today - timedelta(days=29)

    # Latest stock per medicine
    stock_alerts = []
    for med in MEDICINES:
        latest = (
            db.query(DailyStock)
            .filter(DailyStock.centre_id == centre.id, DailyStock.medicine == med)
            .order_by(DailyStock.record_date.desc())
            .first()
        )
        avg_cons_row = (
            db.query(func.avg(DailyStock.consumption))
            .filter(
                DailyStock.centre_id == centre.id,
                DailyStock.medicine == med,
                DailyStock.record_date >= window,
            )
            .scalar()
        ) or 0.0
        if latest:
            days = _days_of_stock(latest.stock_qty, avg_cons_row)
            sev = _severity(days)
            if sev != "ok":
                stock_alerts.append({"medicine": med, "days_left": round(days, 1), "severity": sev})

    # Latest bed occupancy
    bed = (
        db.query(BedOccupancy)
        .filter(BedOccupancy.centre_id == centre.id)
        .order_by(BedOccupancy.record_date.desc())
        .first()
    )
    bed_pct = (bed.occupied / centre.bed_capacity) if bed else 0.0

    # Doctor attendance - last 30 days
    att_rows = (
        db.query(DoctorAttendance)
        .filter(DoctorAttendance.centre_id == centre.id, DoctorAttendance.record_date >= window)
        .all()
    )
    posted_total = sum(r.doctors_posted for r in att_rows) or 1
    present_total = sum(r.doctors_present for r in att_rows)
    absence_rate = 1.0 - (present_total / posted_total)

    # Test unavailability - last 30 days
    test_rows = (
        db.query(TestAvailability)
        .filter(TestAvailability.centre_id == centre.id, TestAvailability.record_date >= window)
        .all()
    )
    if test_rows:
        total_tests = len(test_rows) * 5
        unavail = sum(
            (not r.malaria_rdt) + (not r.blood_test) + (not r.x_ray) + (not r.hiv_kit) + (not r.urine_test)
            for r in test_rows
        )
        test_unavail_rate = unavail / total_tests
    else:
        test_unavail_rate = 0.0

    # Stock-out rate
    stock_rows = (
        db.query(DailyStock)
        .filter(DailyStock.centre_id == centre.id, DailyStock.record_date >= window)
        .all()
    )
    if stock_rows:
        stockout_rate = sum(1 for r in stock_rows if r.stock_qty == 0) / len(stock_rows)
    else:
        stockout_rate = 0.0

    perf = compute_score({
        "stockout_rate": stockout_rate,
        "absence_rate": absence_rate,
        "bed_occupancy": bed_pct,
        "test_unavail_rate": test_unavail_rate,
    })

    # Map marker colour
    if perf["score"] < 50 or any(a["severity"] == "critical" for a in stock_alerts):
        marker = "red"
    elif perf["score"] < 75 or any(a["severity"] == "warning" for a in stock_alerts):
        marker = "amber"
    else:
        marker = "green"

    return {
        "id": centre.id,
        "name": centre.name,
        "centre_type": centre.centre_type.value,
        "district": centre.district,
        "block": centre.block,
        "latitude": centre.latitude,
        "longitude": centre.longitude,
        "bed_capacity": centre.bed_capacity,
        "marker": marker,
        "score": perf["score"],
        "reasons": perf["reasons"],
        "stock_alerts": stock_alerts,
        "bed_occupancy_pct": round(bed_pct * 100, 1),
        "absence_rate_pct": round(absence_rate * 100, 1),
    }


@router.get("")
def list_centres(db: Session = Depends(get_db)):
    centres = db.query(Centre).all()
    return [_centre_summary(c, db) for c in centres]


@router.get("/{centre_id}")
def get_centre(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Centre not found")

    summary = _centre_summary(centre, db)

    # Full 60-day history
    stocks = (
        db.query(DailyStock)
        .filter(DailyStock.centre_id == centre_id)
        .order_by(DailyStock.record_date)
        .all()
    )
    stock_history = {}
    for r in stocks:
        stock_history.setdefault(r.medicine, []).append({
            "date": r.record_date.isoformat(),
            "stock_qty": r.stock_qty,
            "consumption": r.consumption,
        })

    footfalls = (
        db.query(DailyFootfall)
        .filter(DailyFootfall.centre_id == centre_id)
        .order_by(DailyFootfall.record_date)
        .all()
    )

    beds = (
        db.query(BedOccupancy)
        .filter(BedOccupancy.centre_id == centre_id)
        .order_by(BedOccupancy.record_date)
        .all()
    )

    attendances = (
        db.query(DoctorAttendance)
        .filter(DoctorAttendance.centre_id == centre_id)
        .order_by(DoctorAttendance.record_date)
        .all()
    )

    tests = (
        db.query(TestAvailability)
        .filter(TestAvailability.centre_id == centre_id)
        .order_by(TestAvailability.record_date)
        .all()
    )

    summary["stock_history"] = stock_history
    summary["footfall_history"] = [
        {"date": r.record_date.isoformat(), "count": r.patient_count} for r in footfalls
    ]
    summary["bed_history"] = [
        {"date": r.record_date.isoformat(), "occupied": r.occupied, "capacity": centre.bed_capacity}
        for r in beds
    ]
    summary["attendance_history"] = [
        {"date": r.record_date.isoformat(), "posted": r.doctors_posted, "present": r.doctors_present}
        for r in attendances
    ]
    summary["test_history"] = [
        {
            "date": r.record_date.isoformat(),
            "malaria_rdt": r.malaria_rdt, "blood_test": r.blood_test,
            "x_ray": r.x_ray, "hiv_kit": r.hiv_kit, "urine_test": r.urine_test,
        }
        for r in tests
    ]
    return summary
