from fastapi import APIRouter, HTTPException
from ..services.signal_ranker import build_signals, get_cached_signals
from ..database import get_conn, init_db

router = APIRouter(prefix="/api", tags=["signals"])


@router.get("/signals")
def list_signals(refresh: bool = False):
    """
    Return top signals.
    Add ?refresh=true to force a fresh fetch from NSE + yfinance.
    """
    if refresh:
        signals = build_signals()
    else:
        signals = get_cached_signals()
        if not signals:
            signals = build_signals()
    return {"signals": signals, "count": len(signals)}


@router.get("/signals/{symbol}")
def signal_detail(symbol: str):
    """Return detail for a single symbol from cache."""
    init_db()
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM signals WHERE symbol = ? ORDER BY fetched_at DESC LIMIT 1",
        (symbol.upper(),),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Signal not found")
    return dict(row)


@router.get("/health")
def health():
    return {"status": "ok"}
