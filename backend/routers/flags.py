"""routers/flags.py"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Centre, DailyStock, BedOccupancy, DoctorAttendance, TestAvailability
from logic.scoring import compute_score

router = APIRouter(prefix="/api/flags", tags=["flags"])
LOOKBACK = 30


@router.get("")
def get_flagged_centres(db: Session = Depends(get_db)):
    today = date(2026, 10, 17)
    window = today - timedelta(days=LOOKBACK)
    centres = db.query(Centre).all()
    scored = []

    for centre in centres:
        stock_rows = (
            db.query(DailyStock)
            .filter(DailyStock.centre_id == centre.id, DailyStock.record_date >= window)
            .all()
        )
        stockout_rate = (
            sum(1 for r in stock_rows if r.stock_qty == 0) / len(stock_rows)
            if stock_rows else 0.0
        )

        att_rows = (
            db.query(DoctorAttendance)
            .filter(DoctorAttendance.centre_id == centre.id, DoctorAttendance.record_date >= window)
            .all()
        )
        posted = sum(r.doctors_posted for r in att_rows) or 1
        present = sum(r.doctors_present for r in att_rows)
        absence_rate = 1.0 - (present / posted)

        bed_rows = (
            db.query(BedOccupancy)
            .filter(BedOccupancy.centre_id == centre.id, BedOccupancy.record_date >= window)
            .all()
        )
        if bed_rows:
            avg_occ = sum(r.occupied for r in bed_rows) / len(bed_rows)
            bed_occ = avg_occ / centre.bed_capacity
        else:
            bed_occ = 0.0

        test_rows = (
            db.query(TestAvailability)
            .filter(TestAvailability.centre_id == centre.id, TestAvailability.record_date >= window)
            .all()
        )
        if test_rows:
            total = len(test_rows) * 5
            unavail = sum(
                (not r.malaria_rdt) + (not r.blood_test) + (not r.x_ray) + (not r.hiv_kit) + (not r.urine_test)
                for r in test_rows
            )
            test_unavail_rate = unavail / total
        else:
            test_unavail_rate = 0.0

        perf = compute_score({
            "stockout_rate": stockout_rate,
            "absence_rate": absence_rate,
            "bed_occupancy": bed_occ,
            "test_unavail_rate": test_unavail_rate,
        })

        scored.append({
            "centre_id": centre.id,
            "centre_name": centre.name,
            "centre_type": centre.centre_type.value,
            "district": centre.district,
            "score": perf["score"],
            "reasons": perf["reasons"],
            "metrics": {
                "stockout_rate_pct": round(stockout_rate * 100, 1),
                "absence_rate_pct": round(absence_rate * 100, 1),
                "bed_occupancy_pct": round(bed_occ * 100, 1),
                "test_unavail_rate_pct": round(test_unavail_rate * 100, 1),
            },
        })

    scored.sort(key=lambda x: x["score"])
    flagged = [s for s in scored if s["score"] < 60]
    return {"total_flagged": len(flagged), "flagged": flagged, "all_centres": scored}
