from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date
import calendar

from database import get_db
from models import MonthlyEntry, DailyEntry, Wallet
from schemas import (
    MonthlyEntryCreate, MonthlyEntryUpdate, MonthlyEntryResponse,
    DailyEntryCreate, DailyEntryUpdate, DailyEntryResponse,
    MonthlyDelta, YearlySummary, DailySnapshot, BulkMonthlyEntry
)

router = APIRouter(prefix="/api", tags=["entries"])

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


# ============ Monthly Entries ============

@router.get("/monthly", response_model=List[MonthlyEntryResponse])
def get_monthly_entries(
    year: Optional[int] = None,
    wallet_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get monthly entries with optional filters."""
    query = db.query(MonthlyEntry)

    if year:
        query = query.filter(MonthlyEntry.year == year)
    if wallet_id:
        query = query.filter(MonthlyEntry.wallet_id == wallet_id)

    return query.order_by(MonthlyEntry.year, MonthlyEntry.month).all()


@router.get("/monthly/summary", response_model=YearlySummary)
def get_monthly_summary(year: int, db: Session = Depends(get_db)):
    """Get monthly summary with calculated deltas for a year."""
    entries = db.query(MonthlyEntry).filter(MonthlyEntry.year == year).all()
    wallets = {w.id: w.name for w in db.query(Wallet).all()}

    # Previous year December for calculating January delta
    prev_dec_entries = db.query(MonthlyEntry).filter(
        and_(MonthlyEntry.year == year - 1, MonthlyEntry.month == 12)
    ).all()
    prev_dec_total = sum(e.value_usd for e in prev_dec_entries)

    # Group entries by month
    monthly_data = {}
    for entry in entries:
        if entry.month not in monthly_data:
            monthly_data[entry.month] = {
                "total": 0,
                "btc_price": entry.btc_price,
                "wallets": {}
            }
        monthly_data[entry.month]["total"] += entry.value_usd
        wallet_name = wallets.get(entry.wallet_id, f"Wallet {entry.wallet_id}")
        monthly_data[entry.month]["wallets"][wallet_name] = entry.value_usd

    # Calculate deltas
    result_months = []
    prev_total = prev_dec_total

    for month in range(1, 13):
        if month in monthly_data:
            data = monthly_data[month]
            total = data["total"]
            delta_usd = total - prev_total if prev_total > 0 else 0
            delta_percent = (delta_usd / prev_total * 100) if prev_total > 0 else 0

            result_months.append(MonthlyDelta(
                year=year,
                month=month,
                month_name=MONTH_NAMES[month],
                total_value=total,
                delta_usd=delta_usd,
                delta_percent=round(delta_percent, 2),
                btc_price=data["btc_price"],
                wallets=data["wallets"]
            ))
            prev_total = total

    # Calculate yearly summary
    start_value = prev_dec_total if prev_dec_total > 0 else (result_months[0].total_value if result_months else 0)
    end_value = result_months[-1].total_value if result_months else 0
    yearly_delta = end_value - start_value
    yearly_percent = (yearly_delta / start_value * 100) if start_value > 0 else 0

    return YearlySummary(
        year=year,
        start_value=start_value,
        end_value=end_value,
        delta_usd=round(yearly_delta, 2),
        delta_percent=round(yearly_percent, 2),
        monthly_data=result_months
    )


@router.post("/monthly", response_model=MonthlyEntryResponse, status_code=201)
def create_monthly_entry(entry: MonthlyEntryCreate, db: Session = Depends(get_db)):
    """Create a monthly entry."""
    wallet = db.query(Wallet).filter(Wallet.id == entry.wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    existing = db.query(MonthlyEntry).filter(
        and_(
            MonthlyEntry.wallet_id == entry.wallet_id,
            MonthlyEntry.year == entry.year,
            MonthlyEntry.month == entry.month
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Entry already exists for this wallet/month")

    db_entry = MonthlyEntry(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.post("/monthly/bulk", response_model=List[MonthlyEntryResponse], status_code=201)
def create_bulk_monthly_entries(data: BulkMonthlyEntry, db: Session = Depends(get_db)):
    """Create multiple monthly entries at once for a specific month."""
    created = []

    for entry_data in data.entries:
        wallet_id = entry_data.get("wallet_id")
        value_usd = entry_data.get("value_usd")

        if wallet_id is None or value_usd is None:
            continue

        existing = db.query(MonthlyEntry).filter(
            and_(
                MonthlyEntry.wallet_id == wallet_id,
                MonthlyEntry.year == data.year,
                MonthlyEntry.month == data.month
            )
        ).first()

        if existing:
            existing.value_usd = value_usd
            if data.btc_price:
                existing.btc_price = data.btc_price
            created.append(existing)
        else:
            db_entry = MonthlyEntry(
                wallet_id=wallet_id,
                year=data.year,
                month=data.month,
                value_usd=value_usd,
                btc_price=data.btc_price
            )
            db.add(db_entry)
            created.append(db_entry)

    db.commit()
    for e in created:
        db.refresh(e)

    return created


@router.put("/monthly/{entry_id}", response_model=MonthlyEntryResponse)
def update_monthly_entry(entry_id: int, entry: MonthlyEntryUpdate, db: Session = Depends(get_db)):
    """Update a monthly entry."""
    db_entry = db.query(MonthlyEntry).filter(MonthlyEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_data = entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/monthly/{entry_id}", status_code=204)
def delete_monthly_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a monthly entry."""
    db_entry = db.query(MonthlyEntry).filter(MonthlyEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(db_entry)
    db.commit()


# ============ Daily Entries ============

@router.get("/daily", response_model=List[DailyEntryResponse])
def get_daily_entries(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    wallet_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get daily entries for a specific month."""
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    query = db.query(DailyEntry).filter(
        and_(DailyEntry.date >= start_date, DailyEntry.date <= end_date)
    )

    if wallet_id:
        query = query.filter(DailyEntry.wallet_id == wallet_id)

    return query.order_by(DailyEntry.date).all()


@router.get("/daily/snapshots", response_model=List[DailySnapshot])
def get_daily_snapshots(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    """Get daily snapshots with totals and variations for a month."""
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    entries = db.query(DailyEntry).filter(
        and_(DailyEntry.date >= start_date, DailyEntry.date <= end_date)
    ).all()

    wallets = {w.id: w.name for w in db.query(Wallet).all()}

    # Group by date
    daily_data = {}
    for entry in entries:
        d = entry.date
        if d not in daily_data:
            daily_data[d] = {"total": 0, "wallets": {}}
        daily_data[d]["total"] += entry.value_usd
        wallet_name = wallets.get(entry.wallet_id, f"Wallet {entry.wallet_id}")
        daily_data[d]["wallets"][wallet_name] = entry.value_usd

    # Calculate variations
    sorted_dates = sorted(daily_data.keys())
    snapshots = []
    prev_total = None

    for d in sorted_dates:
        data = daily_data[d]
        total = data["total"]
        delta_percent = 0

        if prev_total and prev_total > 0:
            delta_percent = ((total - prev_total) / prev_total) * 100

        snapshots.append(DailySnapshot(
            date=d,
            total_value=total,
            delta_percent=round(delta_percent, 2),
            wallets=data["wallets"]
        ))
        prev_total = total

    return snapshots


@router.post("/daily", response_model=DailyEntryResponse, status_code=201)
def create_daily_entry(entry: DailyEntryCreate, db: Session = Depends(get_db)):
    """Create a daily entry."""
    wallet = db.query(Wallet).filter(Wallet.id == entry.wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    existing = db.query(DailyEntry).filter(
        and_(
            DailyEntry.wallet_id == entry.wallet_id,
            DailyEntry.date == entry.date
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Entry already exists for this wallet/date")

    db_entry = DailyEntry(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.put("/daily/{entry_id}", response_model=DailyEntryResponse)
def update_daily_entry(entry_id: int, entry: DailyEntryUpdate, db: Session = Depends(get_db)):
    """Update a daily entry."""
    db_entry = db.query(DailyEntry).filter(DailyEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_data = entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/daily/{entry_id}", status_code=204)
def delete_daily_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a daily entry."""
    db_entry = db.query(DailyEntry).filter(DailyEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(db_entry)
    db.commit()


@router.get("/years")
def get_available_years(db: Session = Depends(get_db)):
    """Get list of years that have data."""
    monthly_years = db.query(MonthlyEntry.year).distinct().all()
    years = set(y[0] for y in monthly_years)
    return sorted(years, reverse=True)
