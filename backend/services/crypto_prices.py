import httpx
from typing import Optional
from datetime import date


class CryptoPriceService:
    """Service for fetching cryptocurrency prices from CoinGecko API."""

    BASE_URL = "https://api.coingecko.com/api/v3"

    COIN_IDS = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "SOL": "solana",
        "TRX": "tron"
    }

    async def get_current_price(self, symbol: str) -> Optional[dict]:
        """Get current price for a cryptocurrency."""
        coin_id = self.COIN_IDS.get(symbol.upper())
        if not coin_id:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/simple/price",
                    params={
                        "ids": coin_id,
                        "vs_currencies": "usd",
                        "include_24hr_change": "true"
                    }
                )
                response.raise_for_status()
                data = response.json()

                if coin_id in data:
                    return {
                        "symbol": symbol.upper(),
                        "price_usd": data[coin_id]["usd"],
                        "change_24h": data[coin_id].get("usd_24h_change")
                    }
        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")

        return None

    async def get_multiple_prices(self, symbols: list[str]) -> dict:
        """Get current prices for multiple cryptocurrencies."""
        coin_ids = [self.COIN_IDS.get(s.upper()) for s in symbols if s.upper() in self.COIN_IDS]
        if not coin_ids:
            return {}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/simple/price",
                    params={
                        "ids": ",".join(coin_ids),
                        "vs_currencies": "usd",
                        "include_24hr_change": "true"
                    }
                )
                response.raise_for_status()
                data = response.json()

                result = {}
                for symbol, coin_id in self.COIN_IDS.items():
                    if coin_id in data:
                        result[symbol] = {
                            "price_usd": data[coin_id]["usd"],
                            "change_24h": data[coin_id].get("usd_24h_change")
                        }
                return result
        except Exception as e:
            print(f"Error fetching prices: {e}")

        return {}

    async def get_price_history(self, symbol: str, days: int = 30) -> Optional[list]:
        """Get price history for a cryptocurrency."""
        coin_id = self.COIN_IDS.get(symbol.upper())
        if not coin_id:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/coins/{coin_id}/market_chart",
                    params={
                        "vs_currency": "usd",
                        "days": days
                    }
                )
                response.raise_for_status()
                data = response.json()

                # Convert timestamps to dates and prices
                prices = []
                for timestamp, price in data.get("prices", []):
                    d = date.fromtimestamp(timestamp / 1000)
                    prices.append({
                        "date": d.isoformat(),
                        "price_usd": round(price, 2)
                    })

                return prices
        except Exception as e:
            print(f"Error fetching price history for {symbol}: {e}")

        return None


# Singleton instance
price_service = CryptoPriceService()
