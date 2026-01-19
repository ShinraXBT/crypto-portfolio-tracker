from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Wallet
from schemas import WalletCreate, WalletUpdate, WalletResponse

router = APIRouter(prefix="/api/wallets", tags=["wallets"])


@router.get("", response_model=List[WalletResponse])
def get_wallets(db: Session = Depends(get_db)):
    """Get all wallets."""
    return db.query(Wallet).order_by(Wallet.name).all()


@router.get("/{wallet_id}", response_model=WalletResponse)
def get_wallet(wallet_id: int, db: Session = Depends(get_db)):
    """Get a specific wallet by ID."""
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.post("", response_model=WalletResponse, status_code=201)
def create_wallet(wallet: WalletCreate, db: Session = Depends(get_db)):
    """Create a new wallet."""
    existing = db.query(Wallet).filter(Wallet.name == wallet.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Wallet with this name already exists")

    db_wallet = Wallet(**wallet.model_dump())
    db.add(db_wallet)
    db.commit()
    db.refresh(db_wallet)
    return db_wallet


@router.put("/{wallet_id}", response_model=WalletResponse)
def update_wallet(wallet_id: int, wallet: WalletUpdate, db: Session = Depends(get_db)):
    """Update a wallet."""
    db_wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if not db_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    update_data = wallet.model_dump(exclude_unset=True)

    if "name" in update_data:
        existing = db.query(Wallet).filter(
            Wallet.name == update_data["name"],
            Wallet.id != wallet_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Wallet with this name already exists")

    for key, value in update_data.items():
        setattr(db_wallet, key, value)

    db.commit()
    db.refresh(db_wallet)
    return db_wallet


@router.delete("/{wallet_id}", status_code=204)
def delete_wallet(wallet_id: int, db: Session = Depends(get_db)):
    """Delete a wallet and all its entries."""
    db_wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    if not db_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    db.delete(db_wallet)
    db.commit()
