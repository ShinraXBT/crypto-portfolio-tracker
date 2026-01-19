from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Wallet(Base):
    """Wallet model - represents a crypto wallet (Solana, Degen, Rabby, etc.)"""
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), default="#3b82f6")  # Hex color for UI
    created_at = Column(DateTime, server_default=func.now())

    monthly_entries = relationship("MonthlyEntry", back_populates="wallet", cascade="all, delete-orphan")
    daily_entries = relationship("DailyEntry", back_populates="wallet", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="wallet", cascade="all, delete-orphan")


class MonthlyEntry(Base):
    """Monthly entry - tracks wallet value per month (like the 2024/2025 Excel sheet)"""
    __tablename__ = "monthly_entries"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    value_usd = Column(Float, nullable=False)
    btc_price = Column(Float, nullable=True)  # BTC price at that time
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    wallet = relationship("Wallet", back_populates="monthly_entries")


class DailyEntry(Base):
    """Daily entry - tracks wallet value per day (like the October daily sheet)"""
    __tablename__ = "daily_entries"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    date = Column(Date, nullable=False)
    value_usd = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    wallet = relationship("Wallet", back_populates="daily_entries")


class Alert(Base):
    """Alert configuration for notifications"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    alert_type = Column(String(50), nullable=False)  # 'value_threshold', 'variation_percent', 'btc_price'
    condition = Column(String(20), nullable=False)  # 'above', 'below'
    threshold = Column(Float, nullable=False)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=True)  # NULL = global alert
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    wallet = relationship("Wallet", back_populates="alerts")


class PriceHistory(Base):
    """Cache for crypto price history"""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False)  # 'BTC', 'ETH'
    date = Column(Date, nullable=False)
    price_usd = Column(Float, nullable=False)
