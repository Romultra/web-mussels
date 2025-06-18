from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal
from models import MusselData, SystemSettings
from datetime import datetime
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

class SettingsUpdate(BaseModel):
    target_temp: float
    lamp_state: str  # "ON" or "OFF"
    pid_p: float
    pid_i: float
    pid_d: float

@app.get("/")
def read_root():
    return {"message": "Mussel backend is running"}

@app.get("/data")
def get_data(from_time: Optional[str] = Query(None)):
    session = SessionLocal()
    query = session.query(MusselData)
    if from_time:
        try:
            dt = datetime.fromisoformat(from_time)
            query = query.filter(MusselData.timestamp >= dt)
        except Exception:
            pass  # Ignore invalid date
    data = query.order_by(MusselData.timestamp.desc()).limit(1000).all()
    session.close()
    return [
        {
            "timestamp": d.timestamp.isoformat(),
            "temperature": d.temperature,
            "od_value": d.od_value,
            "pump_speed": d.pump_speed,
        }
        for d in reversed(data)
    ]

@app.get("/settings")
def get_settings():
    db = SessionLocal()
    settings = db.query(SystemSettings).order_by(SystemSettings.timestamp.desc()).first()
    db.close()
    if not settings:
        # Return default values if no settings saved yet
        return {
            "target_temp": 25.0,
            "lamp_state": "OFF",
            "pid_p": 0.0,
            "pid_i": 0.0,
            "pid_d": 0.0,
        }
    return {
        "target_temp": settings.target_temp,
        "lamp_state": settings.lamp_state,
        "pid_p": settings.pid_p,
        "pid_i": settings.pid_i,
        "pid_d": settings.pid_d,
    }

@app.post("/settings")
def update_settings(update: SettingsUpdate):
    db = SessionLocal()
    new_settings = SystemSettings(
        target_temp=update.target_temp,
        lamp_state=update.lamp_state,
        pid_p=update.pid_p,
        pid_i=update.pid_i,
        pid_d=update.pid_d,
        timestamp=datetime.utcnow(),
    )
    db.add(new_settings)
    db.commit()
    db.close()
    return {"message": "Settings updated successfully"}
