from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

engine = create_engine("sqlite:///mussels.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

# Create tables if not exists
Base.metadata.create_all(bind=engine)
