from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.database import Base

class Zone(Base):
    __tablename__ = "zones"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    state = Column(String)
    risk_level = Column(String)
    score = Column(Integer)
    lat = Column(Float)
    lng = Column(Float)
    description = Column(String)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    zone_name = Column(String)
    severity = Column(String)
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Sensor(Base):
    __tablename__ = "sensors"
    id = Column(Integer, primary_key=True)
    sensor_id = Column(String, unique=True)
    location = Column(String)
    state = Column(String)
    sensor_type = Column(String)
    status = Column(String)
    last_reading = Column(String)
    battery = Column(Integer)