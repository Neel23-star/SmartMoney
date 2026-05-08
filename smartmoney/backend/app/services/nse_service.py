import httpx, logging
from datetime import date

logger = logging.getLogger(__name__)

NSE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.nseindia.com/",
}

BULK_DEAL_URL = "https://www.nseindia.com/api/bulk-deals"
BLOCK_DEAL_URL = "https://www.nseindia.com/api/block-deals"


def _get_session():
    """Get a session with NSE cookies."""
    client = httpx.Client(headers=NSE_HEADERS, timeout=15, follow_redirects=True)
    # Visit homepage first to get cookies
    try:
        client.get("https://www.nseindia.com")
    except Exception:
        pass
    return client


def fetch_bulk_deals() -> list[dict]:
    """Fetch today's bulk deals from NSE."""
    try:
        client = _get_session()
        resp = client.get(BULK_DEAL_URL, headers=NSE_HEADERS)
        resp.raise_for_status()
        data = resp.json()
        deals = data.get("data", [])
        result = []
        for d in deals:
            result.append({
                "symbol": d.get("symbol", ""),
                "client": d.get("clientName", ""),
                "buy_sell": d.get("buySell", ""),
                "qty": d.get("quantityTraded", 0),
                "price": d.get("tradePrice", 0),
                "source_url": f"https://www.nseindia.com/market-data/bulk-deal-archives",
                "deal_type": "BULK",
            })
        logger.info(f"Fetched {len(result)} bulk deals")
        return result
    except Exception as e:
        logger.error(f"Bulk deal fetch error: {e}")
        return []


def fetch_block_deals() -> list[dict]:
    """Fetch today's block deals from NSE."""
    try:
        client = _get_session()
        resp = client.get(BLOCK_DEAL_URL, headers=NSE_HEADERS)
        resp.raise_for_status()
        data = resp.json()
        deals = data.get("data", [])
        result = []
        for d in deals:
            result.append({
                "symbol": d.get("symbol", ""),
                "client": d.get("clientName", ""),
                "buy_sell": d.get("buySell", ""),
                "qty": d.get("quantityTraded", 0),
                "price": d.get("tradePrice", 0),
                "source_url": f"https://www.nseindia.com/market-data/block-deal-archives",
                "deal_type": "BLOCK",
            })
        logger.info(f"Fetched {len(result)} block deals")
        return result
    except Exception as e:
        logger.error(f"Block deal fetch error: {e}")
        return []
