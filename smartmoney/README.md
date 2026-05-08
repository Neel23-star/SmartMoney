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
