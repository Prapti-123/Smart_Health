"""routers/summary.py - Template-based district summary (en + hi)"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Centre, DailyStock, BedOccupancy, DoctorAttendance

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("")
def get_summary(db: Session = Depends(get_db)):
    today = date(2026, 10, 17)
    window = today - timedelta(days=7)

    total_centres = db.query(Centre).count()
    phc_count = db.query(Centre).filter(Centre.centre_type == "PHC").count()
    chc_count = total_centres - phc_count

    # Stock-out count
    stockout_centres = set()
    for row in db.query(DailyStock).filter(
        DailyStock.record_date == today, DailyStock.stock_qty == 0
    ).all():
        stockout_centres.add(row.centre_id)

    # Beds
    bed_rows = db.query(BedOccupancy).filter(BedOccupancy.record_date == today).all()
    centres = {c.id: c for c in db.query(Centre).all()}
    total_capacity = sum(c.bed_capacity for c in centres.values())
    total_occupied = sum(r.occupied for r in bed_rows)
    bed_pct = round((total_occupied / total_capacity * 100) if total_capacity else 0, 1)

    # Doctor absence
    att_rows = db.query(DoctorAttendance).filter(
        DoctorAttendance.record_date == today
    ).all()
    posted = sum(r.doctors_posted for r in att_rows) or 1
    present = sum(r.doctors_present for r in att_rows)
    absent = posted - present
    absence_pct = round(absent / posted * 100, 1)

    en_text = (
        f"District Health Summary – {today.strftime('%d %B %Y')}\n\n"
        f"The district has {total_centres} health centres ({phc_count} PHCs, {chc_count} CHCs). "
        f"{len(stockout_centres)} centre(s) reported medicine stock-outs today. "
        f"District-wide bed occupancy stands at {bed_pct}% ({total_occupied} of {total_capacity} beds). "
        f"Doctor absence rate today is {absence_pct}% ({absent} of {posted} posted doctors absent). "
        f"Immediate attention required at centres with critical stock levels."
    )

    hi_text = (
        f"जिला स्वास्थ्य सारांश – {today.strftime('%d %B %Y')}\n\n"
        f"जिले में {total_centres} स्वास्थ्य केंद्र हैं ({phc_count} PHC, {chc_count} CHC)। "
        f"आज {len(stockout_centres)} केंद्र(ों) पर दवाइयाँ समाप्त हो गई हैं। "
        f"जिले में बेड अधिभोग {bed_pct}% ({total_capacity} में से {total_occupied} बेड भरे हुए) है। "
        f"आज चिकित्सक अनुपस्थिति दर {absence_pct}% ({posted} में से {absent} डॉक्टर अनुपस्थित) है। "
        f"गंभीर दवा स्तर वाले केंद्रों पर तत्काल ध्यान देना आवश्यक है।"
    )

    return {
        "date": today.isoformat(),
        "stats": {
            "total_centres": total_centres,
            "phc_count": phc_count,
            "chc_count": chc_count,
            "stockout_centres": len(stockout_centres),
            "bed_occupancy_pct": bed_pct,
            "total_beds": total_capacity,
            "occupied_beds": total_occupied,
            "absence_pct": absence_pct,
        },
        "summary": {"en": en_text, "hi": hi_text},
    }
