# Smart Health – District Health Officer Platform

A bilingual (English + Hindi) web platform for Chhattisgarh district health officers to manage PHCs and CHCs.

**Stack:** FastAPI + SQLite · React + Vite + Tailwind · Recharts · react-leaflet · i18next  
**Note:** No paid APIs, no external services except OpenStreetMap tiles (© OpenStreetMap contributors). Map markers are visible even without internet connectivity.

---

## Quick Start

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python seed.py          # one-time: creates and seeds the database
uvicorn main:app --reload
```

API is available at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App is available at: http://localhost:5173

---

## Project Structure

```
Smart_Health/
├── backend/
│   ├── main.py            # FastAPI app
│   ├── database.py        # SQLAlchemy models
│   ├── seed.py            # Deterministic seed (30 centres × 60 days)
│   ├── requirements.txt
│   ├── logic/
│   │   ├── forecasting.py     # ETS / moving-average forecast
│   │   ├── redistribution.py  # Greedy haversine matching
│   │   └── scoring.py         # Performance score
│   ├── routers/
│   │   ├── centres.py    # GET /api/centres, /api/centres/{id}
│   │   ├── stock.py      # GET /api/stock/alerts, POST /api/stock/entry
│   │   ├── forecast.py   # GET /api/forecast/{centre_id}
│   │   ├── redistribution.py
│   │   ├── flags.py      # GET /api/flags
│   │   ├── summary.py    # GET /api/summary
│   │   └── entry.py      # POST /api/entry
│   └── tests/
│       └── test_api.py
└── frontend/
    └── src/
        ├── pages/         # Overview, CentreDetail, Alerts, Redistribution, DataEntry
        ├── components/    # Navbar, HealthMap, KPICard, SeverityBadge, …
        └── i18n/          # en.json, hi.json
```

---

## Features

| Feature | Detail |
|---|---|
| **30 Centres** | Real PHC/CHC names in Chhattisgarh with coordinates |
| **60-day history** | Stock, footfall, beds, attendance, tests |
| **Stock-out alerts** | Critical (<3 days), Warning (<7 days) |
| **Demand forecast** | Holt ETS with 7-day MA fallback, returns `method` field |
| **Redistribution** | Greedy haversine matching; donor retains ≥7 days stock |
| **Performance flags** | Score 0-100 based on stock-outs, absence, beds, tests |
| **District summary** | Template text in English and Hindi |
| **Bilingual UI** | Full i18next en/hi toggle in navbar |
| **Map** | CircleMarkers (red/amber/green), works without tiles |
| **Data entry** | Daily form for PHC staff |

---

## Running Tests

```bash
cd backend
python -m pytest tests/test_api.py -v
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/centres` | All centres with status |
| GET | `/api/centres/{id}` | Centre detail + 60-day history |
| GET | `/api/stock/alerts` | Stock-out warnings |
| POST | `/api/stock/entry` | Add stock record |
| GET | `/api/forecast/{id}` | 14-day forecast |
| GET | `/api/redistribution` | Transfer recommendations |
| GET | `/api/flags` | Flagged/scored centres |
| GET | `/api/summary` | District summary (en + hi) |
| POST | `/api/entry` | Daily data entry form |

---

## Data Notes

- **Planted problems:** Centres 3, 8, 15, 20, 27 have chronic stock-outs; centres 4, 12, 21, 28 have high doctor absence; CHC centres 6, 9, 13, 17, 25 have full beds.
- **Forecast method:** Simple/Holt ETS (no seasonality). Falls back to 7-day moving average if <14 data points or model fails. All forecasts clipped to ≥0.
- **Redistribution safety:** Transfer quantity limited so donor retains ≥7 days cover post-transfer.
