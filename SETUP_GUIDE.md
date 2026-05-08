# AI Approval Assistant - Project Setup Guide

Since the automated initialization encountered environment issues, please follow these manual setup steps on your local machine.

## Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Git (optional)

## Project Structure (To Create)

```
C:\Users\ngadewar\Desktop\Hackathon\
├── backend/
│   ├── routes/
│   │   ├── requests.js
│   │   └── dashboard.js
│   ├── package.json
│   ├── server.js
│   ├── mockAI.js
│   ├── database.js
│   └── approvals.db (auto-created on first run)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RequestForm.jsx
│   │   │   ├── AIAnalysisCard.jsx
│   │   │   ├── WorkflowScreen.jsx
│   │   │   └── RequestsList.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md

## Quick Start (Automatic)

### Method 1: Using Node.js
Run from the Hackathon directory:
```bash
cd C:\Users\ngadewar\Desktop\Hackathon
node initialize.js
```

### Method 2: Using Python
```bash
python setup.py
```

### Method 3: Using Batch File
```bash
init.bat
```

## Manual Setup (Step by Step)

### Step 1: Create Backend Structure
```bash
cd C:\Users\ngadewar\Desktop\Hackathon
mkdir backend\routes
mkdir frontend\src\components
```

### Step 2: Copy Backend Files
Copy content from files provided and create:
- backend/package.json
- backend/server.js
- backend/database.js
- backend/mockAI.js
- backend/routes/requests.js
- backend/routes/dashboard.js

### Step 3: Copy Frontend Files
Copy content from files provided and create:
- frontend/package.json
- frontend/vite.config.js
- frontend/tailwind.config.js
- frontend/postcss.config.js
- frontend/index.html
- frontend/src/main.jsx
- frontend/src/App.jsx
- frontend/src/index.css
- frontend/src/components/Sidebar.jsx
- frontend/src/components/Dashboard.jsx
- frontend/src/components/RequestForm.jsx
- frontend/src/components/AIAnalysisCard.jsx
- frontend/src/components/WorkflowScreen.jsx
- frontend/src/components/RequestsList.jsx

### Step 4: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 5: Install Frontend Dependencies
```bash
cd ..\frontend
npm install
```

### Step 6: Start Backend Server
```bash
cd ..\backend
npm start
```

Server will run on http://localhost:3001

### Step 7: Start Frontend Dev Server (in new terminal)
```bash
cd ..\frontend
npm run dev
```

Frontend will run on http://localhost:5173

## Accessing the Application

1. Open http://localhost:5173 in your browser
2. Use the dashboard to view all approval requests
3. Click "New Request" to submit a request
4. The AI engine will analyze and route each request
5. View workflow details for each request

## Demo Data

The application includes 8 pre-seeded requests:
- REQ-001: High-risk NOPO (Procurement)
- REQ-002: Rush request (IT)
- REQ-003: Standard approved (Marketing)
- REQ-004: High-risk PERN pending (Finance)
- REQ-005: High-risk Rush pending (Operations)
- REQ-006: Standard pending (HR)
- REQ-007: High-risk NOPO rejected (Legal)
- REQ-008: Standard approved (IT)

## Features

✅ **AI-Powered Analysis**
- Automatic risk assessment (Low/Medium/High)
- Intelligent routing recommendations
- Warning detection and alerts

✅ **Multi-Level Approvals**
- Level 1: Direct Manager
- Level 2: Department Head
- Level 3: Finance & Compliance (for high-risk)

✅ **Enterprise Dashboard**
- Real-time statistics
- Request filtering and search
- Status tracking

✅ **Workflow Management**
- Request status updates
- Approval timeline visualization
- Attachment support

## Troubleshooting

**Backend won't start:**
- Ensure Node.js is installed: `node --version`
- Check port 3001 is not in use
- Try: `npm install` again in backend folder

**Frontend won't start:**
- Ensure you're in frontend folder
- Try: `npm install` again
- Check port 5173 is not in use
- Clear npm cache: `npm cache clean --force`

**Database issues:**
- Delete `approvals.db` and restart server
- Database will be recreated and seeded

## API Endpoints

**Dashboard**
- GET /api/dashboard/stats

**Requests**
- GET /api/requests - List all
- POST /api/requests - Create new
- GET /api/requests/:id - Get details
- PATCH /api/requests/:id/status - Update status

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **AI**: Mock rule-based engine
- **UI Components**: Lucide React icons

## Support

For issues or questions, refer to the README.md in the root directory.
