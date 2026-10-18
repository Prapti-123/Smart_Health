"""
seed.py - Deterministic seed for Smart Health DB
30 centres x 60 days, realistic Chhattisgarh data with planted problems
"""
import random
import math
from datetime import date, timedelta
from database import (
    init_db, SessionLocal, Centre, CentreType, DailyStock, DailyFootfall,
    BedOccupancy, DoctorAttendance, TestAvailability, MEDICINES
)

SEED = 42
random.seed(SEED)

# ── 30 Chhattisgarh centres ───────────────────────────────────────────────────
CENTRES_DATA = [
    # name, type, district, block, lat, lng, beds
    ("PHC Kharora",       "PHC", "Raipur",    "Kharora",       21.2514, 81.7179, 6),
    ("PHC Abhanpur",      "PHC", "Raipur",    "Abhanpur",      20.9170, 81.8850, 6),
    ("PHC Tilda",         "PHC", "Raipur",    "Tilda",         21.6470, 81.9710, 6),
    ("PHC Arang",         "PHC", "Raipur",    "Arang",         21.1900, 82.0270, 6),
    ("PHC Simga",         "PHC", "Baloda Bazar","Simga",       21.6250, 82.1670, 6),
    ("CHC Bhatapara",     "CHC", "Baloda Bazar","Bhatapara",   21.7250, 81.9390, 30),
    ("PHC Kasdol",        "PHC", "Baloda Bazar","Kasdol",      21.6400, 82.5340, 6),
    ("PHC Palari",        "PHC", "Baloda Bazar","Palari",      21.3820, 82.3680, 6),
    ("CHC Dhamtari",      "CHC", "Dhamtari",  "Dhamtari",     20.7080, 81.5480, 30),
    ("PHC Nagri",         "PHC", "Dhamtari",  "Nagri",        20.5700, 81.5200, 6),
    ("PHC Kurud",         "PHC", "Dhamtari",  "Kurud",        20.8020, 81.6820, 6),
    ("PHC Sihawa",        "PHC", "Dhamtari",  "Sihawa",       20.4580, 81.5590, 6),
    ("CHC Mahasamund",    "CHC", "Mahasamund","Mahasamund",   21.1110, 82.0960, 30),
    ("PHC Basna",         "PHC", "Mahasamund","Basna",        21.2580, 82.8070, 6),
    ("PHC Pithora",       "PHC", "Mahasamund","Pithora",      21.2490, 82.5140, 6),
    ("PHC Saraipali",     "PHC", "Mahasamund","Saraipali",    21.3330, 83.0080, 6),
    ("CHC Rajnandgaon",   "CHC", "Rajnandgaon","Rajnandgaon", 20.4966, 81.0295, 30),
    ("PHC Khairagarh",    "PHC", "Rajnandgaon","Khairagarh",  20.2780, 81.0060, 6),
    ("PHC Dongargarh",    "PHC", "Rajnandgaon","Dongargarh",  21.1820, 80.7570, 6),
    ("PHC Mohala",        "PHC", "Rajnandgaon","Mohala",      21.0640, 80.5840, 6),
    ("CHC Durg",          "CHC", "Durg",      "Durg",         21.1904, 81.2849, 30),
    ("PHC Patan",         "PHC", "Durg",      "Patan",        21.2680, 81.4160, 6),
    ("PHC Balod",         "PHC", "Balod",     "Balod",        20.7310, 81.2090, 6),
    ("PHC Gurur",         "PHC", "Balod",     "Gurur",        20.5920, 81.3050, 6),
    ("CHC Kondagaon",     "CHC", "Kondagaon", "Kondagaon",    19.5940, 81.6680, 30),
    ("PHC Farasgaon",     "PHC", "Kondagaon", "Farasgaon",    19.5430, 81.5370, 6),
    ("PHC Makdi",         "PHC", "Kondagaon", "Makdi",        19.7010, 81.7250, 6),
    ("CHC Kanker",        "CHC", "Kanker",    "Kanker",       20.2700, 81.4940, 30),
    ("PHC Narharpur",     "PHC", "Kanker",    "Narharpur",    20.3480, 81.6680, 6),
    ("PHC Charama",       "PHC", "Kanker",    "Charama",      20.1630, 81.3870, 6),
]

# Planted problem centres (0-indexed)
STOCKOUT_CENTRES = {2, 7, 14, 19, 26}        # chronic low stock
ABSENT_DOCTOR_CENTRES = {3, 11, 20, 27}       # high doctor absence
FULL_BED_CENTRES = {5, 8, 12, 16, 24}         # frequently full beds

# Base daily consumption per medicine per PHC/CHC (units/day)
BASE_CONSUMPTION = {
    "ORS":           {"PHC": 12, "CHC": 35},
    "Paracetamol":   {"PHC": 20, "CHC": 60},
    "Amoxicillin":   {"PHC": 8,  "CHC": 25},
    "Iron-Folic Acid":{"PHC": 15, "CHC": 40},
    "Metformin":     {"PHC": 6,  "CHC": 18},
    "Amlodipine":    {"PHC": 5,  "CHC": 15},
    "Atenolol":      {"PHC": 4,  "CHC": 12},
    "Cotrimoxazole": {"PHC": 7,  "CHC": 20},
    "Vitamin A":     {"PHC": 5,  "CHC": 14},
    "Chloroquine":   {"PHC": 6,  "CHC": 18},
}

# Initial stock in days-of-cover (so we can back-calculate units)
INITIAL_STOCK_DAYS = {
    "ORS": 30, "Paracetamol": 28, "Amoxicillin": 21,
    "Iron-Folic Acid": 35, "Metformin": 25, "Amlodipine": 20,
    "Atenolol": 22, "Cotrimoxazole": 18, "Vitamin A": 45,
    "Chloroquine": 30,
}

END_DATE = date(2026, 10, 17)     # yesterday (deterministic)
START_DATE = END_DATE - timedelta(days=59)


def diwali_spike(d: date) -> float:
    """Footfall spike around Diwali (Oct 20 area) and monsoon (Jul-Sep)."""
    spike = 1.0
    # Monsoon Jul-Sep
    if d.month in (7, 8, 9):
        spike *= random.uniform(1.2, 1.5)
    # Diwali Oct 20
    days_to_diwali = abs((d - date(d.year, 10, 20)).days)
    if days_to_diwali <= 3:
        spike *= random.uniform(0.4, 0.6)   # fewer patients during festival
    return spike


def generate_footfall(centre_idx: int, ctype: str, d: date) -> int:
    base = 35 if ctype == "PHC" else 120
    spike = diwali_spike(d)
    count = int(base * spike * random.uniform(0.8, 1.2))
    return max(1, count)


def generate_consumption(medicine: str, ctype: str, d: date, footfall: int) -> float:
    base = BASE_CONSUMPTION[medicine][ctype]
    # scale with footfall a bit
    footfall_base = 35 if ctype == "PHC" else 120
    scale = footfall / footfall_base
    cons = base * scale * random.uniform(0.85, 1.15)
    return max(0.1, round(cons, 1))


def build_stock_series(centre_idx: int, medicine: str, ctype: str):
    """Build 60 days stock levels starting from initial stock."""
    base_cons = BASE_CONSUMPTION[medicine][ctype]
    initial = INITIAL_STOCK_DAYS[medicine] * base_cons

    # Stockout centres: start with very little stock
    if centre_idx in STOCKOUT_CENTRES:
        initial *= random.uniform(0.05, 0.20)

    stock = initial
    result = []
    for i in range(60):
        d = START_DATE + timedelta(days=i)
        footfall = generate_footfall(centre_idx, ctype, d)
        cons = generate_consumption(medicine, ctype, d, footfall)
        # Resupply: 20% chance each week for non-stockout centres
        resupply = 0.0
        if centre_idx not in STOCKOUT_CENTRES and i % 7 == 3:
            resupply = base_cons * random.uniform(14, 21)
        stock = max(0, stock - cons + resupply)
        result.append((d, round(stock, 1), round(cons, 1)))
    return result


def main():
    init_db()
    db = SessionLocal()

    try:
        # Clear existing
        for model in [DailyStock, DailyFootfall, BedOccupancy, DoctorAttendance,
                      TestAvailability, Centre]:
            db.query(model).delete()
        db.commit()

        centres = []
        for i, (name, ctype, district, block, lat, lng, beds) in enumerate(CENTRES_DATA):
            c = Centre(
                name=name, centre_type=CentreType(ctype),
                district=district, block=block,
                latitude=lat, longitude=lng, bed_capacity=beds
            )
            db.add(c)
            centres.append(c)
        db.commit()
        print(f"Inserted {len(centres)} centres")

        for i, centre in enumerate(centres):
            ctype = centre.centre_type.value
            random.seed(SEED + centre.id)  # reproducible per-centre

            # Pre-compute footfall series for the centre
            footfall_series = [
                (START_DATE + timedelta(days=d), generate_footfall(i, ctype, START_DATE + timedelta(days=d)))
                for d in range(60)
            ]

            # DailyFootfall
            for (d, count) in footfall_series:
                db.add(DailyFootfall(centre_id=centre.id, record_date=d, patient_count=count))

            # DailyStock per medicine
            for medicine in MEDICINES:
                series = build_stock_series(i, medicine, ctype)
                for (d, stock, cons) in series:
                    db.add(DailyStock(
                        centre_id=centre.id, record_date=d,
                        medicine=medicine, stock_qty=stock, consumption=cons
                    ))

            # BedOccupancy
            capacity = centre.bed_capacity
            for (d, footfall) in footfall_series:
                if i in FULL_BED_CENTRES:
                    occ_pct = random.uniform(0.88, 1.0)
                else:
                    occ_pct = random.uniform(0.3, 0.75)
                occupied = min(capacity, int(capacity * occ_pct))
                db.add(BedOccupancy(centre_id=centre.id, record_date=d, occupied=occupied))

            # DoctorAttendance
            posted = 2 if ctype == "CHC" else 1
            for (d, _) in footfall_series:
                if i in ABSENT_DOCTOR_CENTRES:
                    absent_prob = 0.45
                else:
                    absent_prob = 0.08
                present = posted
                for _ in range(posted):
                    if random.random() < absent_prob:
                        present -= 1
                present = max(0, present)
                db.add(DoctorAttendance(
                    centre_id=centre.id, record_date=d,
                    doctors_posted=posted, doctors_present=present
                ))

            # TestAvailability
            for (d, _) in footfall_series:
                avail = {
                    "malaria_rdt": random.random() > (0.30 if i in STOCKOUT_CENTRES else 0.05),
                    "blood_test":  random.random() > 0.05,
                    "x_ray":       random.random() > (0.6 if ctype == "PHC" else 0.10),
                    "hiv_kit":     random.random() > (0.35 if i in STOCKOUT_CENTRES else 0.08),
                    "urine_test":  random.random() > 0.05,
                }
                db.add(TestAvailability(
                    centre_id=centre.id, record_date=d, **avail
                ))

            if i % 5 == 0:
                db.commit()
                print(f"  seeded {i+1}/{len(centres)} centres...")

        db.commit()
        print("Seed complete!")

        # Quick sanity check
        stock_count = db.query(DailyStock).count()
        ff_count = db.query(DailyFootfall).count()
        print(f"  DailyStock rows: {stock_count}")
        print(f"  DailyFootfall rows: {ff_count}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
