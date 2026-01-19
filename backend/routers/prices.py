from fastapi import APIRouter, Query
from typing import Optional
from services.crypto_prices import price_service

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("/current")
async def get_current_prices(
    symbols: str = Query(default="BTC,ETH", description="Comma-separated list of symbols")
):
    """Get current prices for cryptocurrencies."""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    prices = await price_service.get_multiple_prices(symbol_list)
    return prices


@router.get("/current/{symbol}")
async def get_current_price(symbol: str):
    """Get current price for a specific cryptocurrency."""
    price = await price_service.get_current_price(symbol)
    if not price:
        return {"error": f"Price not available for {symbol}"}
    return price


@router.get("/history/{symbol}")
async def get_price_history(
    symbol: str,
    days: int = Query(default=30, ge=1, le=365)
):
    """Get price history for a cryptocurrency."""
    history = await price_service.get_price_history(symbol, days)
    if not history:
        return {"error": f"History not available for {symbol}"}
    return {
        "symbol": symbol.upper(),
        "days": days,
        "prices": history
    }
