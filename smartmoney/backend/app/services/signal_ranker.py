import logging
from .nse_service import fetch_bulk_deals, fetch_block_deals
from .volume_service import detect_volume_spikes
from ..database import get_conn, init_db
from datetime import datetime

logger = logging.getLogger(__name__)


def build_signals() -> list[dict]:
    """Fetch all data sources and produce ranked signals."""
    init_db()

    bulk = fetch_bulk_deals()
    block = fetch_block_deals()
    spikes = detect_volume_spikes()

    signals: dict[str, dict] = {}

    # --- Process bulk/block deals ---
    for deal in bulk + block:
        sym = deal["symbol"]
        if not sym:
            continue
        if sym not in signals:
            signals[sym] = {
                "symbol": sym,
                "asset_type": "Stock",
                "score": 0,
                "signal_reason": [],
                "price": deal["price"],
                "volume_spike": None,
                "deal_qty": 0,
                "deal_value": 0,
                "source_url": deal["source_url"],
            }
        deal_val = deal["qty"] * deal["price"]
        signals[sym]["deal_qty"] += deal["qty"]
        signals[sym]["deal_value"] += deal_val
        label = deal["deal_type"] + " Deal"
        if label not in signals[sym]["signal_reason"]:
            signals[sym]["signal_reason"].append(label)
        # Score: ₹1 Cr = 1 point, cap at 50
        signals[sym]["score"] += min(deal_val / 1e7, 50)

    # --- Process volume spikes ---
    for spike in spikes:
        sym = spike["symbol"]
        if sym not in signals:
            signals[sym] = {
                "symbol": sym,
                "asset_type": "Stock",
                "score": 0,
                "signal_reason": [],
                "price": spike["price"],
                "volume_spike": spike["volume_ratio"],
                "deal_qty": 0,
                "deal_value": 0,
                "source_url": spike["source_url"],
            }
        signals[sym]["volume_spike"] = spike["volume_ratio"]
        reason = f"Volume {spike['volume_ratio']}x avg"
        if reason not in signals[sym]["signal_reason"]:
            signals[sym]["signal_reason"].append(reason)
        # Score: 3x = 10pts, scales up
        signals[sym]["score"] += min((spike["volume_ratio"] - 2) * 5, 50)

    # --- Finalize ---
    result = []
    for s in signals.values():
        s["signal_reason"] = " | ".join(s["signal_reason"]) or "Unusual Activity"
        s["score"] = round(s["score"], 1)
        result.append(s)

    result.sort(key=lambda x: x["score"], reverse=True)
    top = result[:15]

    # --- Persist to DB ---
    _save_signals(top)
    return top


def _save_signals(signals: list[dict]):
    conn = get_conn()
    conn.execute("DELETE FROM signals")  # replace with fresh data each run
    for s in signals:
        conn.execute(
            """INSERT INTO signals
               (symbol, asset_type, signal_reason, score, price, volume_spike,
                deal_qty, deal_value, source_url, fetched_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                s["symbol"], s["asset_type"], s["signal_reason"],
                s["score"], s["price"], s["volume_spike"],
                s["deal_qty"], s["deal_value"], s["source_url"],
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
    conn.commit()
    conn.close()
    logger.info(f"Saved {len(signals)} signals to DB")


def get_cached_signals() -> list[dict]:
    """Return signals from DB without re-fetching."""
    init_db()
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM signals ORDER BY score DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
