# AI Approval Assistant

Enterprise AI-powered approval workflow automation — Hackathon Demo.

## Quick Start

### 1. Generate all project files
```bash
node run.js
```

### 2. Install & start backend (Terminal 1)
```bash
cd backend
npm install
node server.js
```

### 3. Install & start frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### 4. Open browser
http://localhost:5173

## Features
- AI-powered request analysis, risk scoring & routing
- Multi-level approval workflow visualization
- Enterprise dashboard with live statistics
- Attachment upload support
- 8 pre-seeded demo requests

## Demo Scenarios
1. Amount > $50,000 → High Risk flagged
2. "urgent" / "critical" in description → Rush routing
3. No attachment submitted → Warning generated

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- AI: Rule-based mock AI engine
