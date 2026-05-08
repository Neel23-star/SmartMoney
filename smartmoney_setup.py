"""
Smart Money Screener - Complete Setup Script
Run this once: python smartmoney_setup.py
It will create the entire project structure with all code.
"""

import os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartmoney")

FILES = {}

# ── Backend ──────────────────────────────────────────────────────────────────

FILES["backend/requirements.txt"] = """\
fastapi==0.111.0
uvicorn==0.29.0
httpx==0.27.0
yfinance==0.2.40
pandas==2.2.2
apscheduler==3.10.4
python-dotenv==1.0.1
"""

FILES["backend/app/__init__.py"] = ""

# ── Database helper ───────────────────────────────────────────────────────────

FILES["backend/app/database.py"] = '''\
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "smartmoney.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            asset_type TEXT NOT NULL,
            signal_reason TEXT,
            score REAL DEFAULT 0,
            price REAL,
            volume_spike REAL,
            deal_qty INTEGER,
            deal_value REAL,
            source_url TEXT,
            fetched_at TEXT DEFAULT (datetime(\'now\', \'localtime\'))
        )
    """)
    conn.commit()
    conn.close()
'''

# ── NSE Bulk/Block Deal Service ───────────────────────────────────────────────

FILES["backend/app/services/__init__.py"] = ""

FILES["backend/app/services/nse_service.py"] = '''\
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
    """Fetch today\'s bulk deals from NSE."""
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
    """Fetch today\'s block deals from NSE."""
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
'''

# ── Volume Spike Service ──────────────────────────────────────────────────────

FILES["backend/app/services/volume_service.py"] = '''\
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
    Download 30-day data for symbols and find stocks where today\'s
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
'''

# ── Signal Ranker ─────────────────────────────────────────────────────────────

FILES["backend/app/services/signal_ranker.py"] = '''\
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
        reason = f"Volume {spike[\'volume_ratio\']}x avg"
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
'''

# ── Scheduler ─────────────────────────────────────────────────────────────────

FILES["backend/app/scheduler.py"] = '''\
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from .services.signal_ranker import build_signals
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


def start_scheduler():
    scheduler.add_job(
        build_signals,
        CronTrigger(day_of_week="mon-fri", hour=9, minute=20),
        id="morning_fetch",
        replace_existing=True,
    )
    scheduler.add_job(
        build_signals,
        CronTrigger(day_of_week="mon-fri", hour=15, minute=35),
        id="closing_fetch",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — fetches at 9:20 AM and 3:35 PM IST on weekdays")
'''

# ── API Router ────────────────────────────────────────────────────────────────

FILES["backend/app/routers/__init__.py"] = ""

FILES["backend/app/routers/signals.py"] = '''\
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
'''

# ── Main FastAPI App ──────────────────────────────────────────────────────────

FILES["backend/app/main.py"] = '''\
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import signals
from .scheduler import start_scheduler
from .database import init_db
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Smart Money Screener API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)


@app.on_event("startup")
def startup():
    init_db()
    start_scheduler()
'''

FILES["backend/run.py"] = '''\
import uvicorn
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
'''

# ── Frontend ──────────────────────────────────────────────────────────────────

FILES["frontend/package.json"] = '''\
{
  "name": "smartmoney-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.7.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1",
    "tailwindcss": "^3.4.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39"
  }
}
'''

FILES["frontend/vite.config.js"] = '''\
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
'''

FILES["frontend/tailwind.config.js"] = '''\
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
'''

FILES["frontend/postcss.config.js"] = '''\
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
'''

FILES["frontend/index.html"] = '''\
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart Money Screener</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📈</text></svg>" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'''

FILES["frontend/src/main.jsx"] = '''\
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
'''

FILES["frontend/src/index.css"] = '''\
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: system-ui, sans-serif;
}
'''

FILES["frontend/src/api.js"] = '''\
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

export const fetchSignals = (refresh = false) =>
  axios.get(`${BASE}/api/signals${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchSignalDetail = (symbol) =>
  axios.get(`${BASE}/api/signals/${symbol}`).then((r) => r.data);
'''

FILES["frontend/src/App.jsx"] = '''\
import React, { useState, useEffect, useCallback } from "react";
import { fetchSignals } from "./api";
import SignalCard from "./components/SignalCard";
import SignalDetail from "./components/SignalDetail";
import Header from "./components/Header";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSignals = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSignals(refresh);
      setSignals(data.signals || []);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      setError("Could not load signals. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSignals(); }, [loadSignals]);

  return (
    <div className="min-h-screen">
      <Header
        onRefresh={() => loadSignals(true)}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 mb-6 text-red-300">
            ⚠️ {error}
          </div>
        )}

        {loading && signals.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4 animate-pulse">📡</div>
            <p className="text-lg">Scanning markets for smart money moves...</p>
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">No signals yet. Markets may be closed.</p>
            <button
              onClick={() => loadSignals(true)}
              className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition"
            >
              Try Refresh
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">
              🎯 Showing <span className="text-emerald-400 font-semibold">{signals.length}</span> smart money signals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((s) => (
                <SignalCard key={s.symbol} signal={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          </>
        )}
      </main>

      {selected && (
        <SignalDetail signal={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
'''

FILES["frontend/src/components/Header.jsx"] = '''\
import React from "react";

export default function Header({ onRefresh, loading, lastUpdated }) {
  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">📈 Smart Money Screener</h1>
          <p className="text-xs text-slate-400">Institutional activity detector — NSE &amp; MCX</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <span>⟳</span>
            )}
            {loading ? "Scanning..." : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );
}
'''

FILES["frontend/src/components/SignalCard.jsx"] = '''\
import React from "react";

const TYPE_COLORS = {
  Stock: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  FnO: "bg-purple-600/20 text-purple-300 border-purple-500/30",
  Commodity: "bg-yellow-600/20 text-yellow-300 border-yellow-500/30",
};

const SCORE_COLOR = (score) => {
  if (score >= 40) return "text-red-400";
  if (score >= 20) return "text-orange-400";
  return "text-emerald-400";
};

export default function SignalCard({ signal, onClick }) {
  const typeStyle = TYPE_COLORS[signal.asset_type] || TYPE_COLORS.Stock;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
            {signal.symbol}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeStyle}`}>
            {signal.asset_type}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${SCORE_COLOR(signal.score)}`}>
            {signal.score}
          </div>
          <div className="text-xs text-slate-500">score</div>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-3">{signal.signal_reason}</p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-3">
          {signal.price && (
            <span>₹{signal.price?.toLocaleString("en-IN")}</span>
          )}
          {signal.volume_spike && (
            <span className="text-emerald-400">🔥 {signal.volume_spike}x vol</span>
          )}
        </div>
        <span className="text-emerald-500 group-hover:text-emerald-400">
          View details →
        </span>
      </div>
    </button>
  );
}
'''

FILES["frontend/src/components/SignalDetail.jsx"] = '''\
import React from "react";

export default function SignalDetail({ signal, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">{signal.symbol}</h2>
            <span className="text-sm text-slate-400">{signal.asset_type}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Signal reason */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Signal</p>
          <p className="text-white font-medium">{signal.signal_reason}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Confidence Score" value={signal.score} highlight />
          {signal.price && (
            <Stat label="Price" value={`₹${signal.price?.toLocaleString("en-IN")}`} />
          )}
          {signal.volume_spike && (
            <Stat label="Volume Spike" value={`${signal.volume_spike}x average`} />
          )}
          {signal.deal_value > 0 && (
            <Stat
              label="Deal Value"
              value={`₹${(signal.deal_value / 1e7).toFixed(1)} Cr`}
            />
          )}
        </div>

        {/* Last updated */}
        {signal.fetched_at && (
          <p className="text-xs text-slate-500 mb-4">
            Last fetched: {signal.fetched_at}
          </p>
        )}

        {/* Source link */}
        {signal.source_url && (
          <a
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition"
          >
            🔗 View Source Data →
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="bg-slate-700/40 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? "text-emerald-400 text-xl" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
'''

# ── Root README ───────────────────────────────────────────────────────────────

FILES["README.md"] = '''\
# 📈 Smart Money Screener

Detects institutional bulk/block deals and volume spikes on NSE every day.

## Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
Backend runs at http://localhost:8000
API docs at http://localhost:8000/docs

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

## How it works
1. Backend fetches NSE bulk deals, block deals, and volume spikes via yfinance
2. Signals are scored and ranked
3. Top 15 signals shown on dashboard
4. Click any signal to see details and original source link
5. Auto-refreshes at 9:20 AM & 3:35 PM IST on market days
'''

FILES["START_SMARTMONEY.bat"] = '''\
@echo off
echo Starting Smart Money Screener...
echo.
echo Starting Backend (Python FastAPI)...
cd /d "%~dp0backend"
start "SmartMoney Backend" cmd /k "pip install -r requirements.txt && python run.py"
echo.
timeout /t 5 >nul
echo Starting Frontend (React)...
cd /d "%~dp0frontend"
start "SmartMoney Frontend" cmd /k "npm install && npm run dev"
echo.
echo Done! Open http://localhost:5173 in your browser.
echo.
pause
'''

# ── Write all files ───────────────────────────────────────────────────────────

def write_files():
    written = 0
    for rel_path, content in FILES.items():
        full_path = os.path.join(BASE, rel_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {rel_path}")
        written += 1
    print(f"\n🎉 Created {written} files in: {BASE}")
    print("\nNext steps:")
    print("  1. Double-click START_SMARTMONEY.bat  (starts both servers)")
    print("  2. Open http://localhost:5173 in your browser")
    print("  3. Click Refresh to load today's signals")

if __name__ == "__main__":
    print("🚀 Setting up Smart Money Screener...\n")
    write_files()
