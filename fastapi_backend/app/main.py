import os
import csv
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from .prophet_engine import run_prophet_forecast, CashFlowRecord, ForecastSummary
from .gemini_advisor import run_cfo_simulation, run_cfo_chat

load_dotenv()

app = FastAPI(
    title="Prophet Cash Flow Forecaster & AI CFO API",
    description="FastAPI Backend for 30-day Prophet time-series cash flow forecasting, deficit diagnosis, and Gemini AI strategic advisory.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_default_csv_records() -> List[CashFlowRecord]:
    # Check parent public folder or data folder
    csv_candidates = [
        os.path.join(os.path.dirname(__file__), "../../public/cash_flow_history.csv"),
        os.path.join(os.path.dirname(__file__), "../data/cash_flow_history.csv"),
        "public/cash_flow_history.csv",
    ]
    for path in csv_candidates:
        if os.path.exists(path):
            records = []
            with open(path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(CashFlowRecord(
                        date=row["date"],
                        cash_in=float(row["cash_in"]),
                        cash_out=float(row["cash_out"])
                    ))
            return records

    # Fallback synthetic 60 days
    from datetime import datetime, timedelta
    records = []
    base_date = datetime.now() - timedelta(days=60)
    for i in range(60):
        dt = base_date + timedelta(days=i)
        is_payroll = (dt.weekday() == 4 and (i // 7) % 2 == 0)
        records.append(CashFlowRecord(
            date=dt.strftime("%Y-%m-%d"),
            cash_in=1800.0 if dt.weekday() < 5 else 0.0,
            cash_out=12000.0 if is_payroll else (1200.0 if dt.weekday() < 5 else 150.0)
        ))
    return records


class ForecastRequest(BaseModel):
    starting_balance: float = 15000.0
    records: Optional[List[CashFlowRecord]] = None
    horizon_days: int = 30

class SimulationRequest(BaseModel):
    scenario: str
    forecast_summary: ForecastSummary

class ChatRequest(BaseModel):
    message: str
    forecast_summary: Optional[ForecastSummary] = None
    history: List[Dict[str, str]] = []


@app.get("/api/health")
def health_check():
    has_key = bool(os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "framework": "FastAPI",
        "model_type": "Facebook Prophet Additive Forecaster",
        "llm_provider": "Google Gemini (gemini-2.5-flash)",
        "has_gemini_key": has_key
    }


@app.post("/api/forecast", response_model=ForecastSummary)
def forecast_cash_flow(req: ForecastRequest):
    try:
        active_records = req.records if (req.records and len(req.records) >= 5) else load_default_csv_records()
        return run_prophet_forecast(
            records=active_records,
            starting_balance=req.starting_balance,
            horizon_len=req.horizon_days
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulate")
def simulate_strategy(req: SimulationRequest):
    try:
        return run_cfo_simulation(req.scenario, req.forecast_summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
def chat_with_cfo(req: ChatRequest):
    try:
        return run_cfo_chat(req.message, req.forecast_summary, req.history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files and frontend SPA fallback so FastAPI serves the entire UI directly
dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../dist")),
    os.path.abspath("dist"),
]
dist_path = None
for candidate in dist_candidates:
    if os.path.exists(candidate) and os.path.isdir(candidate):
        dist_path = candidate
        break

if dist_path:
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build files not found"}

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes or documentation
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build files not found"}


