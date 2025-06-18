from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, Float, DateTime, String
from datetime import datetime

Base = declarative_base()

class MusselData(Base):
    __tablename__ = "mussel_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    od_value = Column(Float)
    pump_speed = Column(Float)

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    target_temp = Column(Float, default=25.0)
    lamp_state = Column(String, default="OFF")  # "ON" or "OFF"
    pid_p = Column(Float, default=0.0)
    pid_i = Column(Float, default=0.0)
    pid_d = Column(Float, default=0.0)
