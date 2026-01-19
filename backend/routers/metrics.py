from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, timedelta

from database import get_db
from models import MonthlyEntry, DailyEntry, PriceHistory
from schemas import PortfolioMetrics

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


def get_total_value_at_date(db: Session, target_date: date) -> Optional[float]:
    """Get total portfolio value at a specific date from daily entries."""
    entries = db.query(DailyEntry).filter(DailyEntry.date == target_date).all()
    if entries:
        return sum(e.value_usd for e in entries)
    return None


def get_total_value_at_month(db: Session, year: int, month: int) -> Optional[float]:
    """Get total portfolio value for a specific month."""
    entries = db.query(MonthlyEntry).filter(
        MonthlyEntry.year == year,
        MonthlyEntry.month == month
    ).all()
    if entries:
        return sum(e.value_usd for e in entries)
    return None


def get_btc_price_at_month(db: Session, year: int, month: int) -> Optional[float]:
    """Get BTC price for a specific month."""
    entry = db.query(MonthlyEntry).filter(
        MonthlyEntry.year == year,
        MonthlyEntry.month == month,
        MonthlyEntry.btc_price.isnot(None)
    ).first()
    return entry.btc_price if entry else None


@router.get("/summary", response_model=PortfolioMetrics)
def get_portfolio_metrics(
    initial_investment: float = Query(default=0, description="Initial investment for ROI calculation"),
    db: Session = Depends(get_db)
):
    """Get overall portfolio metrics including ROI, drawdown, and BTC comparison."""

    # Get all monthly entries ordered by date
    monthly_entries = db.query(
        MonthlyEntry.year,
        MonthlyEntry.month,
        func.sum(MonthlyEntry.value_usd).label('total')
    ).group_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).order_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).all()

    if not monthly_entries:
        return PortfolioMetrics(
            current_value=0,
            ath_value=0,
            ath_date=None,
            roi_percent=0,
            drawdown_percent=0,
            btc_comparison_percent=0,
            variation_24h=None,
            variation_30d=None
        )

    # Current value (latest month)
    current_value = monthly_entries[-1].total

    # Find ATH (All-Time High)
    ath_value = 0
    ath_year = None
    ath_month = None

    for entry in monthly_entries:
        if entry.total > ath_value:
            ath_value = entry.total
            ath_year = entry.year
            ath_month = entry.month

    ath_date = date(ath_year, ath_month, 1) if ath_year and ath_month else None

    # Calculate ROI
    roi_percent = 0
    if initial_investment > 0:
        roi_percent = ((current_value - initial_investment) / initial_investment) * 100

    # Calculate Drawdown from ATH
    drawdown_percent = 0
    if ath_value > 0:
        drawdown_percent = ((current_value - ath_value) / ath_value) * 100

    # Calculate 30-day variation from monthly data
    variation_30d = None
    if len(monthly_entries) >= 2:
        prev_value = monthly_entries[-2].total
        if prev_value > 0:
            variation_30d = ((current_value - prev_value) / prev_value) * 100

    # BTC Comparison - how would holding BTC have performed?
    btc_comparison = 0
    if len(monthly_entries) >= 2:
        first_year, first_month = monthly_entries[0].year, monthly_entries[0].month
        last_year, last_month = monthly_entries[-1].year, monthly_entries[-1].month

        first_btc = get_btc_price_at_month(db, first_year, first_month)
        last_btc = get_btc_price_at_month(db, last_year, last_month)

        if first_btc and last_btc and first_btc > 0:
            btc_performance = ((last_btc - first_btc) / first_btc) * 100

            first_portfolio = monthly_entries[0].total
            if first_portfolio > 0:
                portfolio_performance = ((current_value - first_portfolio) / first_portfolio) * 100
                btc_comparison = portfolio_performance - btc_performance

    # Try to get 24h variation from daily entries
    variation_24h = None
    today = date.today()
    yesterday = today - timedelta(days=1)

    today_value = get_total_value_at_date(db, today)
    yesterday_value = get_total_value_at_date(db, yesterday)

    if today_value and yesterday_value and yesterday_value > 0:
        variation_24h = ((today_value - yesterday_value) / yesterday_value) * 100

    return PortfolioMetrics(
        current_value=round(current_value, 2),
        ath_value=round(ath_value, 2),
        ath_date=ath_date,
        roi_percent=round(roi_percent, 2),
        drawdown_percent=round(drawdown_percent, 2),
        btc_comparison_percent=round(btc_comparison, 2),
        variation_24h=round(variation_24h, 2) if variation_24h else None,
        variation_30d=round(variation_30d, 2) if variation_30d else None
    )


@router.get("/roi")
def get_roi_details(
    initial_investment: float = Query(..., description="Initial investment amount"),
    db: Session = Depends(get_db)
):
    """Get detailed ROI breakdown."""
    monthly_entries = db.query(
        MonthlyEntry.year,
        MonthlyEntry.month,
        func.sum(MonthlyEntry.value_usd).label('total')
    ).group_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).order_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).all()

    if not monthly_entries:
        return {"error": "No data available"}

    current_value = monthly_entries[-1].total
    profit_loss = current_value - initial_investment
    roi_percent = (profit_loss / initial_investment * 100) if initial_investment > 0 else 0

    # Calculate annualized ROI
    months_count = len(monthly_entries)
    years = months_count / 12
    annualized_roi = 0
    if years > 0 and initial_investment > 0:
        annualized_roi = ((current_value / initial_investment) ** (1 / years) - 1) * 100

    return {
        "initial_investment": initial_investment,
        "current_value": round(current_value, 2),
        "profit_loss": round(profit_loss, 2),
        "roi_percent": round(roi_percent, 2),
        "annualized_roi_percent": round(annualized_roi, 2),
        "months_tracked": months_count
    }


@router.get("/drawdown")
def get_drawdown_analysis(db: Session = Depends(get_db)):
    """Get detailed drawdown analysis."""
    monthly_entries = db.query(
        MonthlyEntry.year,
        MonthlyEntry.month,
        func.sum(MonthlyEntry.value_usd).label('total')
    ).group_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).order_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).all()

    if not monthly_entries:
        return {"error": "No data available"}

    # Track running ATH and drawdowns
    running_ath = 0
    max_drawdown = 0
    max_drawdown_from = None
    max_drawdown_to = None
    current_drawdown = 0

    drawdown_history = []

    for entry in monthly_entries:
        value = entry.total

        if value > running_ath:
            running_ath = value

        if running_ath > 0:
            current_drawdown = ((value - running_ath) / running_ath) * 100

        drawdown_history.append({
            "year": entry.year,
            "month": entry.month,
            "value": round(value, 2),
            "ath": round(running_ath, 2),
            "drawdown_percent": round(current_drawdown, 2)
        })

        if current_drawdown < max_drawdown:
            max_drawdown = current_drawdown
            max_drawdown_to = f"{entry.year}-{entry.month:02d}"

    return {
        "current_drawdown_percent": round(current_drawdown, 2),
        "max_drawdown_percent": round(max_drawdown, 2),
        "current_ath": round(running_ath, 2),
        "history": drawdown_history
    }


@router.get("/vs-btc")
def get_btc_comparison(db: Session = Depends(get_db)):
    """Compare portfolio performance vs holding BTC."""
    monthly_entries = db.query(
        MonthlyEntry.year,
        MonthlyEntry.month,
        func.sum(MonthlyEntry.value_usd).label('total')
    ).group_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).order_by(
        MonthlyEntry.year, MonthlyEntry.month
    ).all()

    if len(monthly_entries) < 2:
        return {"error": "Not enough data for comparison"}

    comparison_data = []

    first_portfolio = monthly_entries[0].total
    first_btc = get_btc_price_at_month(db, monthly_entries[0].year, monthly_entries[0].month)

    if not first_btc:
        return {"error": "No BTC price data available"}

    # How much BTC could we have bought with the initial portfolio value?
    btc_amount = first_portfolio / first_btc

    for entry in monthly_entries:
        btc_price = get_btc_price_at_month(db, entry.year, entry.month)

        portfolio_perf = ((entry.total - first_portfolio) / first_portfolio * 100) if first_portfolio > 0 else 0

        btc_perf = 0
        btc_value = 0
        if btc_price and first_btc > 0:
            btc_perf = ((btc_price - first_btc) / first_btc * 100)
            btc_value = btc_amount * btc_price

        comparison_data.append({
            "year": entry.year,
            "month": entry.month,
            "portfolio_value": round(entry.total, 2),
            "portfolio_perf_percent": round(portfolio_perf, 2),
            "btc_value": round(btc_value, 2),
            "btc_perf_percent": round(btc_perf, 2),
            "outperformance": round(portfolio_perf - btc_perf, 2)
        })

    latest = comparison_data[-1] if comparison_data else {}

    return {
        "initial_portfolio_value": round(first_portfolio, 2),
        "initial_btc_price": round(first_btc, 2),
        "btc_amount_equivalent": round(btc_amount, 8),
        "current_outperformance_percent": latest.get("outperformance", 0),
        "history": comparison_data
    }
