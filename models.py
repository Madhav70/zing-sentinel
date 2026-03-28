from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    transfers = relationship("TransferRecord", back_populates="sender")

class TransferRecord(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_name = Column(String)
    amount = Column(Float, index=True)
    from_country = Column(String, index=True)
    to_country = Column(String, index=True)
    exchange_rate = Column(Float)
    fee = Column(Float)
    amount_received = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", back_populates="transfers")

class LocationLog(Base):
    __tablename__ = "location_logs"

    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lon = Column(Float)
    acc = Column(Integer)
    city = Column(String)
    country = Column(String)
    isp = Column(String)
    status = Column(String) # Verified vs Approximate
    user_agent = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
