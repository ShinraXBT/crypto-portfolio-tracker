from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Alert, Wallet, MonthlyEntry, DailyEntry
from schemas import AlertCreate, AlertUpdate, AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all alerts."""
    query = db.query(Alert)
    if active_only:
        query = query.filter(Alert.is_active == True)
    return query.order_by(Alert.created_at.desc()).all()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get a specific alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("", response_model=AlertResponse, status_code=201)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Create a new alert."""
    if alert.wallet_id:
        wallet = db.query(Wallet).filter(Wallet.id == alert.wallet_id).first()
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

    db_alert = Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(alert_id: int, alert: AlertUpdate, db: Session = Depends(get_db)):
    """Update an alert."""
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = alert.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_alert, key, value)

    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert."""
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(db_alert)
    db.commit()


@router.post("/{alert_id}/reset", response_model=AlertResponse)
def reset_alert(alert_id: int, db: Session = Depends(get_db)):
    """Reset an alert (clear triggered_at)."""
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db_alert.triggered_at = None
    db_alert.is_active = True
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.get("/check/all")
def check_alerts(
    current_portfolio_value: float,
    current_btc_price: Optional[float] = None,
    variation_24h: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Check all active alerts and return triggered ones."""
    alerts = db.query(Alert).filter(Alert.is_active == True).all()
    triggered = []

    for alert in alerts:
        is_triggered = False
        current_value = None

        if alert.alert_type == "value_threshold":
            if alert.wallet_id:
                # Get latest value for specific wallet
                latest = db.query(MonthlyEntry).filter(
                    MonthlyEntry.wallet_id == alert.wallet_id
                ).order_by(MonthlyEntry.year.desc(), MonthlyEntry.month.desc()).first()
                current_value = latest.value_usd if latest else None
            else:
                current_value = current_portfolio_value

            if current_value is not None:
                if alert.condition == "above" and current_value >= alert.threshold:
                    is_triggered = True
                elif alert.condition == "below" and current_value <= alert.threshold:
                    is_triggered = True

        elif alert.alert_type == "variation_percent" and variation_24h is not None:
            if alert.condition == "above" and variation_24h >= alert.threshold:
                is_triggered = True
            elif alert.condition == "below" and variation_24h <= alert.threshold:
                is_triggered = True

        elif alert.alert_type == "btc_price" and current_btc_price is not None:
            if alert.condition == "above" and current_btc_price >= alert.threshold:
                is_triggered = True
            elif alert.condition == "below" and current_btc_price <= alert.threshold:
                is_triggered = True

        if is_triggered:
            alert.triggered_at = datetime.utcnow()
            triggered.append({
                "id": alert.id,
                "name": alert.name,
                "alert_type": alert.alert_type,
                "condition": alert.condition,
                "threshold": alert.threshold,
                "current_value": current_value or current_btc_price or variation_24h,
                "triggered_at": alert.triggered_at
            })

    db.commit()

    return {
        "triggered_count": len(triggered),
        "alerts": triggered
    }
