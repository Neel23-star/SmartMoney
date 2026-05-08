import yfinance as yf
import pandas as pd
import logging

logger = logging.getLogger(__name__)

NIFTY50_SYMBOLS = [
    "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
    "HINDUNILVR.NS","ITC.NS","SBIN.NS","BAJFINANCE.NS","BHARTIARTL.NS",
    "KOTAKBANK.NS","LT.NS","AXISBANK.NS","ASIANPAINT.NS","MARUTI.NS",
    "TITAN.NS","SUNPHARMA.NS","ULTRACEMCO.NS","NESTLEIND.NS","WIPRO.NS",
    "HCLTECH.NS","POWERGRID.NS","NTPC.NS","TECHM.NS","TATAMOTORS.NS",
    "ADANIENT.NS","ONGC.NS","ADANIPORTS.NS","JSWSTEEL.NS","TATASTEEL.NS",
    "COALINDIA.NS","BAJAJFINSV.NS","GRASIM.NS","BPCL.NS","DIVISLAB.NS",
    "DRREDDY.NS","CIPLA.NS","SBILIFE.NS","HDFCLIFE.NS","EICHERMOT.NS",
    "APOLLOHOSP.NS","HINDALCO.NS","INDUSINDBK.NS","M&M.NS","BRITANNIA.NS",
    "HEROMOTOCO.NS","TATACONSUM.NS","UPL.NS","BAJAJ-AUTO.NS","LTIM.NS",
]


def detect_volume_spikes(symbols: list[str] = None, threshold: float = 3.0) -> list[dict]:
    """
    Download 30-day data for symbols and find stocks where today's
    volume is `threshold` times higher than the 20-day average.
    """
    if symbols is None:
        symbols = NIFTY50_SYMBOLS

    spikes = []
    try:
        data = yf.download(symbols, period="22d", group_by="ticker", progress=False, auto_adjust=True)
    except Exception as e:
        logger.error(f"yfinance download error: {e}")
        return []

    for sym in symbols:
        try:
            if len(symbols) == 1:
                df = data
            else:
                df = data[sym]

            if df is None or df.empty or len(df) < 5:
                continue

            df = df.dropna(subset=["Volume"])
            avg_vol = df["Volume"].iloc[:-1].mean()
            today_vol = df["Volume"].iloc[-1]
            today_close = df["Close"].iloc[-1]

            if avg_vol > 0 and today_vol >= threshold * avg_vol:
                ratio = round(today_vol / avg_vol, 2)
                spikes.append({
                    "symbol": sym.replace(".NS", ""),
                    "price": round(float(today_close), 2),
                    "today_volume": int(today_vol),
                    "avg_volume": int(avg_vol),
                    "volume_ratio": ratio,
                    "source_url": f"https://finance.yahoo.com/quote/{sym}",
                })
        except Exception as e:
            logger.warning(f"Volume check failed for {sym}: {e}")
            continue

    logger.info(f"Found {len(spikes)} volume spikes")
    return sorted(spikes, key=lambda x: x["volume_ratio"], reverse=True)
