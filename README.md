# Smart Health – District Health Officer Platform

A bilingual (English + Hindi) web platform for Chhattisgarh district health officers to manage PHCs and CHCs.

**Stack:** FastAPI + SQLite · React + Vite + Tailwind · Recharts · react-leaflet · i18next  
**Note:** No paid APIs, no external services except OpenStreetMap tiles (© OpenStreetMap contributors). Map markers are visible even without internet connectivity.

---

## Single-Service Production Run (FastAPI serves React SPA)

The application is configured as a single unified service: FastAPI serves the compiled React frontend (`frontend/dist`) as static files with SPA catch-all routing, and provides all `/api` endpoints. The SQLite database is automatically initialized and seeded on startup if empty.

```bash
# 1. Build frontend
cd frontend
npm install
npm run build
cd ..

# 2. Run backend (serves both API and UI)
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

- App & Dashboard UI: **http://localhost:8000**
- Health Check: **http://localhost:8000/api/health**
- API Documentation (Swagger): **http://localhost:8000/docs**

---

## Render Deployment (Free Tier)

A `render.yaml` configuration is included at the repository root for one-click deployment:

- **Service Type:** Web Service
- **Environment:** Python
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Automatic DB Seeding:** Handled by FastAPI lifespan on startup if the database is empty.

---

## Local Development (Optional Dual-Server)

### Backend
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (with Vite Hot-Reloading)
```bash
cd frontend
npm install
npm run dev
```
(Vite proxies `/api` requests to `http://localhost:8000`)

---

## Project Structure

```
Smart_Health/
├── render.yaml            # Render blueprint deployment config
├── README.md
├── backend/
│   ├── main.py            # FastAPI app (serves /api and frontend/dist SPA)
│   ├── database.py        # SQLAlchemy models
│   ├── seed.py            # Deterministic seed (30 centres × 60 days, auto-seed)
│   ├── requirements.txt   # Pinned dependencies
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
│       └── test_api.py   # Pytest test suite (12 tests)
└── frontend/
    ├── dist/              # Production build served by FastAPI
    └── src/
        ├── pages/         # Overview, CentreDetail, Alerts, Redistribution, DataEntry
        ├── components/    # Sidebar, Header, HealthMap, KPICard, SeverityBadge, …
        └── i18n/          # en.json, hi.json (bilingual toggle)
```

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
| GET | `/api/health` | Service health check |
| GET | `/api/centres` | All centres with status and marker colors |
| GET | `/api/centres/{id}` | Centre detail + 60-day historical time-series |
| GET | `/api/stock/alerts` | Stock-out warnings sorted by severity |
| POST | `/api/stock/entry` | Add stock record |
| GET | `/api/forecast/{id}` | 14-day footfall & medicine demand forecast |
| GET | `/api/redistribution` | Inter-facility transfer recommendations |
| GET | `/api/flags` | Flagged underperforming centres with reasons |
| GET | `/api/summary` | District executive summary (English and Hindi) |
| POST | `/api/entry` | Daily operational data entry form |
