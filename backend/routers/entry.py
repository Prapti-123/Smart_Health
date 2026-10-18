"""
routers/entry.py - Daily data entry endpoint (multi-field form POST)
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from database import (
    get_db, Centre, DailyStock, DailyFootfall,
    BedOccupancy, DoctorAttendance, TestAvailability, MEDICINES
)

router = APIRouter(prefix="/api/entry", tags=["entry"])


class DailyEntryPayload(BaseModel):
    centre_id: int
    record_date: date
    footfall: Optional[int] = Field(None, ge=0)
    beds_occupied: Optional[int] = Field(None, ge=0)
    doctors_posted: Optional[int] = Field(None, ge=0)
    doctors_present: Optional[int] = Field(None, ge=0)
    malaria_rdt: Optional[bool] = None
    blood_test: Optional[bool] = None
    x_ray: Optional[bool] = None
    hiv_kit: Optional[bool] = None
    urine_test: Optional[bool] = None
    stocks: Optional[List[dict]] = None  # [{medicine, stock_qty, consumption}]


@router.post("")
def submit_daily_entry(payload: DailyEntryPayload, db: Session = Depends(get_db)):
    centre = db.query(Centre).filter(Centre.id == payload.centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    d = payload.record_date
    cid = payload.centre_id

    def upsert(Model, filter_kwargs, update_kwargs):
        obj = db.query(Model).filter_by(**filter_kwargs).first()
        if obj:
            for k, v in update_kwargs.items():
                setattr(obj, k, v)
        else:
            db.add(Model(**filter_kwargs, **update_kwargs))

    if payload.footfall is not None:
        upsert(DailyFootfall, {"centre_id": cid, "record_date": d}, {"patient_count": payload.footfall})

    if payload.beds_occupied is not None:
        upsert(BedOccupancy, {"centre_id": cid, "record_date": d}, {"occupied": payload.beds_occupied})

    if payload.doctors_posted is not None or payload.doctors_present is not None:
        upsert(DoctorAttendance, {"centre_id": cid, "record_date": d}, {
            "doctors_posted": payload.doctors_posted or 1,
            "doctors_present": payload.doctors_present or 0,
        })

    test_fields = {k: v for k, v in {
        "malaria_rdt": payload.malaria_rdt,
        "blood_test": payload.blood_test,
        "x_ray": payload.x_ray,
        "hiv_kit": payload.hiv_kit,
        "urine_test": payload.urine_test,
    }.items() if v is not None}
    if test_fields:
        upsert(TestAvailability, {"centre_id": cid, "record_date": d}, test_fields)

    if payload.stocks:
        for s in payload.stocks:
            med = s.get("medicine")
            if med not in MEDICINES:
                continue
            upsert(DailyStock, {"centre_id": cid, "record_date": d, "medicine": med}, {
                "stock_qty": s.get("stock_qty", 0),
                "consumption": s.get("consumption", 0),
            })

    db.commit()
    return {"status": "ok", "message": "Daily entry saved successfully."}
