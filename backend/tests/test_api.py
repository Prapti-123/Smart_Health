"""
tests/test_api.py - pytest tests for Smart Health API
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend/ is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Use an in-memory test DB
os.environ["SMART_HEALTH_TEST"] = "1"

from database import Base, engine, SessionLocal, init_db, MEDICINES
from main import app

# Override DB to use test engine
@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create tables and seed minimal test data."""
    init_db()
    from seed import main as seed_main
    seed_main()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ── Centres ──────────────────────────────────────────────────────────────────

def test_list_centres(client):
    r = client.get("/api/centres")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 30
    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "marker" in first
    assert first["marker"] in ("red", "amber", "green")


def test_get_centre_detail(client):
    r = client.get("/api/centres/1")
    assert r.status_code == 200
    data = r.json()
    assert "stock_history" in data
    assert "footfall_history" in data
    assert len(data["footfall_history"]) == 60


def test_centre_not_found(client):
    r = client.get("/api/centres/9999")
    assert r.status_code == 404


# ── Stock Alerts ──────────────────────────────────────────────────────────────

def test_stock_alerts(client):
    r = client.get("/api/stock/alerts")
    assert r.status_code == 200
    data = r.json()
    assert "alerts" in data
    assert "total" in data
    # We planted stockout centres, so we expect some alerts
    assert data["total"] > 0
    for alert in data["alerts"]:
        assert alert["severity"] in ("critical", "warning")
        assert alert["days_of_stock_left"] < 7


def test_stock_alerts_sorted(client):
    r = client.get("/api/stock/alerts")
    data = r.json()
    alerts = data["alerts"]
    severities = [a["severity"] for a in alerts]
    # All criticals before warnings
    seen_warning = False
    for s in severities:
        if s == "warning":
            seen_warning = True
        if seen_warning:
            assert s != "critical", "Critical should come before warnings"


# ── Forecast ──────────────────────────────────────────────────────────────────

def test_forecast_centre(client):
    r = client.get("/api/forecast/1")
    assert r.status_code == 200
    data = r.json()
    assert "footfall" in data
    assert "medicines" in data
    assert len(data["forecast_dates"]) == 14
    footfall = data["footfall"]
    assert footfall["method"] in ("ets", "moving_average")
    assert all(v >= 0 for v in footfall["forecast"])


def test_forecast_no_negatives(client):
    for cid in [1, 5, 10]:
        r = client.get(f"/api/forecast/{cid}")
        data = r.json()
        for med, info in data["medicines"].items():
            assert all(v >= 0 for v in info["forecast"]), f"Negative forecast for {med} at centre {cid}"


# ── Redistribution ────────────────────────────────────────────────────────────

def test_redistribution(client):
    r = client.get("/api/redistribution")
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    # Check donor safety: from_days_left should be >= 7 after transfer
    for rec in data["recommendations"]:
        assert rec["from_days_left"] >= 7, (
            f"Donor {rec['from_centre_name']} has {rec['from_days_left']} days left - below safe threshold"
        )


# ── Flags ─────────────────────────────────────────────────────────────────────

def test_flags(client):
    r = client.get("/api/flags")
    assert r.status_code == 200
    data = r.json()
    assert "flagged" in data
    assert "all_centres" in data
    assert len(data["all_centres"]) == 30
    for c in data["flagged"]:
        assert c["score"] < 60
        assert len(c["reasons"]) > 0


# ── Summary ───────────────────────────────────────────────────────────────────

def test_summary(client):
    r = client.get("/api/summary")
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    assert "en" in data["summary"]
    assert "hi" in data["summary"]
    assert "जिला" in data["summary"]["hi"]
    assert "District" in data["summary"]["en"]


# ── Entry ─────────────────────────────────────────────────────────────────────

def test_entry_submission(client):
    payload = {
        "centre_id": 1,
        "record_date": "2026-10-18",
        "footfall": 42,
        "beds_occupied": 3,
        "doctors_posted": 1,
        "doctors_present": 1,
        "malaria_rdt": True,
        "blood_test": True,
        "x_ray": False,
        "hiv_kit": True,
        "urine_test": True,
        "stocks": [
            {"medicine": "ORS", "stock_qty": 500, "consumption": 12},
            {"medicine": "Paracetamol", "stock_qty": 200, "consumption": 20},
        ],
    }
    r = client.post("/api/entry", json=payload)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_entry_invalid_centre(client):
    r = client.post("/api/entry", json={"centre_id": 9999, "record_date": "2026-10-18"})
    assert r.status_code == 404
