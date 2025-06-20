from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, Float, DateTime, String
from datetime import datetime, timezone

Base = declarative_base()

class MusselData(Base):
    __tablename__ = "mussel_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    temperature = Column(Float)
    od_value = Column(Float)
    pump_speed = Column(Float)
    target_temp = Column(Float)  # Added target temperature
    pid_p = Column(Float)        # Added PID P value
    pid_i = Column(Float)        # Added PID I value
    pid_d = Column(Float)        # Added PID D value
    lamp_state = Column(String, default="OFF")  # Added lamp state

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    target_temp = Column(Float, default=25.0)
    lamp_state = Column(String, default="OFF")  # "ON" or "OFF"
    pid_p = Column(Float, default=0.0)
    pid_i = Column(Float, default=0.0)
    pid_d = Column(Float, default=0.0)

class CommandLog(Base):
    __tablename__ = "command_log"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    command = Column(String)  # JSON string of the command sent
