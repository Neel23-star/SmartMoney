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
            fetched_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    """)
    conn.commit()
    conn.close()
