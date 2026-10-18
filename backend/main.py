"""
main.py - FastAPI application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import centres, stock, forecast, redistribution, flags, summary, entry


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Smart Health API",
    description="District Health Officer Management Platform for Chhattisgarh",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(centres.router)
app.include_router(stock.router)
app.include_router(forecast.router)
app.include_router(redistribution.router)
app.include_router(flags.router)
app.include_router(summary.router)
app.include_router(entry.router)


@app.get("/")
def root():
    return {"message": "Smart Health API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
