"""
database.py - SQLAlchemy models for Smart Health
"""
from datetime import date
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    Date, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import enum

DATABASE_URL = "sqlite:///./smart_health.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CentreType(str, enum.Enum):
    PHC = "PHC"
    CHC = "CHC"


class Centre(Base):
    __tablename__ = "centres"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    centre_type = Column(SAEnum(CentreType), nullable=False)
    district = Column(String, default="Raipur")
    block = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bed_capacity = Column(Integer, default=10)

    daily_stocks = relationship("DailyStock", back_populates="centre", cascade="all, delete")
    daily_footfalls = relationship("DailyFootfall", back_populates="centre", cascade="all, delete")
    bed_occupancies = relationship("BedOccupancy", back_populates="centre", cascade="all, delete")
    doctor_attendances = relationship("DoctorAttendance", back_populates="centre", cascade="all, delete")
    test_availabilities = relationship("TestAvailability", back_populates="centre", cascade="all, delete")


MEDICINES = [
    "ORS", "Paracetamol", "Amoxicillin", "Iron-Folic Acid",
    "Metformin", "Amlodipine", "Atenolol", "Cotrimoxazole",
    "Vitamin A", "Chloroquine",
]

TESTS = ["Malaria RDT", "Blood Test", "X-Ray", "HIV Kit", "Urine Test"]


class DailyStock(Base):
    __tablename__ = "daily_stocks"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("centres.id"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    medicine = Column(String, nullable=False)
    stock_qty = Column(Float, default=0.0)
    consumption = Column(Float, default=0.0)
    centre = relationship("Centre", back_populates="daily_stocks")


class DailyFootfall(Base):
    __tablename__ = "daily_footfalls"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("centres.id"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    patient_count = Column(Integer, default=0)
    centre = relationship("Centre", back_populates="daily_footfalls")


class BedOccupancy(Base):
    __tablename__ = "bed_occupancies"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("centres.id"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    occupied = Column(Integer, default=0)
    centre = relationship("Centre", back_populates="bed_occupancies")


class DoctorAttendance(Base):
    __tablename__ = "doctor_attendances"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("centres.id"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    doctors_posted = Column(Integer, default=1)
    doctors_present = Column(Integer, default=1)
    centre = relationship("Centre", back_populates="doctor_attendances")


class TestAvailability(Base):
    __tablename__ = "test_availabilities"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("centres.id"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    malaria_rdt = Column(Boolean, default=True)
    blood_test = Column(Boolean, default=True)
    x_ray = Column(Boolean, default=True)
    hiv_kit = Column(Boolean, default=True)
    urine_test = Column(Boolean, default=True)
    centre = relationship("Centre", back_populates="test_availabilities")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialised.")
