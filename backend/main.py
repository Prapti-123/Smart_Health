"""
main.py - FastAPI application entry point
Serves API routes and frontend/dist SPA for single-service deployment
"""
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db
from routers import centres, stock, forecast, redistribution, flags, summary, entry

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        from seed import seed_if_empty
        seed_if_empty()
    except Exception as e:
        print(f"Warning during auto-seed: {e}")
    yield


app = FastAPI(
    title="Smart Health API",
    description="District Health Officer Management Platform for Chhattisgarh",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(centres.router)
app.include_router(stock.router)
app.include_router(forecast.router)
app.include_router(redistribution.router)
app.include_router(flags.router)
app.include_router(summary.router)
app.include_router(entry.router)


@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok"}


# Mount static assets if build directory exists
assets_dir = DIST_DIR / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/")
async def serve_root():
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Smart Health API is running", "docs": "/docs"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Protect API namespace
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")

    # Check if file exists directly under dist (e.g. vite.svg, favicon)
    file_path = (DIST_DIR / full_path).resolve()
    if file_path.is_file() and str(file_path).startswith(str(DIST_DIR.resolve())):
        return FileResponse(file_path)

    # Return index.html for client-side routing
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    return {"message": "Frontend build not found. Please run npm run build."}
