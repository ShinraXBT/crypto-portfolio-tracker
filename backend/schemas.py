from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ============ Wallet Schemas ============
class WalletBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(default="#3b82f6", pattern="^#[0-9A-Fa-f]{6}$")


class WalletCreate(WalletBase):
    pass


class WalletUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class WalletResponse(WalletBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Monthly Entry Schemas ============
class MonthlyEntryBase(BaseModel):
    wallet_id: int
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    value_usd: float = Field(..., ge=0)
    btc_price: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class MonthlyEntryCreate(MonthlyEntryBase):
    pass


class MonthlyEntryUpdate(BaseModel):
    value_usd: Optional[float] = Field(None, ge=0)
    btc_price: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class MonthlyEntryResponse(MonthlyEntryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MonthlyEntryWithWallet(MonthlyEntryResponse):
    wallet: WalletResponse


# ============ Daily Entry Schemas ============
class DailyEntryBase(BaseModel):
    wallet_id: int
    date: date
    value_usd: float = Field(..., ge=0)
    notes: Optional[str] = None


class DailyEntryCreate(DailyEntryBase):
    pass


class DailyEntryUpdate(BaseModel):
    value_usd: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class DailyEntryResponse(DailyEntryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DailyEntryWithWallet(DailyEntryResponse):
    wallet: WalletResponse


# ============ Alert Schemas ============
class AlertBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    alert_type: str = Field(..., pattern="^(value_threshold|variation_percent|btc_price)$")
    condition: str = Field(..., pattern="^(above|below)$")
    threshold: float
    wallet_id: Optional[int] = None
    is_active: bool = True


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    alert_type: Optional[str] = Field(None, pattern="^(value_threshold|variation_percent|btc_price)$")
    condition: Optional[str] = Field(None, pattern="^(above|below)$")
    threshold: Optional[float] = None
    is_active: Optional[bool] = None


class AlertResponse(AlertBase):
    id: int
    triggered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Metrics Schemas ============
class MonthlyDelta(BaseModel):
    """Monthly data with calculated deltas"""
    year: int
    month: int
    month_name: str
    total_value: float
    delta_usd: float
    delta_percent: float
    btc_price: Optional[float]
    wallets: dict[str, float]  # wallet_name -> value


class YearlySummary(BaseModel):
    """Yearly summary with totals"""
    year: int
    start_value: float
    end_value: float
    delta_usd: float
    delta_percent: float
    monthly_data: List[MonthlyDelta]


class DailySnapshot(BaseModel):
    """Daily snapshot for a specific date"""
    date: date
    total_value: float
    delta_percent: float
    wallets: dict[str, float]


class PortfolioMetrics(BaseModel):
    """Overall portfolio metrics"""
    current_value: float
    ath_value: float
    ath_date: Optional[date]
    roi_percent: float
    drawdown_percent: float
    btc_comparison_percent: float  # Performance vs holding BTC
    variation_24h: Optional[float]
    variation_30d: Optional[float]


class PriceData(BaseModel):
    """Crypto price data"""
    symbol: str
    price_usd: float
    change_24h: Optional[float]


# ============ Bulk Operations ============
class BulkMonthlyEntry(BaseModel):
    """For adding multiple entries at once"""
    year: int
    month: int
    btc_price: Optional[float] = None
    entries: List[dict]  # [{wallet_id: X, value_usd: Y}, ...]
